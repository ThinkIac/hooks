# @thinkiac/module-hooks

Módulo de hooks de eventos do Lógos, distribuído como fonte LogosType.

O tarball contém `package.json`, `src/index.type`, este README e a licença.
O manifesto declara `runtime.role: "module"` e
`runtime.entry: "src/index.type"`. O Lógos descobre o manifesto e compila o
entrypoint em memória. A declaração `@register module hooks` registra o módulo
e `@accepts hook` informa o tipo de recurso aceito.

A versão 0.2 requer um Lógos com suporte a entrypoints `.type` (ThinkIac/ThinkIac
#77) e o adaptador `@thinkiac/module-runtime-compat` no host.
Chamadores que carregam o módulo com `require()` ou importam
`compat/hooks.cjs` precisam permanecer na versão 0.1 até migrarem para a API do
Lógos. Consulte [o contrato do módulo](https://github.com/ThinkIac/hooks/blob/main/docs/contracts.md) para o fluxo de
carregamento e os testes.
