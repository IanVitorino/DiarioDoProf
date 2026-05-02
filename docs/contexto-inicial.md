# Contexto Inicial — DiárioDoProf

Documento de visão geral do projeto. Serve como ponto de partida e referência rápida para próximas conversas e iterações.

> Última atualização: 2026-05-02
> Status: Funcionalidades de cadastro, lançamento de notas, análise da turma e dashboard do aluno implementadas. Boletim/exportação ainda pendentes.

## Documentos relacionados

- [`README.md`](README.md) — índice de toda a documentação
- [`parametros.md`](parametros.md) — telas de cadastro, modelo de dados, server actions, multi-tenancy
- [`notas.md`](notas.md) — grid de notas e fórmulas de cálculo (MEDIA/SOMA)
- [`analise-turma.md`](analise-turma.md) — dashboard analítico da turma
- [`dashboard-aluno.md`](dashboard-aluno.md) — dashboard individual do aluno
- [`perfil-e-auth.md`](perfil-e-auth.md) — autenticação, perfil e upload de avatar
- [`ui-e-tema.md`](ui-e-tema.md) — layout, tema teal, branding

---

## Visão do produto

Sistema para professores gerenciarem o ano letivo. Projeto pessoal, **não comercial**.

- **Foco inicial:** gestão de notas (uma "planilha de médias" inteligente).
- **Visão de longo prazo:** acompanhamento do desenvolvimento dos alunos além de notas (faltas, observações, evolução, etc.).

### Premissas

- Multi-tenant: cada professor enxerga apenas seus dados.
- Suporta múltiplos níveis de ensino (Fundamental I, Fundamental II, Médio).
- Suporta múltiplas turmas por professor.
- Turmas têm ciclo de vida — podem ser concluídas/arquivadas no fim do ano e continuam consultáveis em modo read-only.
- Regras de cálculo de média devem ser flexíveis (cada escola/professor tem peso e recuperação diferentes).
- Web primeiro, mobile possivelmente depois.
- Deploy em servidor próprio futuramente (S3 para uploads quando sair do dev local).

---

## Modelo de domínio (alto nível)

```
Professor (tenant)
  └── Turma                     [ATIVA | CONCLUIDA]
        ├── Aluno(s)
        └── Periodo(s)          [4 bimestres fixos, modoCalculo: MEDIA | SOMA]
              └── Atividade(s)  [prova, trabalho, ...] (com data dentro da vigência)
                    └── Nota (por aluno × atividade)
```

Detalhes do schema em [`parametros.md`](parametros.md).

### Por que essa modelagem

- **Professor é o tenant** → todas as queries filtram por `professorId`. É o que garante isolamento entre contas.
- **Período tem `modoCalculo` próprio** → cada bimestre pode ser configurado para MEDIA (média simples das notas) ou SOMA (soma das notas com teto em 10), independentemente. Permite flexibilidade sem mudança de schema.
- **Período tem vigência (`dataInicio`/`dataFim`)** → atividades só podem ser criadas dentro da janela do bimestre. UX evita atividade "órfã" de período.
- **`Nota` denormaliza `professorId`** → defesa em profundidade contra leak entre tenants e queries mais simples (sem JOIN obrigatório).

---

## Fluxos principais

1. **Onboarding** — Professor cria conta em `/signup` → auto-login → cai em `/turmas`.
2. **Setup da turma** — Cria turma (nome, nível, série, disciplina, ano). 4 períodos fixos são auto-criados.
3. **Configura períodos** — Define `dataInicio` e `dataFim` de cada bimestre (vigência).
4. **Configura modo de cálculo** — Por bimestre, escolhe MEDIA ou SOMA.
5. **Cadastro de alunos** — Manual via modal (CSV é evolução futura).
6. **Atividades** — Para cada bimestre, cria avaliações (com data dentro da vigência).
7. **Lançamento de notas** — Em `/notas`, escolhe turma + bimestre, edita um grid aluno × atividade.
8. **Análise** — `/analise-turma` mostra média da turma, distribuição, ranking, evolução. `/dashboard-aluno` mostra visão individual.
9. **Encerramento** — Conclui a turma no fim do ano → vira read-only/arquivada, continua consultável.

---

## Stack atual

| Camada | Tecnologia | Notas |
|---|---|---|
| Frontend + Backend | **Next.js 14 (App Router)** | server actions, RSC |
| Banco | **PostgreSQL** local | multi-tenant via `professorId` |
| ORM | **Prisma 7** | client gerado em `lib/generated/prisma`, adapter `PrismaPg` |
| Auth | **NextAuth v4 + Credentials** | bcrypt 10 rounds, JWT em cookie |
| UI | **Tailwind + shadcn/ui** | tema customizado teal |
| Forms | **React Hook Form + Zod** | `onSubmit`/`reValidateMode: onSubmit` |
| Charts | **Recharts** | donut, bar, line, area |
| Datas | **Flatpickr (pt-BR)** | inline em modais via `static: true` |
| Imagens | **sharp** | resize/processing de avatares |
| State | **Zustand** + persist | tema, layout, sidebar |
| Deploy | local (dev) | S3 e VPS planejados |

---

## Decisões já fechadas

### Auth e cadastro
- **NextAuth Credentials** com email/senha. Sem OAuth.
- **Senha:** mínimo 8 caracteres, sem exigência de complexidade.
- **Pós-signup:** auto-login imediato, sem verificação de email (entra quando houver SMTP).
- **Sessão:** JWT em cookie httpOnly. `avatarUrl` propagado via JWT.
- **Logout:** redireciona para `/login`.

### Modelo de dados
- **Aluno está vinculado a uma única turma.** Mesma pessoa em duas turmas = dois cadastros. Modelo "Aluno como pessoa global + Matrícula" foi descartado nesta fase.
- **Sem campo `matricula`** no Aluno (foi removido). Identificação interna por número de chamada (derivado da ordem alfabética).
- **4 períodos fixos** por turma (1º a 4º bimestre), criados automaticamente. Trimestre/semestre não são suportados (decisão atual).
- **`Periodo.modoCalculo`**: MEDIA ou SOMA. Default MEDIA.
- **`Periodo.dataInicio` / `dataFim`**: vigência opcional, mas atividades dentro do bimestre são validadas contra ela.
- **`Atividade.data`**: data da aplicação. Validada contra a vigência do período (cliente e servidor).

### Cálculo de média
- **MEDIA (default):** média aritmética simples das notas do bimestre. Vazio (sem nota lançada) conta como 0.
- **SOMA:** soma das notas do bimestre, com teto em 10.
- **Média anual:** média aritmética das médias dos bimestres que **têm atividades** (bimestre vazio é ignorado).
- **Aprovação:** média anual ≥ 6.0 (referência usada na Análise).
- **Sem peso, sem fórmula custom.** Adicionar coluna `peso` em Atividade é evolução futura sem migração dolorosa.

### UI/UX
- **Tema padrão:** teal customizado (HSL `174 64% 21%`). Customizer (gear icon) está oculto.
- **Layout default:** semibox (sidebar com `m-6` flutuando).
- **Sidebar:** colapsável com animação suave (transition-[width] 300ms ease-in-out). Logo acompanha encolhendo.
- **Header:** sem search/inbox/notificações. Só fullscreen, theme toggle e profile. Título do módulo centralizado.
- **Modais de feedback:** `AlertDialog` para erros e sucessos de auth. Toasts para CRUD comum.
- **Forms:** validação só no submit (não enquanto digita).

---

## Pendências e próximos passos

### Operacional (a fazer)
- **Boletim do aluno** — visão consolidada (todas as notas + médias) imprimível.
- **Exportação PDF / planilha** dos boletins e da análise.
- **Importação CSV de alunos** — cadastro em massa.
- **Faltas/frequência** — entra no MVP de "desenvolvimento do aluno", fase 2.
- **Verificação de email** no signup — quando houver SMTP.

### Modelagem / arquitetura (a decidir)
- **Aluno como pessoa global + Matrícula separada** — para histórico cross-turmas e transferência no meio do ano.
- **Recuperação** — atividade-específica? bimestre? final de ano?
- **Disciplinas múltiplas por turma** — caso Fundamental I (1 professor, várias matérias para a mesma turma).
- **Pesos em atividades** — quando trocarmos a regra de cálculo.
- **Trimestre/semestre** — hoje só bimestre.
- **Storage de avatares no S3** — hoje em `public/uploads/avatars/<id>.jpg` (filesystem local). Migrar quando deploy.

### UI/UX (incremento)
- **Breadcrumbs** consistentes (hoje só link "← Turmas" em algumas telas).
- **Filtros e busca** na lista de turmas (quando passar de ~10).
- **Mobile responsivo** — testado superficialmente, refinamento futuro.
