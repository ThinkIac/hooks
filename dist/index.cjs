var createHost, provideHooks;

provideHooks = function(host) {
  /*
  @register module hooks
  @accepts hook
  @context capability
  */
  var wire;
  wire = async function(pkg) {
    var hook, hooks, i, len, previous, ref, runner, scope;
    previous = host.scopes.get(pkg.folder);
    if (previous) {
      await host.scopes.dispose(pkg.folder, 'hooks_rewired');
    } else {
      host.scopes.removeOwner(pkg.folder);
    }
    scope = host.scopes.create(pkg.folder, String(Date.now()));
    runner = host.http.isolatedRunner(pkg.folder);
    try {
      hooks = (runner != null ? (ref = runner.surfaces) != null ? ref.hooks.map(function(hook) {
        return {
          ...hook,
          call: function(payload, context) {
            return runner.invoke(hook.id, [payload], context);
          }
        };
      }) : void 0 : void 0) || (await host.scanHooks(pkg.folder));
    } catch (error) {
      return 0;
    }
    for (i = 0, len = hooks.length; i < len; i++) {
      hook = hooks[i];
      (function(hook) {
        var ref1;
        return host.on(hook.event, (async function(payload, context = {}) {
          var middleware, pkgContext, result;
          pkgContext = {
            ...context,
            pkg,
            matchedEvent: hook.event
          };
          if (!(await host.resolveConditions(hook.condition || {}, pkgContext))) {
            return void 0;
          }
          result = void 0;
          middleware = [];
          try {
            middleware = (await host.http.resolveMiddlewares(pkg.folder, pkgContext));
          } catch (error) {

          }
          // Missing middleware retains the legacy empty chain.
          await host.http.runMiddlewares(middleware, pkgContext, async function() {
            return result = (await hook.call(payload, pkgContext));
          });
          return result;
        }), {
          owner: pkg.folder,
          priority: (ref1 = hook.priority) != null ? ref1 : 100,
          operation: 'transform',
          scope
        });
      })(hook);
    }
    return hooks.length;
  };
  return {
    name: 'hooks',
    phase: 'wire',
    api: {
      wirePackageHooks: wire
    },
    install: function() {
      host.on('logos:package:validating', async function({pkg, result}) {
        var hook, hooks, i, len, ref, runner;
        runner = host.http.isolatedRunner(pkg.folder);
        hooks = (runner != null ? (ref = runner.surfaces) != null ? ref.hooks : void 0 : void 0) || (await host.scanHooks(pkg.folder));
        for (i = 0, len = hooks.length; i < len; i++) {
          hook = hooks[i];
          host.tools.authority().enforce({
            principal: {
              kind: 'package',
              id: pkg.folder
            },
            surface: 'events',
            operation: 'transform',
            resource: hook.event
          });
        }
        return result.hooks = hooks.length;
      });
      host.on('package:wiring', (function({pkg}) {
        return wire(pkg);
      }), {
        priority: 40
      });
      host.on('logos:package:swapping', function({pkg}) {
        return wire(pkg);
      });
    }
  };
};

createHost = function(...args) {
  return require('@thinkiac/module-runtime-compat').createHost(...args);
};

module.exports = {
  provideHooks,
  createHost,
  createRuntimeModule: provideHooks
};
