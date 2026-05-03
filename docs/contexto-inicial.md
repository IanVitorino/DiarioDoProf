# Contexto Inicial — DiárioDoProf

Documento de visão geral do projeto. Serve como ponto de partida e referência rápida para próximas conversas e iterações.

> Última atualização: 2026-05-03
> Status: Cadastros, lançamento de notas, atribuição seletiva, atividades em grupo, análise da turma, dashboard do aluno e dashboard de atividades implementados. Boletim/exportação ainda pendentes.

## Documentos relacionados

- [`README.md`](README.md) — índice de toda a documentação
- [`parametros.md`](parametros.md) — telas de cadastro, modelo de dados, server actions, multi-tenancy
- [`notas.md`](notas.md) — grid de notas, fórmulas (MEDIA/SOMA), atribuição, reescala, notas em grupo
- [`analise-turma.md`](analise-turma.md) — dashboard analítico da turma
- [`dashboard-aluno.md`](dashboard-aluno.md) — dashboard individual do aluno
- [`dashboard-atividades.md`](dashboard-atividades.md) — análise por atividade
- [`perfil-e-auth.md`](perfil-e-auth.md) — autenticação, perfil, avatar de iniciais
- [`ui-e-tema.md`](ui-e-tema.md) — layout, tema teal, comboboxes, animações

---

## Visão do produto

Sistema para professores gerenciarem o ano letivo. Projeto pessoal, **não comercial**.

- **Foco inicial:** gestão de notas (uma "planilha de médias" inteligente)
- **Visão de longo prazo:** acompanhamento do desenvolvimento dos alunos além de notas (faltas, observações, evolução, etc)

### Premissas

- Multi-tenant: cada professor enxerga apenas seus dados
- Suporta múltiplos níveis de ensino (Fundamental I, Fundamental II, Médio)
- Suporta múltiplas turmas por professor — incluindo turmas com mesmo nome em escolas diferentes
- Turmas têm ciclo de vida — podem ser concluídas/arquivadas no fim do ano e continuam consultáveis em modo read-only
- Regras de cálculo de média devem ser flexíveis por bimestre (MEDIA/SOMA)
- Atividades podem ser **individuais ou em grupo**, e podem ser **atribuídas a alunos específicos** (ex: recuperação)
- Web primeiro, mobile possivelmente depois

---

## Modelo de domínio (alto nível)

```
Professor (tenant)
  └── Turma                     [ATIVA | CONCLUIDA, escola, turno]
        ├── Aluno(s)
        └── Periodo(s)          [4 bimestres fixos, modoCalculo: MEDIA | SOMA]
              └── Atividade(s)  [tipo: INDIVIDUAL | GRUPO; tipoAtribuicao: TODOS | SELECIONADOS]
                    ├── Nota (por aluno × atividade)
                    ├── AtividadeAluno (lista quando SELECIONADOS)
                    └── Grupo (só pra GRUPO; com notaGrupo persistido)
                          └── GrupoAluno (1 aluno por grupo na atividade)
```

Detalhes do schema em [`parametros.md`](parametros.md).

---

## Fluxos principais

1. **Onboarding** — Professor cria conta em `/signup` → auto-login → cai em `/turmas`
2. **Setup da turma** — Cria turma (série, turma, nível, disciplina via combobox, escola via combobox-com-criar, turno, ano). 4 períodos fixos auto-criados.
3. **Configura períodos** — Define `dataInicio`/`dataFim` de cada bimestre + modo MEDIA/SOMA
4. **Cadastro de alunos** — Manual via modal
5. **Atividades** — Pra cada bimestre, cria avaliações (com data dentro da vigência); decide tipo (Individual/Grupo) e quem participa (TODOS/SELECIONADOS)
6. **Grupos** — Pra atividades GRUPO, cria grupos com nome/tema e membros; pode definir "Nota do grupo" que preenche notas vazias dos membros
7. **Lançamento de notas** — Em `/notas`, escolhe turma + bimestre, edita grid aluno × atividade. Bidirecional com modal de atribuição e dashboard de atividades.
8. **Análise** — `/analise-turma`, `/dashboard-aluno` e `/dashboard-atividades` com gráficos interativos
9. **Encerramento** — Conclui turma no fim do ano → vira read-only/arquivada

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
| Charts | **Recharts** | donut interativo, bar, line, scatter |
| Comboboxes | **cmdk + Radix Popover** | busca com `stripDiacritics` |
| Datas | **Flatpickr (pt-BR)** | inline em modais (`static: true`), com máscara dd/mm/aaaa |
| State | **Zustand** + persist | tema, layout, sidebar |
| Deploy | local (dev) | VPS planejado |

---

## Decisões já fechadas

### Auth e cadastro
- **NextAuth Credentials** com email/senha. Sem OAuth.
- **Senha:** mínimo 8 caracteres, sem exigência de complexidade
- **Pós-signup:** auto-login imediato, sem verificação de email
- **Sessão:** JWT em cookie httpOnly. Carrega só `id` (não há foto pra propagar)
- **Avatar:** **iniciais do nome** com fundo teal — sem upload (decisão consciente, simplicidade)

### Modelo de dados
- **Aluno está vinculado a uma única turma** — mesma pessoa em duas turmas = dois cadastros
- **Sem campo `matricula`** no Aluno (foi removido). Identificação interna por número de chamada (derivado da ordem alfabética)
- **4 períodos fixos** por turma (1º a 4º bimestre), criados automaticamente. Trimestre/semestre não suportados.
- **`Periodo.modoCalculo`:** MEDIA ou SOMA. Default MEDIA. Trocar modo **reescala notas existentes** proporcionalmente.
- **`Periodo.dataInicio`/`dataFim`:** vigência opcional, mas atividades dentro do bimestre são validadas contra ela
- **`Atividade.data`:** validada contra a vigência do período (cliente e servidor)
- **`Atividade.tipo`:** INDIVIDUAL (default) ou GRUPO. Trocar tipo preserva grupos cadastrados em modo dormente.
- **`Atividade.tipoAtribuicao`:** TODOS (default) ou SELECIONADOS. Atribuir/desatribuir é gerido por `AtividadeAluno`.
- **`Turma.escola`:** texto livre no banco; UI sugere escolas já cadastradas e permite criar nova inline
- **`Turma.turno`:** MATUTINO/VESPERTINO/NOTURNO (opcional)

### Cálculo de média
- **MEDIA:** média aritmética simples das notas atribuídas no bimestre. Vazio = 0.
- **SOMA:** soma das notas atribuídas, com teto em 10. Vazio = 0.
- **Atribuição respeitada em todos os cálculos** — atividade que não é do aluno não entra no numerador nem no denominador.
- **Reescala automática** quando o cap efetivo da atividade muda (modo do bimestre OU peso da atividade OU mover entre períodos com modos diferentes). Fórmula: `novo = (antigo / capAntigo) × capNovo`.
- **Média anual:** média aritmética das médias dos bimestres com atividades atribuídas (bimestre vazio é ignorado).
- **Aprovação:** média anual ≥ 6.0 (referência usada na Análise).

### Grupos
- **Aluno só em 1 grupo por atividade** — UI bloqueia, server valida
- **Grupos vazios são permitidos** mas tem hard-block ao criar/editar (precisa de pelo menos 1 aluno)
- **Cascade de atribuição:** desatribuir aluno remove ele dos grupos automaticamente
- **`Grupo.notaGrupo`** persiste último valor; aplicar preenche apenas notas vazias dos membros (não sobrescreve)

### UI/UX
- **Tema padrão:** teal customizado (HSL `174 64% 21%`). Customizer (gear icon) está oculto.
- **Layout default:** semibox (sidebar com `m-6` flutuando)
- **Sidebar:** colapsável com animação suave (transition 300ms ease-in-out). Logo acompanha encolhendo.
- **Header:** sem search/inbox/notificações. Só fullscreen, theme toggle e profile. Título do módulo centralizado.
- **Modais de feedback:** `AlertDialog` para erros e sucessos de auth. Toasts para CRUD comum.
- **Forms:** validação só no submit (não enquanto digita). Modais resetam state ao fechar.
- **Charts:** donuts interativos com hover (centro mostra %), animações suaves de entrada e troca de estado.

---

## Pendências e próximos passos

### Operacional (a fazer)
- **Notas em grupo automáticas no fluxo principal** — propagar nota do grupo no grid `/notas` (hoje só aparece no modal do grupo)
- **Boletim do aluno** — visão consolidada (todas as notas + médias) imprimível
- **Exportação PDF / planilha** dos boletins e da análise
- **Importação CSV de alunos** — cadastro em massa
- **Faltas/frequência** — entra no MVP de "desenvolvimento do aluno", fase 2
- **Verificação de email** no signup — quando houver SMTP

### Modelagem / arquitetura (a decidir)
- **Aluno como pessoa global + Matrícula separada** — pra histórico cross-turmas e transferência no meio do ano
- **Recuperação semântica** — hoje é resolvida via "atividade SELECIONADOS pra alunos específicos", mas pode ganhar fluxo dedicado
- **Disciplinas múltiplas por turma** — caso Fundamental I (1 professor, várias matérias)
- **Pesos entre bimestres** — hoje todos contam igual

### UI/UX (incremento)
- **Breadcrumbs** consistentes
- **Mobile responsivo** — testado superficialmente, refinamento futuro
- **Filtros e busca** na tabela de atividades quando passar de ~20
