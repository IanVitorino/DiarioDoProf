# Dashboard do aluno

Cobre a tela `/dashboard-aluno` — visão individual de um aluno específico.

> Última atualização: 2026-05-02

---

## 1. Visão geral

```
/dashboard-aluno → seleciona Turma → seleciona Aluno → dashboard
```

A `/analise-turma` mostra a turma como um todo. Esta tela serve pra mergulhar em um aluno específico: como ele está, em que bimestre foi melhor/pior, como se compara à turma, quais atividades foram bem/mal.

---

## 2. Filtros

- **Turma** (select obrigatório)
- **Aluno** (select obrigatório, mostra `<numero>. <nome>` — número derivado da ordem alfabética da turma)

---

## 3. Card de identificação

- Badge `#<numero>` (número de chamada, derivado)
- Nome do aluno
- Turma · disciplina · nível · ano
- Badge de **tendência**: "Evoluindo" / "Estável" / "Em queda"
  - Calculada comparando primeira e última média de bimestre válida
  - Delta > +0.5 → evolução; delta < -0.5 → queda; senão estável

> A foto do aluno foi removida (não é configurável).

---

## 4. KPIs (cards)

| Card | O que mostra |
|---|---|
| **Média anual** | Média das médias bimestrais (ver `notas.md`) — 0–10 |
| **Rank** | Posição do aluno na turma (1-based) — `#X de N` |
| **Melhor bimestre** | Bimestre com a maior média do aluno + valor |
| **Pior bimestre** | Bimestre com a menor média do aluno + valor |

---

## 5. Gráficos

### Desempenho cronológico (line/area chart)

- Cada ponto é uma atividade do aluno (em ordem cronológica por bimestre + data)
- Eixo Y: nota normalizada (0–10) — `valor / cap * 10`, onde `cap = 10` se MEDIA, `valorMaximo` se SOMA
- Filtro por bimestre (botões 1º Bim, 2º Bim, ...) para focar
- Cor do ponto reflete a faixa de desempenho (vermelha/alerta/azul)

### Comparativo aluno vs. turma (line chart)

- Duas séries por bimestre: média do aluno × média da turma
- Mostra se o aluno está acima/abaixo da média geral em cada bimestre

---

## 6. Tabela de atividades

Lista cronológica de todas as atividades do aluno na turma:

| Coluna | Conteúdo |
|---|---|
| Data | `data` da atividade (ou `createdAt` como fallback) |
| Atividade | nome |
| Bimestre | "1º Bimestre" |
| Nota bruta | `valor / cap` — onde `cap = 10` se MEDIA, `valorMaximo` se SOMA |
| Equiv. /10 | nota normalizada com pílula colorida (vermelho < 6, amarelo < 7, verde ≥ 7) |

> A coluna "Nota bruta" usa `cap = 10` quando o bimestre está em **MEDIA** (mesmo que `valorMaximo` da atividade seja outro valor). Em **SOMA**, usa `valorMaximo` real. Isso evita confusão tipo `10/5` em bimestre de média (corrigido em 2026-05-02).

Atividades sem nota lançada aparecem com `—` em vez do valor.

---

## 7. Distribuição

Donut com 3 faixas (mesma lógica da Análise):

- **Vermelha** (< 6)
- **Alerta** (6–6.99)
- **Azul** (≥ 7)

Conta atividades **com nota lançada**, não a média final do aluno.

---

## 8. Server action

`actions/dashboard-aluno.ts`:

```ts
listAlunosDeTurma(turmaId): { id, nome }[]
getDashboardAluno(turmaId, alunoId): DashboardAlunoResult
```

`DashboardAlunoResult` inclui:

```ts
{
  aluno: { id, nome, numeroChamada },
  turma: { id, nome, disciplina, nivel, ano },
  totalAtividadesPossivel: number,
  totalAtividadesFeitas: number,
  mediaAnual: number | null,
  rank: number,        // 1-based
  totalAlunos: number,
  trend: "evolucao" | "estavel" | "queda",
  melhorBim: { ordem, media } | null,
  piorBim: { ordem, media } | null,
  mediasPorBimAluno: { ordem, media | null }[],
  mediasPorBimTurma: { ordem, media | null }[],
  atividadesCronologicas: AtividadePonto[],
  distribuicao: { vermelha, alerta, azul },
}
```

`AtividadePonto`:

```ts
{
  atividadeId, nome, bimestre, data,
  valor, valorMaximo,
  modoCalculo: "MEDIA" | "SOMA",
  valorNormalizado: number,  // 0-10
  temNota: boolean,
}
```

A action carrega em paralelo (alunos, periodos, atividades, notas) e calcula tudo em memória.

---

## 9. Decisões de design

- **Número de chamada derivado** (não armazenado) — ordem alfabética da turma na hora da renderização. Reduz dor ao adicionar/renomear alunos.
- **Vazio = 0** nas médias de bimestre (mesma regra da `notas.md`). Mas a tabela mostra `—` para atividades sem nota (não força o usuário a interpretar 0 como "não fez").
- **`cap` na exibição da nota bruta** depende do modo do período — para evitar confusão visual em bimestres de média.
- **Tendência** baseada só em primeira/última média válida — simples e suficiente. Sliding window é evolução futura.
- **Foto removida** — não é configurável e ocupa espaço sem agregar valor (decisão de 2026-05-02).

---

## 10. Arquivos relacionados

- `app/(dashboard)/dashboard-aluno/page.tsx` — página
- `components/dashboard-aluno/` — `IdentificacaoCard`, KPIs, charts, `AtividadesTable`
- `actions/dashboard-aluno.ts` — `listAlunosDeTurma`, `getDashboardAluno`
- `lib/analise-helpers.ts` — `mediaBimestre`, `mediaAnual`
