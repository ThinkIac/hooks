# @thinkiac/module-hooks

Implementação do módulo hooks do Lógos em `.type`, compilada com LogosType.
Migração compatível da API existente, sem novos eventos ou permissões.

```sh
npm install ThinkIac/hooks#main
npm test
npm run test:isolated
```

O pacote distribui `dist/index.cjs`, fontes e wrappers legados em `compat/`.
`provideHooks(host)` é o provedor declarativo; `createRuntimeModule` é seu alias de biblioteca.
`createHost` usa o SDK externo runtime-compat, fixado por commit.
O registro existente é preservado por `@register module` com contexto capability.

## Comportamento

`api.wirePackageHooks(pkg)` substitui o scope anterior e registra cada hook com
owner, prioridade (padrão 100) e operação transform. Condições são avaliadas antes
dos middlewares; o retorno do handler participa da pipeline do barramento.
Um runner isolado tem preferência sobre o scanner. Erro de scanner retorna zero;
erro na descoberta de middleware mantém a cadeia vazia, como antes.

Escuta `package:wiring` (prioridade 40), `logos:package:swapping` e
`logos:package:validating`. A validação exige autoridade events/transform para
cada evento. Encerramento e remoção pertencem ao EffectScope do host.

O núcleo não importa fs nem processos; ainda usa Date e Promises JavaScript.

## Desenvolvimento e compatibilidade

`npm run build` compila src/*.type; `npm test` testa o artefato compilado.
A CI executa testes e instalação isolada. Os wrappers CommonJS legados são
preservados deliberadamente, não convertidos em uma segunda implementação.
O compilador é ferramenta de build; não é exigido para carregar o artefato.
