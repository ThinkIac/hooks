'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const build = path.join(process.env.LOGOS_ROOT, 'vendor/packages/logos/dist/src');
const { Container } = require(path.join(build, 'kernel/container.js'));
const { discoverExternalRuntimeModules, installExternalModules } =
    require(path.join(build, 'kernel/external-modules.js'));

test('Lógos discovers and executes hooks from the installed npm tarball', async () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'logos-hooks-'));
    const originalCwd = process.cwd();
    const originalPackagesPath = process.env.PACKAGES_PATH;
    try {
        const [artifact] = JSON.parse(execFileSync('npm', [
            'pack', '--json', '--ignore-scripts', '--pack-destination', workspace,
        ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' }));
        assert.deepEqual(artifact.files.map(file => file.path).sort(), [
            'LICENSE', 'README.md', 'package.json', 'src/index.type',
        ]);
        fs.writeFileSync(path.join(workspace, 'package.json'), '{"private":true}');
        execFileSync('npm', [
            'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund',
            path.join(workspace, artifact.filename),
        ], { cwd: workspace });

        const root = path.join(workspace, 'node_modules/@thinkiac');
        const installed = path.join(root, 'module-hooks');
        const entries = discoverExternalRuntimeModules([root]);
        assert.deepEqual(entries, [installed]);

        const pkg = { folder: 'counter', dir: path.join(workspace, 'counter') };
        fs.mkdirSync(pkg.dir);
        fs.writeFileSync(path.join(pkg.dir, 'hooks.cjs'), [
            '/** @register_hook tick */',
            'exports.increment = function increment(n) { return n + 1; };',
        ].join('\n'));
        process.env.PACKAGES_PATH = workspace;
        const container = new Container({ workspace });
        const originalTypeHook = require.extensions['.type'];

        process.chdir(process.env.LOGOS_HOST_ROOT || process.env.LOGOS_ROOT);
        installExternalModules(container, entries);
        await container.bus.emitStrict('logos:modules:register');
        assert.equal(container.state('runtime:accepted-types').get('hook'), 'hooks');
        await container.installPhase('wire');

        await container.bus.emitStrict('package:wiring', { pkg });
        assert.equal(await container.bus.pipeline('tick', 0), 1);
        await container.bus.emitStrict('logos:package:swapping', { pkg });
        assert.equal(await container.bus.pipeline('tick', 0), 1);
        assert.equal(require.extensions['.type'], originalTypeHook);
    } finally {
        process.chdir(originalCwd);
        if (originalPackagesPath === undefined) delete process.env.PACKAGES_PATH;
        else process.env.PACKAGES_PATH = originalPackagesPath;
        fs.rmSync(workspace, { recursive: true, force: true });
    }
});
