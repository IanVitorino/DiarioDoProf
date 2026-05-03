"use server";

import { prisma } from "@/lib/prisma";
import { getProfessorIdOrThrow } from "@/lib/session";

export type Faixa = "vermelha" | "alerta" | "azul";

function classificar(valorNormalizado: number): Faixa {
  if (valorNormalizado < 6) return "vermelha";
  if (valorNormalizado < 7) return "alerta";
  return "azul";
}

export interface AlunoBar {
  alunoId: string;
  nome: string;
  valor: number; // valor cru lançado (ou 0 se vazio)
  valorNormalizado: number; // 0-10
  temNota: boolean;
  faixa: Faixa;
}

export interface GrupoBar {
  grupoId: string;
  nome: string;
  tema: string | null;
  membros: { alunoId: string; nome: string; valor: number; temNota: boolean }[];
  mediaNormalizada: number; // média das notas dos membros, 0-10
  totalMembros: number;
  membrosComNota: number;
}

export interface DashboardAtividadeResult {
  turma: { id: string; nome: string; disciplina: string; nivel: string; ano: number; escola: string | null };
  atividade: {
    id: string;
    nome: string;
    valorMaximo: number;
    capEfetivo: number;
    modoCalculo: "MEDIA" | "SOMA";
    tipo: "INDIVIDUAL" | "GRUPO";
    bimestre: number;
    data: Date | null;
  };
  kpis: {
    totalAtribuidos: number;
    totalLancados: number;
    media: number; // média das notas normalizadas dos que tem nota
    maior: number | null;
    menor: number | null;
    percentualAprovados: number; // dos que tem nota
  };
  distribuicao: { vermelha: number; alerta: number; azul: number };
  alunos: AlunoBar[]; // já ordenados desc por valor
  faltamLancar: { alunoId: string; nome: string }[];
  grupos: GrupoBar[]; // vazio se atividade não é GRUPO
}

export async function getDashboardAtividade(
  atividadeId: string,
): Promise<DashboardAtividadeResult> {
  const professorId = await getProfessorIdOrThrow();

  const atividade = await prisma.atividade.findFirst({
    where: { id: atividadeId, professorId },
    include: {
      periodo: {
        select: {
          ordem: true,
          modoCalculo: true,
          turmaId: true,
        },
      },
      atribuicoes: { select: { alunoId: true } },
      notas: { select: { alunoId: true, valor: true } },
      grupos: {
        orderBy: { createdAt: "asc" },
        include: { membros: { select: { alunoId: true } } },
      },
    },
  });
  if (!atividade) throw new Error("Atividade não encontrada");

  const turma = await prisma.turma.findFirst({
    where: { id: atividade.periodo.turmaId, professorId },
  });
  if (!turma) throw new Error("Turma não encontrada");

  const alunosTurma = await prisma.aluno.findMany({
    where: { turmaId: turma.id, professorId },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  const alunoNomePorId = new Map<string, string>();
  for (const a of alunosTurma) alunoNomePorId.set(a.id, a.nome);

  // Decide quem é "atribuído"
  const isTodos =
    atividade.tipoAtribuicao === "TODOS" ||
    !atividade.tipoAtribuicao;
  const idsAtribuidos = isTodos
    ? alunosTurma.map((a) => a.id)
    : atividade.atribuicoes.map((x) => x.alunoId);
  const setAtribuidos = new Set(idsAtribuidos);

  // Cap efetivo
  const capEfetivo =
    atividade.periodo.modoCalculo === "MEDIA" ? 10 : atividade.valorMaximo;

  // Mapa de notas
  const notaPorAluno = new Map<string, number>();
  for (const n of atividade.notas) notaPorAluno.set(n.alunoId, n.valor);

  // Bars por aluno (apenas atribuídos)
  const alunosBar: AlunoBar[] = idsAtribuidos
    .map((id) => {
      const nome = alunoNomePorId.get(id) ?? "—";
      const temNota = notaPorAluno.has(id);
      const valor = notaPorAluno.get(id) ?? 0;
      const valorNormalizado = capEfetivo > 0 ? (valor / capEfetivo) * 10 : 0;
      return {
        alunoId: id,
        nome,
        valor,
        valorNormalizado,
        temNota,
        faixa: classificar(valorNormalizado),
      };
    })
    .sort((a, b) => {
      // Quem não tem nota vai pro fim
      if (a.temNota !== b.temNota) return a.temNota ? -1 : 1;
      return b.valorNormalizado - a.valorNormalizado;
    });

  const lancados = alunosBar.filter((a) => a.temNota);
  const totalAtribuidos = idsAtribuidos.length;
  const totalLancados = lancados.length;

  const media =
    lancados.length === 0
      ? 0
      : lancados.reduce((s, a) => s + a.valorNormalizado, 0) / lancados.length;

  const maior = lancados.length === 0 ? null : Math.max(...lancados.map((a) => a.valorNormalizado));
  const menor = lancados.length === 0 ? null : Math.min(...lancados.map((a) => a.valorNormalizado));

  const aprovados = lancados.filter((a) => a.valorNormalizado >= 7).length;
  const percentualAprovados =
    lancados.length === 0 ? 0 : (aprovados / lancados.length) * 100;

  const distribuicao = { vermelha: 0, alerta: 0, azul: 0 };
  for (const a of lancados) {
    distribuicao[a.faixa]++;
  }

  const faltamLancar = alunosBar
    .filter((a) => !a.temNota)
    .map((a) => ({ alunoId: a.alunoId, nome: a.nome }));

  // Grupos (apenas se atividade for GRUPO)
  const grupos: GrupoBar[] =
    atividade.tipo === "GRUPO"
      ? atividade.grupos.map((g) => {
          const membros = g.membros.map((m) => {
            const nome = alunoNomePorId.get(m.alunoId) ?? "—";
            const valor = notaPorAluno.get(m.alunoId) ?? 0;
            const temNota = notaPorAluno.has(m.alunoId);
            return { alunoId: m.alunoId, nome, valor, temNota };
          });
          const comNota = membros.filter((m) => m.temNota);
          const mediaNormalizada =
            comNota.length === 0
              ? 0
              : comNota.reduce(
                  (s, m) => s + (capEfetivo > 0 ? (m.valor / capEfetivo) * 10 : 0),
                  0,
                ) / comNota.length;
          return {
            grupoId: g.id,
            nome: g.nome,
            tema: g.tema,
            membros,
            mediaNormalizada,
            totalMembros: membros.length,
            membrosComNota: comNota.length,
          };
        })
      : [];

  return {
    turma: {
      id: turma.id,
      nome: turma.nome,
      disciplina: turma.disciplina,
      nivel: turma.nivel,
      ano: turma.ano,
      escola: turma.escola,
    },
    atividade: {
      id: atividade.id,
      nome: atividade.nome,
      valorMaximo: atividade.valorMaximo,
      capEfetivo,
      modoCalculo: atividade.periodo.modoCalculo as "MEDIA" | "SOMA",
      tipo: atividade.tipo as "INDIVIDUAL" | "GRUPO",
      bimestre: atividade.periodo.ordem,
      data: atividade.data,
    },
    kpis: {
      totalAtribuidos,
      totalLancados,
      media,
      maior,
      menor,
      percentualAprovados,
    },
    distribuicao,
    alunos: alunosBar,
    faltamLancar,
    grupos,
  };
}

/**
 * Lista atividades disponíveis pro filtro (agrupadas por bimestre).
 * Usado quando o usuário escolhe a turma no filterbar.
 */
export async function listAtividadesDeTurma(turmaId: string) {
  const professorId = await getProfessorIdOrThrow();
  const turma = await prisma.turma.findFirst({
    where: { id: turmaId, professorId },
    select: { id: true },
  });
  if (!turma) return [];

  return prisma.atividade.findMany({
    where: { professorId, periodo: { turmaId } },
    select: {
      id: true,
      nome: true,
      data: true,
      periodo: { select: { ordem: true } },
    },
    orderBy: [
      { periodo: { ordem: "asc" } },
      { createdAt: "asc" },
    ],
  });
}
