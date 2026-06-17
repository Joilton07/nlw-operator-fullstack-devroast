# Specs — Formato

Toda nova feature começa com um arquivo `.md` em `specs/`.

## Estrutura

1. **Título** — `# Nome da Feature — Spec`
2. **Resumo** — contexto e objetivo em 1-2 parágrafos
3. **Decisões de Design** — tabela `Decisão | Escolha | Motivo`
4. **Arquitetura** — diagramas ASCII, estrutura de arquivos, fluxo de dados
5. **Implementação** — trechos de código ou pseudo-código das partes críticas
6. **To-Do List** — `- [ ]` tasks acionáveis para implementação

## Regras

- Conciso — só o necessário pra implementar sem ambiguidade
- Se o spec depender de assets de design (`.pen`), referencie o frame/screen ID
- Prefira tabelas a listas longas
- Código exemplo deve ser colável (sem placeholders tipo `...`)
- To-Dos devem ser granulados o suficiente pra virar commits
