# Cadastros e modelo de dados

Cobre as telas de cadastro (turmas, alunos, períodos, atividades) e o schema que as suporta.

> Última atualização: 2026-05-02

---

## 1. Visão geral

```
Login → /turmas (lista) → /turmas/[id] → tabs Alunos / Períodos / Atividades
```

O professor é o **tenant** do sistema. Toda entidade carrega `professorId` na própria tabela, permitindo isolamento por linha sem JOINs em cascata.

---

## 2. Multi-tenancy

### Princípio

Todas as entidades de domínio têm coluna `professorId` apontando direto para `Professor`. Mesmo entidades "filhas" (Aluno, Periodo, Atividade, Nota) carregam o `professorId` da turma pai.

### Por que denormalizar `professorId`

- **Queries simples** — toda consulta começa com `where: { professorId }`.
- **Defesa em profundidade** — se uma cláusula falhar, o `professorId` redundante evita leak.
- **Performance** — index em `professorId` por tabela.

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
   │              └──< Atividade (com data dentro da vigência)
   │                      └──< Nota (única por aluno × atividade)
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
| `avatarUrl`    | String?  | URL relativa do avatar (ver `perfil-e-auth.md`) |
| `createdAt`    | DateTime |                                         |
| `updatedAt`    | DateTime |                                         |

#### `Turma`

| Campo         | Tipo          | Notas                                   |
|---------------|---------------|-----------------------------------------|
| `id`          | String        | UUID, PK                                |
| `nome`        | String        | derivado: `"<serie>º <turma>"` (ex: "9º A") |
| `turma`       | String        | letra ("A", "B", ...) — default "A"     |
| `nivel`       | `NivelEnsino` | `FUNDAMENTAL_I`, `FUNDAMENTAL_II`, `MEDIO` (`FUNDAMENTAL` legado) |
| `serie`       | String        | "9", "1ª", livre                        |
| `disciplina`  | String        | "Matemática"                            |
| `ano`         | Int           | ano letivo                              |
| `status`      | `TurmaStatus` | `ATIVA` (default) ou `CONCLUIDA`        |
| `professorId` | String → FK   | dono                                    |

Index: `professorId`. Cascade: deletar Professor → suas turmas somem.

#### `Aluno`

| Campo         | Tipo        | Notas                              |
|---------------|-------------|------------------------------------|
| `id`          | String      | UUID, PK                           |
| `nome`        | String      |                                    |
| `professorId` | String → FK | denormalizado da turma             |
| `turmaId`     | String → FK | turma à qual pertence              |

Index: `professorId`, `turmaId`. Cascade: deletar Turma → seus alunos somem.

> O **número de chamada** não é armazenado — é derivado da ordem alfabética dos alunos da turma a cada renderização. Reduz dor ao adicionar/renomear alunos.
> Não tem `matricula` (campo removido). Identificação visual usa só nome + número derivado.

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

Constraint: `@@unique([turmaId, ordem])` — não dá pra ter dois bimestres com a mesma ordem na mesma turma.

Index: `professorId`, `turmaId`. Cascade: deletar Turma → períodos somem.

> **`ensure4Periodos`** (em `lib/periodos-helper.ts`) é chamado pelas actions de listagem e garante que existam 4 períodos por turma (faz upsert nos faltantes). Cobre turmas antigas pré-feature.

#### `Atividade`

| Campo         | Tipo        | Notas                              |
|---------------|-------------|------------------------------------|
| `id`          | String      | UUID, PK                           |
| `nome`        | String      | "Prova mensal"                     |
| `valorMaximo` | Float       | default 10                         |
| `data`        | DateTime?   | UTC midnight, validada vs. vigência do período |
| `professorId` | String → FK |                                    |
| `periodoId`   | String → FK |                                    |

Index: `professorId`, `periodoId`. Cascade: deletar Período → atividades somem.

> Validação de `data`: se o período tem `dataInicio`/`dataFim`, a action rejeita atividades fora da janela. Validação tanto no cliente (Flatpickr min/max) quanto no servidor (Zod refine).

#### `Nota`

| Campo         | Tipo        | Notas                              |
|---------------|-------------|------------------------------------|
| `id`          | String      | UUID, PK                           |
| `valor`       | Float       | nota lançada (ver `notas.md` para semântica) |
| `professorId` | String → FK |                                    |
| `alunoId`     | String → FK |                                    |
| `atividadeId` | String → FK |                                    |

Constraint única: `@@unique([alunoId, atividadeId])` — um aluno só tem **uma** nota por atividade. Index: `professorId`. Cascade: deletar Aluno OU Atividade → notas somem.

### Enums

```prisma
enum NivelEnsino { FUNDAMENTAL, FUNDAMENTAL_I, FUNDAMENTAL_II, MEDIO }
enum TurmaStatus { ATIVA, CONCLUIDA }
enum ModoCalculo { MEDIA, SOMA }
```

`FUNDAMENTAL` continua no enum por legado; novos cadastros usam `FUNDAMENTAL_I` ou `FUNDAMENTAL_II`.

### Cascade resumido

```
Professor ─delete──> tudo (turmas → alunos, periodos, atividades, notas)
Turma     ─delete──> alunos, periodos (e por consequência atividades + notas)
Periodo   ─delete──> atividades (e por consequência notas)
Aluno     ─delete──> notas dele
Atividade ─delete──> notas dela
```

---

## 4. Telas

### Mapa de rotas (cadastros)

| Rota                                  | Tipo   | Propósito                                       |
|---------------------------------------|--------|-------------------------------------------------|
| `/`                                   | server | Redireciona para `/turmas`                      |
| `/turmas`                             | server | Lista de turmas do professor                    |
| `/turmas/[id]`                        | server | Redireciona para `/turmas/[id]/alunos`          |
| `/turmas/[id]/alunos`                 | server | Tab Alunos da turma                             |
| `/turmas/[id]/periodos`               | server | Tab Períodos (vigências)                        |
| `/turmas/[id]/atividades`             | server | Tab Atividades (agrupadas por período, configura modoCalculo) |

Tudo dentro de `(dashboard)` é protegido pelo `middleware.ts` — usuário não autenticado é redirecionado para `/login`.

### Layout `/turmas/[id]/layout.tsx`

Renderiza header da turma (nome, badge de status, disciplina/nível/série/ano), menu de tabs e ícone "..." com **Concluir / Reativar / Excluir**. Faz `getTurma(id)` e retorna 404 se não pertencer ao professor.

### Detalhamento

#### `/turmas` — Lista

- Cards em grid responsivo (1/2/3 colunas)
- Card: nome, badge de status, disciplina, nível · série · ano
- Click → `/turmas/[id]/alunos`
- `Nova turma` no canto superior direito → modal
- Empty state convidando a criar a primeira turma

Modal `NovaTurmaButton`: nome (turma A/B/...), nível, série, ano, disciplina. Validação Zod. Toast.

#### `/turmas/[id]/alunos`

- Tabela: Nº (derivado), Nome, Ações
- `Adicionar aluno` no topo
- Linha "..." → dropdown **Editar** / **Remover**
- Empty state se sem alunos

#### `/turmas/[id]/periodos`

- 4 cards (1º a 4º bimestre) com `dataInicio` / `dataFim` (Flatpickr pt-BR, locale brasileiro)
- Botão `Salvar vigências` faz `updatePeriodosVigencia` em transação
- Datas opcionais — sem vigência, atividades não são restritas
- Auto-criação dos 4 períodos via `ensure4Periodos` se a turma é nova

#### `/turmas/[id]/atividades`

- **Agrupado por período** — cada seção mostra ordem do bimestre + toggle MEDIA/SOMA + atividades
- Toggle de **modo de cálculo** por período (`setModoCalculoPeriodo`). Não-destrutivo: preserva `valorMaximo`.
- Cada período tem `Nova atividade` (já pré-seleciona o período)
- Atividade: nome, valorMaximo, data (validada contra vigência)
- Edição permite **mover** entre períodos da mesma turma (cross-turma é bloqueado)
- Empty state da página: se não há períodos, "Crie um período primeiro" com link
- Empty state por período: "Nenhuma atividade neste período ainda"
- **Aviso** se tenta criar atividade num período sem `dataInicio`/`dataFim` configurada — recomenda configurar vigência primeiro

---

## 5. Server actions

Todas em `actions/<entidade>.ts`, todas escopadas via `getProfessorIdOrThrow()`.

### `actions/turmas.ts`

| Função                              | Retorno         | O que faz                                      |
|-------------------------------------|-----------------|------------------------------------------------|
| `listTurmas()`                      | `Turma[]`       | lista (ATIVA primeiro, depois CONCLUIDA)       |
| `getTurma(id)`                      | `Turma \| null` | busca por id (escopo por tenant)               |
| `createTurma(input)`                | `Turma`         | cria com `status=ATIVA`; auto-cria 4 períodos  |
| `updateTurma(id, input)`            | `void`          | atualização parcial                            |
| `archiveTurma(id)`                  | `void`          | seta `status=CONCLUIDA`                        |
| `reactivateTurma(id)`               | `void`          | seta `status=ATIVA`                            |
| `removeTurma(id)`                   | `void`          | hard delete (cascade leva tudo abaixo)         |

### `actions/alunos.ts`

| Função                              | Retorno     |
|-------------------------------------|-------------|
| `listAlunosByTurma(turmaId)`        | `Aluno[]` (ordenado por nome) |
| `createAluno(turmaId, input)`       | `Aluno`     |
| `updateAluno(id, input)`            | `void`      |
| `removeAluno(id)`                   | `void`      |

### `actions/periodos.ts`

| Função                              | Retorno          | O que faz                       |
|-------------------------------------|------------------|---------------------------------|
| `listPeriodosByTurma(turmaId)`      | `Periodo[]`      | chama `ensure4Periodos` antes   |
| `updatePeriodosVigencia(turmaId, input)` | `void`     | atualiza `dataInicio`/`dataFim` dos 4 em uma transação |
| `setModoCalculoPeriodo(periodoId, modo)` | `void`     | troca MEDIA ↔ SOMA do período    |

> Não há mais `createPeriodo` / `removePeriodo` exposto — os 4 são fixos por turma.

### `actions/atividades.ts`

| Função                                     | Retorno                                      |
|--------------------------------------------|----------------------------------------------|
| `listPeriodosComAtividades(turmaId)`       | `Periodo[]` com `atividades` aninhadas       |
| `createAtividade(input)`                   | `Atividade` — valida `data` vs. vigência     |
| `updateAtividade(id, input)`               | `void` — permite mover entre períodos da mesma turma; valida `data` vs. vigência |
| `removeAtividade(id)`                      | `void`                                       |

---

## 6. Helpers

- **`lib/session.ts`** — `getProfessorIdOrThrow()` extrai `professorId` da sessão (lança se não autenticado).
- **`lib/periodos-helper.ts`** — `ensure4Periodos(turmaId, professorId)` faz upsert dos 4 períodos faltantes (idempotente).
- **`lib/turma-format.ts`** — `NIVEL_LABEL`, `bimestreNome(ordem)`, `BIMESTRES_FIXOS = [1,2,3,4]`.
- **`lib/dates.ts`** — `dbToIsoString`, `isoToLocalDate`, `localToIsoString`, `dbDateToLocalDate`, `formatBrazilDate`. Convertem entre UTC midnight (DB) e LOCAL midnight (UI).

---

## 7. Arquivos relacionados

- `prisma/schema.prisma` — schema source-of-truth
- `prisma/migrations/` — histórico de migrations
- `lib/prisma.ts` — singleton do Prisma Client (PrismaPg adapter)
- `lib/session.ts` — helper de tenant
- `lib/auth.ts` — config do NextAuth
- `actions/{turmas,alunos,periodos,atividades}.ts` — server actions
- `app/(dashboard)/turmas/` — páginas
- `components/{turmas,alunos,periodos,atividades}/` — componentes por entidade
