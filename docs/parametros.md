# Cadastros e modelo de dados

Cobre as telas de cadastro (turmas, alunos, períodos, atividades, grupos) e o schema que as suporta.

> Última atualização: 2026-05-03

---

## 1. Visão geral

```
Login → /turmas (lista filtrável) → /turmas/[id] → tabs Alunos / Períodos / Atividades
```

O professor é o **tenant** do sistema. Toda entidade carrega `professorId` na própria tabela, permitindo isolamento por linha sem JOINs em cascata.

---

## 2. Multi-tenancy

### Princípio

Todas as entidades de domínio têm coluna `professorId` apontando direto para `Professor`. Mesmo entidades "filhas" (Aluno, Periodo, Atividade, Nota, AtividadeAluno, Grupo, GrupoAluno) carregam o `professorId` da turma pai.

### Como é aplicado no código

- Toda action chama `getProfessorIdOrThrow()` (em `lib/session.ts`) antes de qualquer query.
- Mutações usam `findFirst({ id, professorId })` ou `updateMany({ where: { id, professorId } })`. Se o registro não pertence, retorna "não encontrado" sem leak.
- `revalidatePath` após mutações invalida o cache do Next.

---

## 3. Modelo de dados

### Diagrama

```
Professor (tenant)
   ├──< Turma ─── status: ATIVA | CONCLUIDA
   │      ├──< Aluno
   │      └──< Periodo (4 fixos: ordem 1..4) — modoCalculo: MEDIA | SOMA
   │              └──< Atividade (tipo: INDIVIDUAL | GRUPO; tipoAtribuicao: TODOS | SELECIONADOS)
   │                      ├──< Nota (única por aluno × atividade)
   │                      ├──< AtividadeAluno (lista quando SELECIONADOS)
   │                      └──< Grupo (só aplica quando tipo=GRUPO; notaGrupo opcional)
   │                              └──< GrupoAluno
   ▼
   (Cascade: deletar Professor apaga tudo)
```

### Entidades

#### `Professor`

| Campo          | Tipo     | Notas                                   |
|----------------|----------|-----------------------------------------|
| `id`           | String   | UUID, PK                                |
| `email`        | String   | único, lowercase normalizado na entrada |
| `passwordHash` | String   | bcrypt (10 rounds)                      |
| `nome`         | String   |                                         |
| `createdAt`    | DateTime |                                         |
| `updatedAt`    | DateTime |                                         |

#### `Turma`

| Campo         | Tipo          | Notas                                   |
|---------------|---------------|-----------------------------------------|
| `id`          | String        | UUID, PK                                |
| `nome`        | String        | derivado: `"<serie>º <turma>"` (ex: "9º A") |
| `turma`       | String        | letra ("A", "B", ...) — default "A"     |
| `nivel`       | `NivelEnsino` | `FUNDAMENTAL_I`, `FUNDAMENTAL_II`, `MEDIO` |
| `serie`       | String        | "1" a "9", livre                        |
| `disciplina`  | String        | "Matemática" — escolhido via combobox com ~30 opções padrão |
| `escola`      | String?       | nome da escola — combobox com criar inline |
| `turno`       | `Turno?`      | `MATUTINO`, `VESPERTINO`, `NOTURNO` (opcional) |
| `ano`         | Int           | ano letivo                              |
| `status`      | `TurmaStatus` | `ATIVA` (default) ou `CONCLUIDA`        |
| `professorId` | String → FK   | dono                                    |

Index: `professorId`. Cascade: deletar Professor → suas turmas somem.

> **Disciplina** vem de `lib/disciplinas.ts` (lista padrão BNCC + itinerários do Novo EM).
> **Escola** é texto livre no banco; UI sugere as escolas já cadastradas pelo professor mas permite criar nova digitando.

#### `Aluno`

| Campo         | Tipo        | Notas                              |
|---------------|-------------|------------------------------------|
| `id`          | String      | UUID, PK                           |
| `nome`        | String      |                                    |
| `professorId` | String → FK | denormalizado da turma             |
| `turmaId`     | String → FK | turma à qual pertence              |

Index: `professorId`, `turmaId`. Cascade: deletar Turma → seus alunos somem.

> O **número de chamada** não é armazenado — é derivado da ordem alfabética dos alunos da turma a cada renderização.

#### `Periodo`

| Campo         | Tipo          | Notas                              |
|---------------|---------------|------------------------------------|
| `id`          | String        | UUID, PK                           |
| `ordem`       | Int           | 1, 2, 3, 4 (4 fixos por turma)     |
| `dataInicio`  | DateTime?     | UTC midnight, opcional             |
| `dataFim`     | DateTime?     | UTC midnight, opcional             |
| `modoCalculo` | `ModoCalculo` | `MEDIA` (default) ou `SOMA`        |
| `professorId` | String → FK   |                                    |
| `turmaId`     | String → FK   |                                    |

Constraint: `@@unique([turmaId, ordem])`. Cascade: deletar Turma → períodos somem.

#### `Atividade`

| Campo            | Tipo               | Notas                              |
|------------------|--------------------|------------------------------------|
| `id`             | String             | UUID, PK                           |
| `nome`           | String             | "Prova mensal"                     |
| `valorMaximo`    | Float              | default 10                         |
| `data`           | DateTime?          | UTC midnight, validada vs. vigência |
| `tipo`           | `TipoAtividade`    | `INDIVIDUAL` (default) ou `GRUPO`  |
| `tipoAtribuicao` | `TipoAtribuicao`   | `TODOS` (default) ou `SELECIONADOS` |
| `professorId`    | String → FK        |                                    |
| `periodoId`      | String → FK        |                                    |

Index: `professorId`, `periodoId`. Cascade: deletar Período → atividades somem.

#### `AtividadeAluno` (atribuição seletiva)

Tabela de junção materializada apenas quando `Atividade.tipoAtribuicao === SELECIONADOS`.

| Campo         | Tipo        | Notas                              |
|---------------|-------------|------------------------------------|
| `id`          | String      | UUID, PK                           |
| `atividadeId` | String → FK |                                    |
| `alunoId`     | String → FK |                                    |
| `professorId` | String → FK |                                    |

Constraint: `@@unique([atividadeId, alunoId])`. Cascade: deletar Atividade ou Aluno → some.

> Quando `tipoAtribuicao === TODOS`, a tabela está vazia e a atividade vale pra toda a turma.

#### `Grupo` (atividade em grupo)

Existe apenas pra atividades com `tipo === GRUPO`. Mantido em "modo dormente" se trocar tipo pra INDIVIDUAL.

| Campo         | Tipo        | Notas                              |
|---------------|-------------|------------------------------------|
| `id`          | String      | UUID, PK                           |
| `nome`        | String      | "Grupo 1" (default sugerido pela UI) |
| `tema`        | String?     | opcional, ex: "Mudanças climáticas" |
| `notaGrupo`   | Float?      | nota persistida — preenche notas vazias dos membros |
| `atividadeId` | String → FK |                                    |
| `professorId` | String → FK |                                    |

Index: `atividadeId`, `professorId`. Cascade: deletar Atividade → grupos somem.

#### `GrupoAluno`

| Campo         | Tipo        | Notas                              |
|---------------|-------------|------------------------------------|
| `id`          | String      | UUID, PK                           |
| `grupoId`     | String → FK |                                    |
| `alunoId`     | String → FK | aluno só pode estar em 1 grupo por atividade |
| `professorId` | String → FK |                                    |

Constraint: `@@unique([grupoId, alunoId])`. Cascade: deletar Grupo ou Aluno → some.

> Aluno só pode estar em **um** grupo por atividade. A action `createGrupo`/`updateGrupo` valida que o aluno está atribuído à atividade e não está em outro grupo.

#### `Nota`

| Campo         | Tipo        | Notas                              |
|---------------|-------------|------------------------------------|
| `id`          | String      | UUID, PK                           |
| `valor`       | Float       | nota lançada                       |
| `professorId` | String → FK |                                    |
| `alunoId`     | String → FK |                                    |
| `atividadeId` | String → FK |                                    |

Constraint: `@@unique([alunoId, atividadeId])`. Cascade: deletar Aluno OU Atividade → notas somem.

### Enums

```prisma
enum NivelEnsino { FUNDAMENTAL, FUNDAMENTAL_I, FUNDAMENTAL_II, MEDIO }
enum TurmaStatus { ATIVA, CONCLUIDA }
enum ModoCalculo { MEDIA, SOMA }
enum Turno { MATUTINO, VESPERTINO, NOTURNO }
enum TipoAtribuicao { TODOS, SELECIONADOS }
enum TipoAtividade { INDIVIDUAL, GRUPO }
```

### Cascade resumido

```
Professor ─delete──> tudo (turmas → alunos, periodos, atividades, notas, atribuições, grupos)
Turma     ─delete──> alunos, periodos (e por consequência atividades + notas + grupos)
Periodo   ─delete──> atividades (e suas notas, atribuições, grupos)
Atividade ─delete──> notas, AtividadeAluno, grupos (e GrupoAluno)
Aluno     ─delete──> suas notas + suas atribuições + suas entradas em grupos
Grupo     ─delete──> seus GrupoAluno
```

---

## 4. Telas

### Mapa de rotas

| Rota                                  | Tipo   | Propósito                                       |
|---------------------------------------|--------|-------------------------------------------------|
| `/`                                   | server | Redireciona para `/turmas`                      |
| `/turmas`                             | server | Lista de turmas (com filtro: disciplina, ensino, turno, ano, escola) |
| `/turmas/[id]`                        | server | Redireciona para `/turmas/[id]/alunos`          |
| `/turmas/[id]/alunos`                 | server | Tab Alunos da turma                             |
| `/turmas/[id]/periodos`               | server | Tab Períodos (vigências)                        |
| `/turmas/[id]/atividades`             | server | Tab Atividades — agrupadas por bimestre, com indicadores de atribuição/grupos |

Tudo dentro de `(dashboard)` é protegido pelo `middleware.ts`.

### `/turmas` — Lista filtrável

- **Filterbar** (sempre visível quando há turmas) — 5 filtros via URL search params: `disciplina`, `nivel`, `turno`, `ano`, `escola`. Botão "Limpar filtros" aparece quando há algum ativo.
- Cards em grid responsivo (1/2/3 colunas)
- Card: nome, badge de status, disciplina, `nível · turno · ano · escola`
- Click → `/turmas/[id]/alunos`
- `Nova turma` no canto superior direito → modal

#### Modal Nova turma

Campos:
- **Série** (input com máscara, 1 dígito 1–9)
- **Turma** (input 1 letra A–Z, uppercase automático)
- **Ensino** (Select: FUNDAMENTAL_I/II/MEDIO)
- **Turno** (Select: MATUTINO/VESPERTINO/NOTURNO, default MATUTINO)
- **Ano** (input com máscara 4 dígitos, default = ano atual)
- **Disciplina** (Combobox com busca, agrupado por área — Linguagens, Matemática, Ciências da Natureza, Ciências Humanas, Tecnologia, Itinerários)
- **Escola** (Combobox com **criar nova** — sugere as já cadastradas pelo professor; digitar nome novo abre opção "Criar 'X'")

### `/turmas/[id]/atividades`

- Cabeçalho por bimestre com toggle MEDIA ↔ SOMA. Trocar modo **reescala automaticamente** as notas existentes (ver `notas.md`).
- Cada atividade mostra: nome, data, valor máximo (ou "10" em modo MEDIA), **coluna Atribuição** com badges, e o dropdown de ações.
- **Coluna Atribuição:**
  - Badge "Para todos" (cinza) ou "X alunos" (verde-soft) → abre modal de atribuição
  - Se atividade for tipo GRUPO: badge adicional "X grupos" → abre modal de grupos
- **Dropdown de ações** (3 pontos): Dashboard (abre `/dashboard-atividades` em nova guia), Editar, Remover.

#### Modal de atribuição

- Lista os alunos da turma com checkboxes
- Master checkbox no topo: marca/desmarca todos (estado `indeterminate` quando alguns marcados)
- Campo "Nota" inline ao lado de cada aluno — bidirectional com `/notas` e dashboard atividades (salva on blur via `setNota`)
- Header da lista mostra: "Nota máxima: X" e "Modo: Média/Soma"
- Salvar: aplica atribuição (cria/remove `AtividadeAluno`). Se desatribuir aluno em grupo, **remove automaticamente** dos grupos da atividade.

#### Modal de grupos (atividade GRUPO)

State machine de 3 views:
- **Lista:** cards clicáveis dos grupos (nome, tema, badges dos membros). Hover destaca borda + sombra. Botão `+ Novo grupo` no topo + contador "N alunos atribuídos sem grupo".
- **Form (criar):** nome (default "Grupo X"), tema opcional, picker de checkboxes com candidatos.
- **Form (editar):** nome + tema editáveis, **campo "Nota do grupo"** (preenche notas vazias dos membros via action `setNotaGrupo`), lista de integrantes com nota individual + botão `X` pra remover, botão `+ Adicionar integrante` que abre sub-view de picker.

Estados especiais:
- Após salvar (editar), botão vira **"Salvo"** com contorno primário (não fecha o modal)
- Editar qualquer campo reverte botão pra "Salvar" cheio
- Notas (do grupo e individuais) salvam **on blur**, separado do botão Salvar
- Tirar todos membros de um grupo → erro "O grupo precisa de pelo menos um aluno"

---

## 5. Server actions

Em `actions/<entidade>.ts`, escopadas via `getProfessorIdOrThrow()`.

### `actions/turmas.ts`

| Função                              | Retorno         | O que faz                                      |
|-------------------------------------|-----------------|------------------------------------------------|
| `listTurmas()`                      | `Turma[]`       | lista (ATIVA primeiro, depois CONCLUIDA)       |
| `getTurma(id)`                      | `Turma \| null` | busca por id (escopo por tenant)               |
| `createTurma(input)`                | `Turma`         | cria com `status=ATIVA`; auto-cria 4 períodos  |
| `updateTurma(id, input)`            | `void`          | atualização parcial                            |
| `archiveTurma(id)` / `reactivateTurma(id)` | `void`   | toggle status                                  |
| `removeTurma(id)`                   | `void`          | hard delete (cascade leva tudo abaixo)         |

### `actions/alunos.ts`

| Função                              | Retorno     |
|-------------------------------------|-------------|
| `listAlunosByTurma(turmaId)`        | `Aluno[]`   |
| `createAluno(turmaId, input)`       | `Aluno`     |
| `updateAluno(id, input)`            | `void`      |
| `removeAluno(id)`                   | `void`      |

### `actions/periodos.ts`

| Função                              | Retorno          | O que faz                       |
|-------------------------------------|------------------|---------------------------------|
| `listPeriodosByTurma(turmaId)`      | `Periodo[]`      | chama `ensure4Periodos`         |
| `updatePeriodosVigencia(turmaId, input)` | `void`     | atualiza `dataInicio`/`dataFim` em transação |
| `setModoCalculoPeriodo(periodoId, modo)` | `void`     | troca MEDIA ↔ SOMA + **reescala notas existentes proporcionalmente** numa transação |

### `actions/atividades.ts`

| Função                                     | Retorno                                      |
|--------------------------------------------|----------------------------------------------|
| `listPeriodosComAtividades(turmaId)`       | períodos com atividades + atribuições + notas + grupos |
| `createAtividade(input)`                   | `Atividade` — valida `data` vs. vigência     |
| `updateAtividade(id, input)`               | `void` — permite mover entre períodos da mesma turma; **reescala notas** se cap efetivo mudou |
| `removeAtividade(id)`                      | `void`                                       |
| `setAtribuicaoAtividade(atividadeId, alunoIds)` | `void` — TODOS se selecionou todos da turma; senão SELECIONADOS + materializa lista. Remove cascateadamente alunos desatribuídos dos grupos. |

### `actions/grupos.ts`

| Função                              | Retorno     | O que faz                                |
|-------------------------------------|-------------|------------------------------------------|
| `listGrupos(atividadeId)`           | `Grupo[]`   |                                          |
| `createGrupo(atividadeId, input)`   | `Grupo`     | filtra alunoIds (atribuídos + não em outros grupos) |
| `updateGrupo(id, input)`            | `void`      |                                          |
| `removeGrupo(id)`                   | `void`      |                                          |
| `setNotaGrupo(grupoId, valor)`      | `void`      | persiste `Grupo.notaGrupo` + cria `Nota` apenas pros membros sem nota (transação) |

---

## 6. Helpers

- **`lib/session.ts`** — `getProfessorIdOrThrow()`
- **`lib/periodos-helper.ts`** — `ensure4Periodos(turmaId, professorId)` (idempotente)
- **`lib/turma-format.ts`** — `NIVEL_LABEL`, `TURNO_LABEL`, `TURNOS`, `bimestreNome`, `BIMESTRES_FIXOS`
- **`lib/turma-filters.ts`** — `extrairFilterOptions`, `aplicarFiltros` (usado em `/turmas`, `/notas`, `/analise-turma`)
- **`lib/disciplinas.ts`** — `DISCIPLINAS_POR_AREA`, `DISCIPLINAS_LISTA`
- **`lib/dates.ts`** — `dbToIsoString`, `isoToLocalDate`, `localToIsoString`, `dbDateToLocalDate`, `formatBrazilDate`
- **`lib/analise-helpers.ts`** — `mediaBimestre`, `mediaAnual`, `alunoFazAtividade` (respeitam atribuição)

---

## 7. Arquivos relacionados

- `prisma/schema.prisma` — schema source-of-truth
- `prisma/migrations/` — histórico (15 migrations)
- `lib/prisma.ts` — singleton (PrismaPg adapter)
- `actions/{turmas,alunos,periodos,atividades,grupos,notas}.ts` — server actions
- `app/(dashboard)/turmas/` — páginas
- `components/{turmas,alunos,periodos,atividades}/` — componentes por entidade
- `components/atividades/grupos-button.tsx` — modal completo de grupos (state machine)
- `components/atividades/atribuicao-button.tsx` — modal de atribuição de alunos
