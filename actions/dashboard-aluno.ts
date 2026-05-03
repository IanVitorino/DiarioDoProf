"use server";

import { prisma } from "@/lib/prisma";
import { getProfessorIdOrThrow } from "@/lib/session";
import { mediaBimestre, mediaAnual } from "@/lib/analise-helpers";

export type Trend = "evolucao" | "estavel" | "queda";

export interface AtividadePonto {
  atividadeId: string;
  nome: string;
  bimestre: number;
  data: Date | null;
  valor: number;
  valorMaximo: number;
  modoCalculo: "MEDIA" | "SOMA";
  valorNormalizado: number; // 0-10
  temNota: boolean;
}

export interface DashboardAlunoResult {
  aluno: { id: string; nome: string; numeroChamada: number };
  turma: {
    id: string;
    nome: string;
    disciplina: string;
    nivel: string;
    ano: number;
  };
  totalAtividadesPossivel: number;
  totalAtividadesFeitas: number;
  mediaAnual: number | null;
  rank: number; // 1-based
  totalAlunos: number;
  trend: Trend;
  melhorBim: { ordem: number; media: number } | null;
  piorBim: { ordem: number; media: number } | null;
  mediasPorBimAluno: { ordem: number; media: number | null }[];
  mediasPorBimTurma: { ordem: number; media: number | null }[];
  atividadesCronologicas: AtividadePonto[];
  distribuicao: { vermelha: number; alerta: number; azul: number };
}

export async function listAlunosDeTurma(turmaId: string) {
  const professorId = await getProfessorIdOrThrow();
  return prisma.aluno.findMany({
    where: { turmaId, professorId },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
}

export async function getDashboardAluno(
  turmaId: string,
  alunoId: string
): Promise<DashboardAlunoResult> {
  const professorId = await getProfessorIdOrThrow();

  const turma = await prisma.turma.findFirst({
    where: { id: turmaId, professorId },
  });
  if (!turma) throw new Error("Turma não encontrada");

  const aluno = await prisma.aluno.findFirst({
    where: { id: alunoId, turmaId, professorId },
    select: { id: true, nome: true },
  });
  if (!aluno) throw new Error("Aluno não encontrado");

  const [periodos, atividades, notas, todosAlunos] = await Promise.all([
    prisma.periodo.findMany({
      where: { turmaId, professorId },
      select: { id: true, ordem: true, modoCalculo: true },
      orderBy: { ordem: "asc" },
    }),
    prisma.atividade.findMany({
      where: { professorId, periodo: { turmaId } },
      select: {
        id: true,
        nome: true,
        valorMaximo: true,
        periodoId: true,
        data: true,
        createdAt: true,
        tipoAtribuicao: true,
        atribuicoes: { select: { alunoId: true } },
      },
    }),
    prisma.nota.findMany({
      where: { professorId, atividade: { periodo: { turmaId } } },
      select: { alunoId: true, atividadeId: true, valor: true },
    }),
    prisma.aluno.findMany({
      where: { turmaId, professorId },
      select: { id: true, nome: true },
    }),
  ]);

  const atividadesNorm = atividades.map((a) => ({
    ...a,
    alunosAtribuidos: a.atribuicoes.map((x) => x.alunoId),
  }));

  // Médias por bimestre
  const mediasPorBimAluno = periodos.map((p) => ({
    ordem: p.ordem,
    media: mediaBimestre(aluno.id, p, atividadesNorm, notas),
  }));
  const mediasPorBimTurma = periodos.map((p) => {
    const medias: number[] = [];
    for (const a of todosAlunos) {
      const m = mediaBimestre(a.id, p, atividadesNorm, notas);
      if (m !== null) medias.push(m);
    }
    return {
      ordem: p.ordem,
      media:
        medias.length === 0
          ? null
          : medias.reduce((s, m) => s + m, 0) / medias.length,
    };
  });

  const minhaMediaAnual = mediaAnual(aluno.id, periodos, atividadesNorm, notas);

  // Rank: ordena alunos por média anual desc
  const ranking = todosAlunos
    .map((a) => ({
      id: a.id,
      media: mediaAnual(a.id, periodos, atividadesNorm, notas),
    }))
    .sort((a, b) => (b.media ?? -Infinity) - (a.media ?? -Infinity));
  const rank = ranking.findIndex((r) => r.id === aluno.id) + 1;

  // Número de chamada (alfabético)
  const ordenadoAlfa = [...todosAlunos].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR")
  );
  const numeroChamada =
    ordenadoAlfa.findIndex((a) => a.id === aluno.id) + 1;

  // Melhor / Pior bimestre
  const bimComMedia = mediasPorBimAluno.filter(
    (b): b is { ordem: number; media: number } => b.media !== null
  );
  const melhorBim =
    bimComMedia.length === 0
      ? null
      : bimComMedia.reduce((best, c) => (c.media > best.media ? c : best));
  const piorBim =
    bimComMedia.length === 0
      ? null
      : bimComMedia.reduce((worst, c) => (c.media < worst.media ? c : worst));

  // Tendência (compara primeira e última média válida)
  let trend: Trend = "estavel";
  if (bimComMedia.length >= 2) {
    const delta =
      bimComMedia[bimComMedia.length - 1].media - bimComMedia[0].media;
    if (delta > 0.5) trend = "evolucao";
    else if (delta < -0.5) trend = "queda";
  }

  // Atividades cronológicas com nota do aluno
  const atividadesCronologicas: AtividadePonto[] = atividadesNorm
    .map((a) => {
      const periodo = periodos.find((p) => p.id === a.periodoId);
      if (!periodo) return null;
      // Apenas atividades atribuídas ao aluno
      const isTodos =
        !a.tipoAtribuicao || a.tipoAtribuicao === "TODOS";
      if (!isTodos && !a.alunosAtribuidos.includes(aluno.id)) return null;
      const cap =
        periodo.modoCalculo === "MEDIA" ? 10 : a.valorMaximo;
      const nota = notas.find(
        (n) => n.alunoId === aluno.id && n.atividadeId === a.id
      );
      const valor = nota?.valor ?? 0;
      const valorNormalizado = cap > 0 ? (valor / cap) * 10 : 0;
      return {
        atividadeId: a.id,
        nome: a.nome,
        bimestre: periodo.ordem,
        data: a.data,
        valor,
        valorMaximo: a.valorMaximo,
        modoCalculo: periodo.modoCalculo as "MEDIA" | "SOMA",
        valorNormalizado,
        temNota: !!nota,
        // sortable internal
        _t: (a.data ?? a.createdAt).getTime(),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => {
      if (a.bimestre !== b.bimestre) return a.bimestre - b.bimestre;
      return a._t - b._t;
    })
    .map(({ _t, ...rest }) => rest);

  // Distribuição
  let vermelha = 0,
    alerta = 0,
    azul = 0;
  let feitas = 0;
  for (const a of atividadesCronologicas) {
    if (!a.temNota) continue;
    feitas++;
    if (a.valorNormalizado < 6) vermelha++;
    else if (a.valorNormalizado < 7) alerta++;
    else azul++;
  }

  return {
    aluno: { id: aluno.id, nome: aluno.nome, numeroChamada },
    turma: {
      id: turma.id,
      nome: turma.nome,
      disciplina: turma.disciplina,
      nivel: turma.nivel,
      ano: turma.ano,
    },
    totalAtividadesPossivel: atividadesCronologicas.length,
    totalAtividadesFeitas: feitas,
    mediaAnual: minhaMediaAnual,
    rank,
    totalAlunos: todosAlunos.length,
    trend,
    melhorBim,
    piorBim,
    mediasPorBimAluno,
    mediasPorBimTurma,
    atividadesCronologicas,
    distribuicao: { vermelha, alerta, azul },
  };
}
