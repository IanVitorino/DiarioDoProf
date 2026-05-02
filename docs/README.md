# Documentação — DiárioDoProf

Índice central. Cada doc abaixo cobre um pedaço do sistema; comece pelo contexto inicial.

> Última atualização: 2026-05-02

## Documentos

| Doc | Tema |
|---|---|
| [`contexto-inicial.md`](contexto-inicial.md) | Visão de produto, premissas, stack, decisões fechadas, pendências |
| [`parametros.md`](parametros.md) | Cadastros (turmas, alunos, períodos, atividades), modelo de dados, server actions |
| [`notas.md`](notas.md) | Grid de lançamento de notas, modos MEDIA/SOMA, fórmulas de cálculo |
| [`analise-turma.md`](analise-turma.md) | Dashboard analítico da turma (médias, distribuição, ranking, evolução) |
| [`dashboard-aluno.md`](dashboard-aluno.md) | Dashboard individual do aluno (média anual, rank, tendência, atividades) |
| [`perfil-e-auth.md`](perfil-e-auth.md) | Autenticação (NextAuth + Credentials), tela de perfil, upload de avatar |
| [`ui-e-tema.md`](ui-e-tema.md) | Layout, tema teal, sidebar/navbar, animações, branding |

## Estrutura do projeto

```
DiárioDoProf/
├── app/
│   ├── (auth)/          → /login, /signup (layout split diagonal)
│   └── (dashboard)/     → área protegida (turmas, notas, análise, dashboard-aluno, perfil)
├── actions/             → server actions (escopadas por professorId)
├── components/          → UI (turmas/, alunos/, periodos/, atividades/, notas/, analise/, dashboard-aluno/, perfil/, partials/, ui/)
├── lib/                 → prisma, auth, session, helpers de cálculo, formatadores, datas
├── prisma/              → schema e migrations
├── provider/            → providers do Next (auth, theme, dashboard layout)
├── public/uploads/      → arquivos enviados (avatares)
├── scripts/             → seeds e utilidades
└── docs/                → este diretório
```

## Convenções gerais

- **Multi-tenant** — todas as entidades carregam `professorId`. Toda action chama `getProfessorIdOrThrow()` e filtra por isso.
- **Server actions** — mutações em `actions/<entidade>.ts`, validação Zod, `revalidatePath` após mutação.
- **Forms** — React Hook Form + Zod, `mode: "onSubmit"` e `reValidateMode: "onSubmit"` (não valida enquanto digita).
- **Datas** — guardadas em UTC midnight, exibidas em LOCAL midnight. Helpers em `lib/dates.ts`.
- **Modais de feedback** — `AlertDialog` para erros e sucessos críticos (auth), toasts para confirmações simples.
