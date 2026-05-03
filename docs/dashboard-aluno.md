# Dashboard do aluno

Cobre a tela `/dashboard-aluno` — visão individual de um aluno específico.

> Última atualização: 2026-05-03

---

## 1. Visão geral

```
/dashboard-aluno → escolhe Turma (combobox com busca) → escolhe Aluno (combobox) → dashboard
```

A `/analise-turma` mostra a turma como um todo. Esta tela serve pra mergulhar em um aluno específico.

---

## 2. Filtros (comboboxes com busca)

Dentro de um Card no topo da tela, dois comboboxes (Popover + cmdk):

### Turma

- Trigger mostra `<nome> · <disciplina>` (e `· <escola>` se preenchida)
- Input "Buscar por série, disciplina ou escola..."
- **Filtragem ignora acentos** (via `stripDiacritics`)
- Busca cobre: `nome` (que contém a série, ex: "9º B"), `disciplina`, `serie`, `escola`
- Cada item mostra `<nome> · <disciplina>` na linha principal e a escola embaixo (cinza, menor)

### Aluno

- Trigger mostra `<numero>. <nome>` (número derivado da ordem alfabética)
- Input "Buscar aluno..." — também ignora acentos
- Disabled quando nenhuma turma está selecionada

Ambos com scroll funcional via `onWheel`/`onTouchMove` `stopPropagation` e `z-[10000]` pra aparecer corretamente sobre Dialogs.

---

## 3. Card de identificação

- Badge `#<numero>` com fundo primário
- Nome do aluno
- Turma · disciplina · nível · ano
- Badge de **tendência**: "Evoluindo" / "Estável" / "Em queda"
  - Calculada comparando primeira e última média de bimestre válida
  - Delta > +0.5 → evolução; delta < -0.5 → queda; senão estável

---

## 4. KPIs

| Card | O que mostra |
|---|---|
| **Média anual** | Média das médias bimestrais — 0–10 |
| **Rank** | Posição do aluno na turma — `#X de N` |
| **Melhor bimestre** | Bimestre com maior média do aluno + valor |
| **Pior bimestre** | Bimestre com menor média do aluno + valor |

---

## 5. Gráficos

### Desempenho cronológico (line/area chart)

- Cada ponto é uma atividade do aluno (em ordem cronológica por bimestre + data)
- Eixo Y: nota normalizada (0–10) — `valor / cap × 10`
- Filtro por bimestre (botões 1º Bim, 2º Bim, ...) para focar
- Cor do ponto reflete a faixa
- **Atividades não atribuídas ao aluno são filtradas automaticamente** (não aparecem)

### Aluno vs. turma (line chart)

- Duas séries por bimestre: média do aluno × média da turma
- Mostra se o aluno está acima/abaixo da média geral em cada bimestre

### Distribuição (donut)

- 3 faixas (vermelha/alerta/azul)
- Centro mostra `100%` + total de atividades por padrão
- Hover numa fatia → centro vira `%` da fatia + nome + contagem
- Animações: pop-in da fatia ativa, fade-in do número central, hover bidirectional com legenda

---

## 6. Tabela de atividades

Lista cronológica de todas as atividades **atribuídas** ao aluno na turma:

| Coluna | Conteúdo |
|---|---|
| Data | `data` da atividade (ou `createdAt` como fallback) |
| Atividade | nome |
| Bimestre | "1º Bimestre" |
| Nota bruta | `valor / cap` — onde `cap = 10` se MEDIA, `valorMaximo` se SOMA |
| Equiv. /10 | nota normalizada com pílula colorida (vermelho < 6, amarelo < 7, verde ≥ 7) |

Atividades sem nota lançada aparecem com `—` em vez do valor. Atividades **não atribuídas** ao aluno não aparecem na tabela.

---

## 7. Server action

`actions/dashboard-aluno.ts`:

```ts
listAlunosDeTurma(turmaId): { id, nome }[]
getDashboardAluno(turmaId, alunoId): DashboardAlunoResult
```

A action carrega via `Promise.all` (periodos, atividades incl. `tipoAtribuicao` + atribuições, notas, alunos da turma) e:
- Calcula médias respeitando atribuição (só atividades atribuídas ao aluno)
- Filtra a lista cronológica para incluir apenas atribuídas
- Computa rank ordenando por média anual (desc), respeitando atribuição em cada aluno

---

## 8. Decisões de design

- **Número de chamada derivado** (não armazenado) — ordem alfabética calculada na renderização
- **Vazio = 0** nas médias de bimestre (mesma regra de `notas.md`); a tabela mostra `—` para atividades sem nota
- **`cap` na exibição da nota bruta** depende do modo do período — para evitar confusão visual em bimestres MEDIA
- **Atribuição respeitada** — atividade que não é dele não aparece na tabela nem afeta o cálculo
- **Tendência** baseada só em primeira/última média válida — simples e suficiente

---

## 9. Arquivos relacionados

- `app/(dashboard)/dashboard-aluno/page.tsx` — página
- `components/dashboard-aluno/` — `IdentificacaoCard`, KPIs, charts, `AtividadesTable`, `TurmaAlunoFiltros` (comboboxes)
- `components/dashboard-aluno/distribuicao-aluno.tsx` — donut interativo
- `actions/dashboard-aluno.ts` — `listAlunosDeTurma`, `getDashboardAluno`
- `lib/analise-helpers.ts` — `mediaBimestre`, `mediaAnual`, `alunoFazAtividade`
