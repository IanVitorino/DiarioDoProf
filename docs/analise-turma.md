# Análise da turma

Cobre a tela `/analise-turma` — dashboard analítico de uma turma como um todo.

> Última atualização: 2026-05-02

---

## 1. Visão geral

```
/analise-turma → seleciona Turma → seleciona quais bimestres entram (multi-select) → dashboard
```

Visão consolidada da turma com KPIs, distribuição de desempenho, ranking e evolução. Tudo calculado server-side a partir das mesmas funções puras usadas em `/notas` e `/dashboard-aluno`.

---

## 2. Filtros

- **Turma** (select obrigatório)
- **Bimestres** (multi-select; default: todos os 4)
  - O cálculo da "média da turma" e do "delta" leva em conta apenas os bimestres marcados
  - Permite responder perguntas tipo "como foi o 3º bimestre isolado?" ou "comparativo entre 1º e 4º"

---

## 3. KPIs (cards do topo)

| Card | O que mostra |
|---|---|
| **Total de alunos** | Quantidade de alunos na turma |
| **Total de atividades** | Quantidade de atividades nos bimestres selecionados |
| **Média da turma** | Média das médias anuais (considerando só os bimestres selecionados) — 0–10 |
| **% de aprovados** | % de alunos com média anual ≥ 6.0 (mesma referência da Análise) |

### Distribuição de desempenho

Donut chart com 3 faixas (mesma cor das pílulas dos dashboards):

- **Vermelha** — média < 6
- **Alerta (amarelo)** — 6 ≤ média < 7
- **Azul (verde)** — média ≥ 7

Conta cada aluno em uma das três faixas conforme sua média anual.

---

## 4. Gráficos

### Média por bimestre (line chart)

- Eixo X: bimestres (1º a 4º)
- Eixo Y: média da turma no bimestre
- Bimestres não selecionados aparecem cinza/inativos
- Mostra trajetória da turma ao longo do ano

### Ranking de atividades (bar chart)

- Top atividades por **menor média** (e/ou maior — versão atual mostra ranking ordenado)
- Ajuda a identificar "qual prova foi mais difícil"
- Média da atividade é normalizada para 0–10 (`valor / valorMaximo * 10`)

---

## 5. Tabelas / listas

### Top alunos (5)

Top 5 com maior média anual (filtro de bimestres aplicado).

### Bottom alunos (5)

Os 5 com menor média anual — atenção pedagógica.

### Mais melhoraram

Comparando o **primeiro bimestre selecionado** com o **último** (cronologicamente), os 5 alunos com maior delta positivo.

### Mais pioraram

Mesma lógica, delta negativo. `bimRefA` e `bimRefB` no payload da action indicam quais bimestres foram usados na comparação.

> Se só 1 bimestre estiver selecionado, "melhoraram" / "pioraram" ficam vazios.

---

## 6. Server action

`actions/analise.ts`:

```ts
getAnaliseTurma(turmaId, bimestres?): AnaliseResult
```

`bimestres` é opcional — se omitido, usa todos os 4. Retorna:

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

A action carrega tudo em uma `Promise.all` (alunos, periodos, atividades, notas) e calcula em memória usando `mediaBimestre` / `mediaAnual` de `lib/analise-helpers.ts`. Sem N+1.

---

## 7. Decisões de design

- **Vazio conta como 0** — coerente com a regra de cálculo de média do bimestre (ver `notas.md`). Aluno que não fez a atividade tem nota 0, não é "ignorado".
- **Aprovação é hard cutoff em 6.0** — sem zona cinzenta. Quando tiver recuperação configurável, isso pode mudar.
- **Multi-select de bimestres** vs. range — escolhido multi-select porque o professor pode querer comparar 1º e 4º pulando 2º e 3º.
- **Tudo server-side** — payload da action já vem pronto, gráficos só renderizam. Reduz JS no cliente.

---

## 8. Arquivos relacionados

- `app/(dashboard)/analise-turma/page.tsx` — página
- `components/analise/` — KPIs, charts, tabelas
- `actions/analise.ts` — `getAnaliseTurma`
- `lib/analise-helpers.ts` — funções puras de cálculo
