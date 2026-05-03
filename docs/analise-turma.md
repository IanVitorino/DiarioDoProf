# Análise da turma

Cobre a tela `/analise-turma` — dashboard analítico de uma turma como um todo.

> Última atualização: 2026-05-03

---

## 1. Visão geral

```
/analise-turma → escolhe Turma (cards filtráveis) → escolhe quais bimestres → dashboard
```

Visão consolidada da turma com KPIs, distribuição de desempenho, ranking e evolução. Todos os cálculos respeitam atribuição (atividades não atribuídas ao aluno não entram).

---

## 2. Filterbar (escolha de turma)

Quando ainda não há turma escolhida, mostra cards das turmas + um `TurmaFilterBar` com 5 filtros:

- **Disciplina**
- **Ensino** (Fundamental I/II, Médio)
- **Turno** (Matutino/Vespertino/Noturno)
- **Ano**
- **Escola**

Estado em URL search params (`?disciplina=...&nivel=...&turno=...&ano=...&escola=...`). Cards filtrados em tempo real via `aplicarFiltros` (`lib/turma-filters.ts`).

---

## 3. Filtro de bimestres (depois de escolhida a turma)

- Multi-select: 1º, 2º, 3º, 4º (default: todos)
- O cálculo da "média da turma" considera apenas os bimestres marcados
- Permite responder perguntas como "como foi o 3º bimestre isolado?" ou "1º vs. 4º"

---

## 4. KPIs

| Card | O que mostra |
|---|---|
| **Total de alunos** | Quantidade de alunos na turma |
| **Total de atividades** | Quantidade de atividades nos bimestres selecionados |
| **Média da turma** | Média das médias anuais (considerando só os bimestres selecionados) — 0–10 |
| **% de aprovados** | % de alunos com média ≥ 7 |

---

## 5. Distribuição (donut)

3 faixas (vermelha/alerta/azul) — cada aluno classificado em uma com base na média do filtro selecionado.

- **Centro do donut:** mostra `100%` + "Total" + nº de alunos
- **Hover numa fatia (ou na legenda lateral):** centro vira a `%` da fatia + nome da faixa + contagem, com cor da faixa
- Animações: pop-in da fatia ativa, fade nas inativas, número central com bounce sutil

---

## 6. Gráficos

### Média por bimestre (line)

Linha mostrando a evolução da média da turma ao longo dos bimestres selecionados.

### Ranking de atividades (bar)

Top atividades por menor média (identifica "qual prova foi mais difícil"). Cada atividade é normalizada pra 0–10 considerando seu modo (MEDIA/SOMA) e respeita atribuição (alunos não atribuídos não entram na média).

---

## 7. Listas

- **Top 5 alunos** (maior média)
- **Bottom 5 alunos** (menor média)
- **Mais melhoraram** (top 5 por delta entre primeiro e último bimestre selecionado)
- **Mais pioraram** (idem, delta negativo)

`bimRefA` e `bimRefB` no payload indicam quais bimestres foram comparados (primeiro e último cronológicos da seleção).

> Se só 1 bimestre estiver selecionado, "melhoraram"/"pioraram" ficam vazios.

---

## 8. Server action

`actions/analise.ts`:

```ts
getAnaliseTurma(turmaId, bimestres?): AnaliseResult
```

Retorna:

```ts
interface AnaliseResult {
  turma: { id, nome, disciplina, nivel, ano };
  bimestresSelecionados: number[];
  totalAlunos: number;
  totalAtividades: number;
  mediaTurma: number;          // 0-10
  percentualAprovados: number; // 0-100
  distribuicao: { vermelha, alerta, azul };
  mediaPorBimestre: { ordem, media | null }[];
  atividadesRanking: AtividadeRank[];
  topAlunos: RankedAluno[];
  bottomAlunos: RankedAluno[];
  melhoraram: RankedDelta[];
  pioraram: RankedDelta[];
  bimRefA?: number;
  bimRefB?: number;
}
```

A action carrega tudo via `Promise.all` (alunos, periodos, atividades incl. `tipoAtribuicao` + atribuições, notas) e calcula em memória usando `mediaBimestre` / `mediaAnual` de `lib/analise-helpers.ts`. Atribuições são respeitadas em todas as métricas.

---

## 9. Decisões de design

- **Vazio = 0** nas médias do bimestre — coerente com `notas.md`
- **Aprovação em 6.0** — hard cutoff sem zona cinzenta
- **Multi-select de bimestres** vs. range — o professor pode querer comparar 1º e 4º pulando os do meio
- **Atribuição respeitada** — atividade só de recuperação não pesa pra quem não fez
- **Tudo server-side** — payload da action vem pronto, charts só renderizam

---

## 10. Arquivos relacionados

- `app/(dashboard)/analise-turma/page.tsx` — página
- `components/analise/` — KPIs, charts, listas
- `components/turmas/turma-filter-bar.tsx` — filterbar reaproveitada (também em `/turmas` e `/notas`)
- `actions/analise.ts` — `getAnaliseTurma`
- `lib/analise-helpers.ts` — funções puras de cálculo (com atribuição)
- `lib/turma-filters.ts` — `extrairFilterOptions`, `aplicarFiltros`
