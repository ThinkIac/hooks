# Contrato do módulo hooks

O Lógos carrega `src/index.type` pelo `runtime.entry` do manifesto. Use
`###*` no comentário da declaração para que a compilação preserve o JSDoc
lido pelo carregador. O provedor recebe os ports do host via
`@context capability`.

`wirePackageHooks(pkg)` substitui o scope anterior e registra cada hook com
owner, prioridade (padrão 100) e operação `transform`. O módulo avalia as
condições antes dos middlewares e retorna o resultado do handler para a
pipeline do barramento. O runner isolado tem preferência sobre o scanner.
Se o scanner falhar, o módulo retorna zero. Se a descoberta de middlewares
falhar, a cadeia fica vazia.

O módulo escuta `package:wiring` (prioridade 40), `logos:package:swapping`
e `logos:package:validating`. A validação exige autoridade `events/transform`
para cada evento. O EffectScope do host controla o encerramento e a remoção.

## Testes

A CI usa a revisão do Lógos que incorporou o suporte à carga de `.type` e o
adaptador fixado pelo perfil correspondente. Com esse checkout compilado e
o adaptador instalado, execute:

```sh
LOGOS_ROOT=/caminho/absoluto/ThinkIac npm test
```

Se o adaptador estiver instalado em outro checkout, aponte
`LOGOS_HOST_ROOT` para ele. O teste de distribuição empacota e instala o
tarball sem executar scripts de instalação. Em seguida, verifica o conteúdo,
descobre o módulo pelo manifesto, dispara um hook e confirma que a troca do
pacote substitui a inscrição anterior.
