# Documentação — DiárioDoProf

Índice central. Cada doc abaixo cobre um pedaço do sistema; comece pelo contexto inicial.

> Última atualização: 2026-05-03

## Documentos

| Doc | Tema |
|---|---|
| [`setup.md`](setup.md) | Como rodar local: env vars, Postgres, migrations, seeds, troubleshooting |
| [`contexto-inicial.md`](contexto-inicial.md) | Visão de produto, premissas, stack, decisões fechadas, pendências |
| [`parametros.md`](parametros.md) | Cadastros (turmas, alunos, períodos, atividades, grupos), modelo de dados, server actions |
| [`notas.md`](notas.md) | Grid de notas, modos MEDIA/SOMA, atribuição, reescala automática, notas em grupo |
| [`analise-turma.md`](analise-turma.md) | Dashboard analítico da turma (médias, distribuição, ranking, evolução) |
| [`dashboard-aluno.md`](dashboard-aluno.md) | Dashboard individual do aluno (média anual, rank, tendência, atividades) |
| [`dashboard-atividades.md`](dashboard-atividades.md) | Análise de uma atividade específica (KPIs, histograma, distribuição, grupos) |
| [`ajuda.md`](ajuda.md) | Central de ajuda, FAQ, página de vídeos (player + listas) |
| [`perfil-e-auth.md`](perfil-e-auth.md) | Autenticação (NextAuth + Credentials), tela de perfil, avatar de iniciais |
| [`ui-e-tema.md`](ui-e-tema.md) | Layout, tema teal, sidebar/navbar, componentes compartilhados, animações |

## Estrutura do projeto

```
DiárioDoProf/
├── app/
│   ├── (auth)/          → /login, /signup (layout split diagonal)
│   └── (dashboard)/     → área protegida
│       ├── turmas/      → cadastros (alunos, períodos, atividades, grupos)
│       ├── notas/       → grid de lançamento
│       ├── analise-turma/
│       ├── dashboard-aluno/
│       ├── dashboard-atividades/
│       └── perfil/
├── actions/             → server actions (escopadas por professorId)
├── components/          → UI (turmas/, alunos/, periodos/, atividades/, notas/, analise/, dashboard-aluno/, dashboard-atividade/, perfil/, partials/, ui/)
├── lib/                 → prisma, auth, session, helpers de cálculo, formatadores, datas, filtros
├── prisma/              → schema e migrations (15 aplicadas)
├── provider/            → providers do Next (auth, theme, dashboard layout)
├── scripts/             → seeds e utilidades
└── docs/                → este diretório
```

## Convenções gerais

- **Multi-tenant** — todas as entidades carregam `professorId`. Toda action chama `getProfessorIdOrThrow()` e filtra por isso.
- **Server actions** — mutações em `actions/<entidade>.ts`, validação Zod, `revalidatePath` cruzado nas rotas relacionadas.
- **Forms** — React Hook Form + Zod, `mode: "onSubmit"` e `reValidateMode: "onSubmit"`. Modais resetam estado ao fechar.
- **Datas** — guardadas em UTC midnight, exibidas em LOCAL midnight. Helpers em `lib/dates.ts`.
- **Modais de feedback** — `AlertDialog` para erros e sucessos críticos; toasts para CRUD comum.
- **Atribuição respeitada** — atividades não atribuídas a um aluno não entram em nenhum cálculo nem aparecem nos dashboards dele.
- **Reescala de notas** automática quando o cap efetivo muda (modo do bimestre, peso da atividade, mover entre bimestres).
- **Cascade limpo** — desatribuir aluno remove ele de grupos; deletar atividade leva tudo (notas, atribuições, grupos).
