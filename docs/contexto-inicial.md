# Contexto Inicial — DiárioDoProf

Documento de visão geral do projeto. Serve como ponto de partida e referência rápida para próximas conversas e iterações.

> Data: 2026-04-30
> Status: Definição de escopo (pré-implementação)

---

## Visão do produto

Sistema para professores gerenciarem o ano letivo. Projeto pessoal, **não comercial**.

- **Foco inicial:** gestão de notas (uma "planilha de médias" inteligente).
- **Visão de longo prazo:** acompanhamento do desenvolvimento dos alunos além de notas (faltas, observações, evolução, etc.).

### Premissas

- Multi-tenant: cada professor enxerga apenas seus dados.
- Suporta múltiplos níveis de ensino (fundamental, médio).
- Suporta múltiplas turmas por professor.
- Turmas têm ciclo de vida — podem ser concluídas/arquivadas no fim do ano e continuam consultáveis em modo read-only.
- Regras de cálculo de média devem ser flexíveis (cada escola/professor tem peso e recuperação diferentes).
- Web primeiro, mobile possivelmente depois.
- Deploy em servidor próprio futuramente.

---

## Modelo de domínio (alto nível)

```
Professor (tenant)
  └── Turma                     [ativa | concluída]
        ├── Aluno(s)
        ├── Período(s)          [bimestre | trimestre | semestre]
        │     └── Atividade(s)  [prova, trabalho, participação...]
        │           └── Nota (por aluno)
        └── RegraDeCálculo      [como calcular a média]
```

### Por que essa modelagem

- **Professor é o tenant** → todas as queries filtram por `professor_id`. É o que garante isolamento entre contas.
- **Período é entidade separada da turma** → cada escola usa um sistema diferente (bimestre, trimestre, semestre). Tornar isso dado e não código deixa o sistema flexível sem deploy.
- **RegraDeCálculo como entidade própria** → permite presets reutilizáveis ("Média ponderada padrão da escola X") e evolução da lógica sem migração dolorosa.

---

## Fluxos principais

1. **Onboarding** — Professor cria conta → cria primeira turma.
2. **Setup da turma** — Define nível (fund/médio), série, disciplina, períodos do ano e regra de cálculo.
3. **Cadastro de alunos** — Manual ou import (CSV / planilha). Import é praticamente obrigatório — ninguém digita 35 alunos à mão.
4. **Operação do dia-a-dia** — Para cada período: cria atividades → lança notas dos alunos.
5. **Cálculo automático** — Média do período e do ano calculada conforme a regra da turma.
6. **Encerramento** — Conclui a turma no fim do ano → vira read-only/arquivada, continua consultável.

---

## Stack sugerida

| Camada | Sugestão | Justificativa |
|---|---|---|
| Frontend + Backend | **Next.js (App Router)** | Mesmo projeto para UI e API, deploy fácil, ecossistema maduro. |
| Banco | **PostgreSQL** | Multi-tenant via `professor_id` em cada tabela; relacional encaixa bem no domínio. |
| ORM | **Prisma** ou **Drizzle** | Prisma é mais didático; Drizzle é mais leve e SQL-first. |
| Auth | **Auth.js (NextAuth)** | Padrão da comunidade Next; suporta OAuth (Google) — UX boa para professor. |
| Deploy | **Vercel** (grátis) ou **VPS** | Vercel para começar; VPS quando quiser controle total. |
| Mobile (futuro) | **PWA** primeiro, depois **React Native** se necessário | PWA cobre 80% dos casos e reaproveita a stack web. |

---

## Pontos a lapidar (decisões pendentes)

Decisões que vão moldar o resto da arquitetura. Cada uma merece uma conversa dedicada antes de codar.

1. **Flexibilidade da regra de cálculo**
   - Presets fixos (ponderada, simples, com recuperação) **ou** fórmula livre?
   - Trade-off: fórmula livre é poderosa mas difícil de validar e de explicar para o usuário.

2. **Recuperação**
   - Recupera atividade específica? Bimestre inteiro? Apenas final de ano?
   - Cada escola adota uma política diferente.

3. **Disciplina por turma**
   - Ensino fundamental: 1 professor pode dar várias matérias para a mesma turma.
   - Ensino médio: normalmente 1 professor por matéria por turma.
   - Como modelar isso sem complicar o caso simples?

4. **Matrícula vs. Aluno**
   - Aluno pode transferir de turma no meio do ano.
   - Vale separar `Matrícula` (vínculo com turma + período) de `Aluno` (pessoa) para preservar histórico?

5. **Faltas/frequência**
   - Entra no MVP de notas ou fica para a fase 2 (desenvolvimento do aluno)?

6. **Boletim/exportação**
   - Gerar PDF do boletim faz parte do MVP ou é incremento posterior?

---

## Próximos passos sugeridos

1. Validar este escopo geral.
2. Escolher um dos pontos pendentes acima e detalhar (sugestão: começar pela **regra de cálculo**, que é o coração do sistema).
3. Modelo de dados detalhado (schema do banco).
4. Definir MVP — quais entidades e fluxos entram na primeira versão funcional.
