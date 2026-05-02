# Notas — lançamento e cálculo

Cobre a tela `/notas` (grid de lançamento), os modos de cálculo (MEDIA / SOMA) e as fórmulas usadas.

> Última atualização: 2026-05-02

---

## 1. Visão geral

```
/notas → seleciona Turma + Bimestre → grid editável (alunos × atividades)
```

A nota é o **valor cru** que o professor digita. O modo de cálculo do **período** decide como esses valores se transformam em uma média de bimestre.

A entidade `Nota` tem constraint `@@unique([alunoId, atividadeId])` — um aluno só pode ter uma nota por atividade.

---

## 2. Tela `/notas`

- Dois selects: **Turma** e **Bimestre** (1º a 4º).
- Grid:
  - Linhas: alunos (em ordem alfabética)
  - Colunas: atividades do bimestre (em ordem de criação)
  - Última coluna: **Média** do aluno no bimestre, calculada conforme o `modoCalculo` do período
- Cada célula é um input numérico editável. Salvamento é **inline** (debounce ou onBlur — chama `setNota`).
- Limpar uma célula = deletar a nota (passa `null`).
- Empty states:
  - Turma sem alunos → mensagem
  - Bimestre sem atividades → mensagem com link pra `/turmas/[id]/atividades`

### Indicador de modo de cálculo

O cabeçalho do grid mostra o modo atual do bimestre (MEDIA ou SOMA) com explicação do significado. O toggle real fica em `/turmas/[id]/atividades` (não duplicado em `/notas`).

---

## 3. Modos de cálculo

### MEDIA (default)

- Cada nota representa **0–10** (independente do `valorMaximo` da atividade).
- Média do bimestre = média aritmética simples das notas das atividades do bimestre.
- Atividade sem nota (vazia) conta como **0**.

```
mediaBimestre = (n1 + n2 + ... + nN) / N
```

### SOMA

- Cada nota representa um **valor parcial** que soma. O `valorMaximo` da atividade indica quanto vale.
- Média do bimestre = soma de todas as notas, com **teto em 10**.
- Atividade sem nota = **0** somado.

```
mediaBimestre = min(soma de todas as notas, 10)
```

> Use SOMA quando o bimestre é tipo "10 pontos divididos em prova=4, trabalho=3, participação=3". Use MEDIA quando cada atividade vale 0-10 separadamente.

### Por que `vazio = 0`?

Decisão consciente: tratar nota faltante como zero faz a média baixar e dá um sinal visual ("o aluno está perdendo pontos por não fazer"). Alternativa de "ignorar vazias" foi descartada porque permitia o aluno ter nota alta deixando atividades em branco.

---

## 4. Média anual

Definida em `mediaAnual` (`lib/analise-helpers.ts`):

- Pega cada bimestre que **tem atividades** (bimestres vazios são ignorados).
- Calcula a média do bimestre conforme seu `modoCalculo`.
- Faz a média aritmética dessas médias bimestrais.

```
mediaAnual = média(mediaBim_1, mediaBim_2, mediaBim_3, mediaBim_4)
            (apenas bimestres com atividades entram)
```

Se nenhum bimestre tem atividade, `mediaAnual = null`.

**Sem peso entre bimestres** — todos contam igual. Mudança futura.

---

## 5. Server actions

Em `actions/notas.ts`:

| Função                                | Retorno                                  | O que faz                                       |
|---------------------------------------|------------------------------------------|-------------------------------------------------|
| `getNotasGrid(turmaId, bimestreOrdem)` | `{ alunos, atividades, notas, modoCalculo }` | tudo que o grid precisa em uma chamada         |
| `setNota(alunoId, atividadeId, valor)` | `void`                                  | upsert (cria/atualiza) ou delete se `valor=null` |

Validações:
- `getNotasGrid` valida que turma e período pertencem ao professor (lança "Turma não encontrada" / "Bimestre não encontrado" caso contrário).
- `setNota` valida que aluno e atividade pertencem ao professor e à mesma turma.
- `valor` é float, mínimo 0. Sem teto explícito (pode ser usado em qualquer modo).

---

## 6. Helpers de cálculo

`lib/analise-helpers.ts` — funções puras, reutilizadas por `notas`, `analise-turma` e `dashboard-aluno`:

```ts
mediaBimestre(alunoId, periodo, atividades, notas): number | null
mediaAnual(alunoId, periodos, atividades, notas): number | null
```

Tipos mínimos (não pegam o objeto Prisma cheio):

```ts
interface PeriodoMin { id, ordem, modoCalculo: "MEDIA" | "SOMA" }
interface AtividadeMin { id, valorMaximo, periodoId }
interface NotaMin { alunoId, atividadeId, valor }
```

Manter como funções puras facilita testar e reusar fora de actions.

---

## 7. Arquivos relacionados

- `app/(dashboard)/notas/page.tsx` — página
- `components/notas/` — grid e componentes
- `actions/notas.ts` — actions
- `lib/analise-helpers.ts` — `mediaBimestre`, `mediaAnual`
- `prisma/schema.prisma` — model `Nota`, enum `ModoCalculo`
