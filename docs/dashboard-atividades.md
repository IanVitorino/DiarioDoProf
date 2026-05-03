# Dashboard de atividades

Cobre a tela `/dashboard-atividades` — análise detalhada de **uma atividade específica**.

> Última atualização: 2026-05-03

---

## 1. Visão geral

```
/dashboard-atividades → escolhe Escola → escolhe Turma → escolhe Atividade → dashboard
```

Visão zoom-in numa atividade isolada. Diferente de `/analise-turma` (que analisa o conjunto da turma) e `/dashboard-aluno` (que analisa um aluno), aqui o foco é uma única prova/trabalho/avaliação.

Acessível também via dropdown de ações da atividade (botão "Dashboard" abre em nova guia com filtros já preenchidos).

---

## 2. Filterbar 3-níveis (drill-down)

Card no topo com 3 comboboxes encadeados:

1. **Escola** — lista única das escolas das turmas do professor (com opção "Sem escola definida" pra turmas sem `escola`)
2. **Turma** (disabled até escolha de escola) — turmas dessa escola, busca por série/disciplina/escola
3. **Atividade** (disabled até escolha de turma) — atividades da turma agrupadas por bimestre

URL params: `?escola=...&turma=...&atividade=...&view=...`. Mudar um nível superior reseta os inferiores.

Empty state progressivo:
- "Selecione uma escola para começar"
- "Agora escolha a turma"
- "Agora escolha a atividade"

---

## 3. Header da atividade (depois de tudo escolhido)

Card mostrando:
- Nome da atividade
- Turma · disciplina · nível · bimestre
- Tipo (Individual / Em grupo) · Modo (Média / Soma) · Cap efetivo

Quando `tipo === GRUPO`: aparece **toggle "Visão grupo / Visão individual"** no canto direito (URL param `?view=grupo|individual`).

---

## 4. Visão Individual (default)

### KPIs

| Card | O que mostra |
|---|---|
| **Notas lançadas** | `X / Y` — quantos lançaram vs. quantos atribuídos |
| **Média da atividade** | Média das notas normalizadas (0–10 em modo MEDIA; 0–valorMaximo em modo SOMA, exibido como 0–10) |
| **Maior nota** | Maior nota normalizada |
| **Menor nota** | Menor nota normalizada |

### Histograma de distribuição (lado esquerdo)

`components/dashboard-atividade/notas-por-aluno-chart.tsx` (apesar do nome legado, é um histograma).

- 6 buckets fixos: `0–2`, `2–4`, `4–6`, `6–7`, `7–8`, `8–10`
- Bucket extra `10+` aparece dinamicamente quando há valores acima de 10 (consequência da reescala SOMA→MEDIA com data antiga, ver `notas.md`)
- Cor por faixa: vermelha < 6, alerta 6–7, azul ≥ 7
- Buckets vazios renderizam com `opacity 0.2` (mantêm a coluna pra dar noção da forma)
- Label em cima de cada barra com a contagem
- Altura fixa 280px independente do tamanho da turma

### Distribuição (donut, lado direito)

3 faixas (vermelha/alerta/azul) — interativo, igual o de `/analise-turma`.

### Faltam lançar

Card com lista de alunos atribuídos sem nota + link rápido pra `/notas?turma=X&bimestre=Y`. Se zerou, mostra check verde "Todas as notas foram lançadas".

---

## 5. Visão Grupo (só pra atividade GRUPO)

Substitui os charts da visão individual por:

### Bar chart de média por grupo

- Cada barra = um grupo
- Cor por faixa da média do grupo
- Linha pontilhada na média geral dos grupos
- Altura adaptativa (≥ 220px, +36px por grupo)

### Cards detalhados por grupo

Grid 2 colunas com:
- Nome do grupo + tema
- Média (texto grande colorido por faixa)
- Contador "X de Y com nota"
- Lista de membros com a nota individual de cada (badge "X / cap" ou "sem nota" em itálico)

Empty state: "Sem grupos cadastrados" com instrução pra criar na aba Atividades.

---

## 6. Server action

`actions/dashboard-atividade.ts`:

```ts
getDashboardAtividade(atividadeId): DashboardAtividadeResult
listAtividadesDeTurma(turmaId): { id, nome, periodo: { ordem } }[]
```

`DashboardAtividadeResult`:

```ts
{
  turma: { id, nome, disciplina, nivel, ano, escola };
  atividade: {
    id, nome, valorMaximo, capEfetivo,
    modoCalculo: "MEDIA" | "SOMA",
    tipo: "INDIVIDUAL" | "GRUPO",
    bimestre, data
  };
  kpis: {
    totalAtribuidos, totalLancados,
    media,
    maior: number | null,
    menor: number | null,
    percentualAprovados
  };
  distribuicao: { vermelha, alerta, azul };
  alunos: AlunoBar[];        // já ordenados desc por valorNormalizado
  faltamLancar: { alunoId, nome }[];
  grupos: GrupoBar[];        // vazio se atividade não é GRUPO
}
```

Atribuição é respeitada: apenas alunos atribuídos contam pros KPIs e distribuição. `alunosBar` inclui apenas atribuídos; quem não tem nota vai pro fim da lista e aparece em `faltamLancar`.

---

## 7. Bidirecionalidade

Editar nota em qualquer um dos lugares reflete aqui via revalidatePath:
- `/notas` (grid principal)
- Modal de atribuição em `/turmas/[id]/atividades`
- Modal de grupo em `/turmas/[id]/atividades`
- `/dashboard-atividades` (esta tela)

---

## 8. Acesso rápido

Na tela de Atividades, cada linha tem dropdown de ações com **"Dashboard"** + ícone `ExternalLink` que abre `/dashboard-atividades?escola=...&turma=...&atividade=...` em **nova guia** (`window.open(..., "_blank")`). Dashboard renderiza direto, sem cliques no filterbar.

---

## 9. Decisões de design

- **Histograma fixo** (6 buckets) ao invés de bar chart por aluno — escala bem com salas de qualquer tamanho
- **Drill-down explícito (escola → turma → atividade)** — o professor sabe a escola que ensina; o filtro reforça contexto
- **Toggle Grupo/Individual** — o professor decide a lente; em vez de mostrar tudo num scroll gigante
- **Cor consistente com resto do app** — vermelha < 6, alerta 6–7, azul ≥ 7 (mesma paleta dos outros donuts)

---

## 10. Arquivos relacionados

- `app/(dashboard)/dashboard-atividades/page.tsx` — página
- `components/dashboard-atividade/`
  - `filtros-bar.tsx` — comboboxes encadeados
  - `notas-por-aluno-chart.tsx` — histograma por bucket
  - `faltam-lancar-card.tsx` — lista de pendências
  - `visao-grupos.tsx` — cards de grupos
  - `visao-toggle.tsx` — toggle Grupo/Individual via URL
- `components/analise/distribuicao-chart.tsx` — donut reaproveitado
- `actions/dashboard-atividade.ts` — actions
