# Notas — lançamento e cálculo

Cobre a tela `/notas` (grid de lançamento), os modos de cálculo (MEDIA / SOMA), atribuição de atividades, notas em grupo e as fórmulas usadas.

> Última atualização: 2026-05-03

---

## 1. Visão geral

```
/notas → seleciona Turma + Bimestre → grid editável (alunos × atividades)
```

A nota é o **valor cru** que o professor digita. O modo de cálculo do **período** decide como esses valores se transformam em uma média de bimestre.

A entidade `Nota` tem constraint `@@unique([alunoId, atividadeId])` — um aluno só pode ter uma nota por atividade.

---

## 2. Tela `/notas`

- **Filterbar** acima — refina o dropdown de turma por disciplina/ensino/turno/ano/escola
- Dois selects: **Turma** e **Bimestre** (1º a 4º)
- Grid:
  - Linhas: alunos (em ordem alfabética)
  - Colunas: atividades do bimestre (em ordem de criação)
  - Última coluna: **Total/Média** — calculada respeitando atribuição (atividades não atribuídas ao aluno não entram)
- Cada célula é input numérico editável. Salvamento **on blur** via `setNota`. Limpar = deletar nota (passa `null`).

### Células desabilitadas (atividade não atribuída)

Quando uma atividade tem `tipoAtribuicao === SELECIONADOS` e o aluno **não** está na lista:
- Célula renderiza em cinza com fundo levemente destacado
- `disabled` + `readOnly` (não permite digitar)
- Tooltip explicando "Esta atividade não foi atribuída ao aluno"
- A nota não conta no cálculo do total da linha

> Notas existentes **persistem** no banco mesmo quando o aluno é desatribuído depois — só ficam fora do cálculo. Se voltar a atribuir, a nota antiga reaparece.

---

## 3. Atribuição de atividades

Cada atividade tem `tipoAtribuicao`:
- **`TODOS`** (default): toda turma faz, presente e futuro (alunos novos entram automaticamente)
- **`SELECIONADOS`**: apenas alunos explicitamente marcados via `AtividadeAluno`

A UI vive na **coluna Atribuição** da tela `/turmas/[id]/atividades`:
- Badge "Para todos" (cinza) ou "X alunos" (verde-soft) — abre modal
- Modal mostra checkboxes de cada aluno + master checkbox (com estado `indeterminate`)
- Cada linha tem **input de nota** (bidirectional com `/notas` e dashboard atividades)
- Salvar atribuição: marca/desmarca via `setAtribuicaoAtividade`. Se selecionou TODOS da turma, volta pra `tipoAtribuicao=TODOS` (libera entrada futura de alunos novos).

### Cascade de atribuição

Quando um aluno é desatribuído pela UI, a action `setAtribuicaoAtividade`:
1. Remove a entrada `AtividadeAluno` (transação)
2. **Remove o aluno de qualquer grupo** dessa atividade automaticamente

Se o grupo fica vazio, ele permanece (deletar é decisão do professor).

---

## 4. Modos de cálculo

### MEDIA (default)

- Cada nota representa **0–10** (independente do `valorMaximo` da atividade — em modo MEDIA o valor máximo efetivo é sempre 10)
- Média do bimestre = média aritmética simples das notas das **atividades atribuídas ao aluno**
- Atividade sem nota (vazia) conta como **0**

```
mediaBimestre = (n1 + n2 + ... + nN) / N
            (apenas atividades atribuídas ao aluno)
```

### SOMA

- Cada nota representa um **valor parcial**. O `valorMaximo` da atividade indica quanto vale.
- Média do bimestre = soma das notas das **atividades atribuídas**, com **teto em 10**
- Atividade sem nota = **0** somado

```
mediaBimestre = min(soma das notas atribuídas, 10)
```

### Por que `vazio = 0`?

Decisão consciente: tratar nota faltante como zero faz a média baixar e dá um sinal visual. Alternativa de "ignorar vazias" foi descartada porque permitia ao aluno ter nota alta deixando atividades em branco.

---

## 5. Reescala automática quando o cap muda

A action `setModoCalculoPeriodo` e a action `updateAtividade` **reescalam as notas existentes** quando o cap efetivo da atividade muda — preserva o desempenho proporcional do aluno.

Fórmula: `novo = (antigo / capAntigo) × capNovo`, arredondado a 2 casas. Tudo numa transação.

| Cenário | capAntigo | capNovo | Reescala? |
|---|---|---|---|
| Bimestre MEDIA → SOMA (peso 5) | 10 | 5 | sim, aplica em todas as atividades do bimestre |
| Bimestre SOMA (peso 5) → MEDIA | 5 | 10 | sim |
| Atividade SOMA peso 5 → SOMA peso 10 | 5 | 10 | sim, dobra |
| Mover atividade entre períodos com modos diferentes | conforme bimestre origem/destino | conforme | sim |
| Editar só nome ou data, mesmo cap | n | n | não toca |
| MEDIA → MEDIA / SOMA → SOMA com mesmo peso | igual | igual | não toca |

> A reescala pode produzir notas > 10 quando vinha de SOMA "bugada" com cap pequeno (ex: nota 8 num peso 3 → ao virar MEDIA fica 26.67). A UI dos dashboards expande o eixo X automaticamente quando há valores fora de [0,10].

---

## 6. Média anual

```
mediaAnual = média(mediaBim_1, mediaBim_2, mediaBim_3, mediaBim_4)
            (apenas bimestres com atividades atribuídas a esse aluno)
```

Se nenhum bimestre tem atividade atribuída, `mediaAnual = null`. Sem peso entre bimestres — todos contam igual.

---

## 7. Notas em grupo (atividades GRUPO)

Quando `Atividade.tipo === GRUPO`, a tela `/turmas/[id]/atividades` permite criar grupos via modal dedicado (ver `parametros.md`).

### Campo "Nota do grupo"

- Persistido em `Grupo.notaGrupo` (Float?)
- Quando preenchido via UI: a action `setNotaGrupo`:
  1. Atualiza `Grupo.notaGrupo`
  2. Cria `Nota` com esse valor para os membros **que ainda não têm nota** na atividade
  3. Membros que já têm nota individual mantêm o valor (override individual)
- Tudo numa transação

### Notas individuais dentro do grupo

Cada membro tem campo de nota próprio na lista do modal. Salva on blur via `setNota`. É bidirectional com:
- Grid `/notas`
- Modal de atribuição
- Tela `/dashboard-atividades`

A regra de "muda em um, muda nos três" funciona via `revalidatePath` cruzado em `setNota` e `setNotaGrupo`.

---

## 8. Server actions

### `actions/notas.ts`

| Função                                | Retorno                                      | O que faz                                       |
|---------------------------------------|----------------------------------------------|-------------------------------------------------|
| `getNotasGrid(turmaId, bimestreOrdem)` | `{ alunos, atividades, notas, modoCalculo }` | inclui `tipoAtribuicao` + `alunosAtribuidos` por atividade |
| `setNota(alunoId, atividadeId, valor)` | `void`                                      | upsert ou delete (se valor=null). Revalida `/notas`, `/turmas/[id]/atividades`, `/analise-turma`, `/dashboard-aluno`, `/dashboard-atividades` |

### `actions/grupos.ts`

| Função                              | Retorno     | O que faz                                |
|-------------------------------------|-------------|------------------------------------------|
| `setNotaGrupo(grupoId, valor)`      | `void`      | persiste `notaGrupo` + cria notas pros membros vazios (transação) |

### `actions/periodos.ts`

| Função                              | Retorno     | O que faz                                       |
|-------------------------------------|-------------|-------------------------------------------------|
| `setModoCalculoPeriodo(periodoId, modo)` | `void` | troca MEDIA ↔ SOMA + reescala notas (transação) |

### `actions/atividades.ts`

| Função                              | Retorno     | O que faz                                       |
|-------------------------------------|-------------|-------------------------------------------------|
| `updateAtividade(id, input)`        | `void`      | atualização + reescala se cap mudou             |
| `setAtribuicaoAtividade(atividadeId, alunoIds[])` | `void` | TODOS/SELECIONADOS + remove cascateadamente de grupos |

---

## 9. Helpers de cálculo

`lib/analise-helpers.ts` — funções puras, reutilizadas em `notas`, `analise`, `dashboard-aluno`, `dashboard-atividades`:

```ts
alunoFazAtividade(atividade, alunoId): boolean
mediaBimestre(alunoId, periodo, atividades, notas): number | null
mediaAnual(alunoId, periodos, atividades, notas): number | null
```

Tipos mínimos:

```ts
interface AtividadeMin {
  id: string;
  valorMaximo: number;
  periodoId: string;
  tipoAtribuicao?: "TODOS" | "SELECIONADOS";
  alunosAtribuidos?: string[];
}
interface PeriodoMin { id, ordem, modoCalculo: "MEDIA" | "SOMA" }
interface NotaMin { alunoId, atividadeId, valor }
```

`alunoFazAtividade` retorna `true` quando `tipoAtribuicao=TODOS` ou (`tipoAtribuicao=SELECIONADOS` && alunoId está em `alunosAtribuidos`). Usada como filtro inicial em `mediaBimestre`.

---

## 10. Arquivos relacionados

- `app/(dashboard)/notas/page.tsx` — página
- `components/notas/notas-grid.tsx` — grid editável + lógica de cap
- `actions/notas.ts` — actions
- `lib/analise-helpers.ts` — fórmulas
- `prisma/schema.prisma` — model `Nota`, `AtividadeAluno`, `Grupo`, `GrupoAluno`, enums
