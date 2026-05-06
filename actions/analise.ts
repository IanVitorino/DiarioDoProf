"use server";

import { prisma } from "@/lib/prisma";
import { getProfessorIdOrThrow } from "@/lib/session";
import { mediaBimestre, isAlunoAtivoNoBimestre } from "@/lib/analise-helpers";

export interface RankedAluno {
  alunoId: string;
  nome: string;
  media: number;
  inativo: boolean;
}

export interface RankedDelta {
  alunoId: string;
  nome: string;
  mediaA: number;
  mediaB: number;
  delta: number;
  inativo: boolean;
}

export interface AtividadeRank {
  id: string;
  nome: string;
  bimestre: number;
  media: number; // normalizada 0-10
}

export interface MediaBimPoint {
  ordem: number;
  media: number | null;
}

export interface AnaliseResult {
  turma: {
    id: string;
    nome: string;
    disciplina: string;
    nivel: string;
    ano: number;
  };
  bimestresSelecionados: number[];
  totalAlunos: number;
  totalAtividades: number;
  mediaTurma: number; // 0-10
  percentualAprovados: number; // 0-100
  distribuicao: { vermelha: number; alerta: number; azul: number };
  mediaPorBimestre: MediaBimPoint[];
  atividadesRanking: AtividadeRank[];
  topAlunos: RankedAluno[];
  bottomAlunos: RankedAluno[];
  melhoraram: RankedDelta[];
  pioraram: RankedDelta[];
  // referências do delta (primeiro e último cronológicos da seleção)
  bimRefA?: number;
  bimRefB?: number;
}

const LIMITE = 5;

export async function getAnaliseTurma(
  turmaId: string,
  bimestresInput?: number[]
): Promise<AnaliseResult> {
  const professorId = await getProfessorIdOrThrow();

  const turma = await prisma.turma.findFirst({
    where: { id: turmaId, professorId },
  });
  if (!turma) throw new Error("Turma não encontrada");

  const [alunos, periodos, atividades, notas] = await Promise.all([
    prisma.aluno.findMany({
      where: { turmaId, professorId },
      select: { id: true, nome: true, inativoApartirDeBimestre: true },
    }),
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
        tipoAtribuicao: true,
        atribuicoes: { select: { alunoId: true } },
      },
    }),
    prisma.nota.findMany({
      where: { professorId, atividade: { periodo: { turmaId } } },
      select: { alunoId: true, atividadeId: true, valor: true },
    }),
  ]);

  const atividadesNorm = atividades.map((a) => ({
    ...a,
    alunosAtribuidos: a.atribuicoes.map((x) => x.alunoId),
  }));

  // Normaliza seleção: vazio ou todos os 4 = ano todo
  const validInput = (bimestresInput ?? [])
    .filter((n) => [1, 2, 3, 4].includes(n))
    .sort((a, b) => a - b);
  const bimestresSelecionados =
    validInput.length === 0 ? [1, 2, 3, 4] : Array.from(new Set(validInput));

  const periodosSel = periodos.filter((p) =>
    bimestresSelecionados.includes(p.ordem)
  );
  const atividadesSel = atividadesNorm.filter((a) =>
    periodosSel.some((p) => p.id === a.periodoId)
  );

  // Média de cada aluno na seleção (média das médias dos bimestres selecionados)
  const mediaAluno = (
    alunoId: string,
    inativoApartirDeBimestre: number | null
  ): number | null => {
    const medias: number[] = [];
    for (const p of periodosSel) {
      const m = mediaBimestre(
        alunoId,
        p,
        atividadesNorm,
        notas,
        inativoApartirDeBimestre
      );
      if (m !== null) medias.push(m);
    }
    if (medias.length === 0) return null;
    return medias.reduce((s, m) => s + m, 0) / medias.length;
  };

  const dadosAlunos = alunos.map((a) => ({
    aluno: a,
    media: mediaAluno(a.id, a.inativoApartirDeBimestre),
  }));

  const mediasValidas = dadosAlunos
    .map((d) => d.media)
    .filter((m): m is number => m !== null);

  const mediaTurma =
    mediasValidas.length === 0
      ? 0
      : mediasValidas.reduce((s, m) => s + m, 0) / mediasValidas.length;

  const aprovados = mediasValidas.filter((m) => m >= 7).length;
  const percentualAprovados =
    alunos.length === 0 ? 0 : (aprovados / alunos.length) * 100;

  const distribuicao = { vermelha: 0, alerta: 0, azul: 0 };
  for (const m of mediasValidas) {
    if (m < 6) distribuicao.vermelha++;
    else if (m < 7) distribuicao.alerta++;
    else distribuicao.azul++;
  }

  // Média por bimestre (somente os selecionados)
  const mediaPorBimestre: MediaBimPoint[] = periodosSel.map((p) => {
    const medias: number[] = [];
    for (const a of alunos) {
      const m = mediaBimestre(
        a.id,
        p,
        atividadesNorm,
        notas,
        a.inativoApartirDeBimestre
      );
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

  // Ranking de atividades (normalizado pra 0-10 considerando o modo do periodo)
  const atividadesRanking: AtividadeRank[] = atividadesSel
    .map((a) => {
      const periodo = periodosSel.find((p) => p.id === a.periodoId);
      if (!periodo) return null;
      const cap = periodo.modoCalculo === "MEDIA" ? 10 : a.valorMaximo;
      if (cap <= 0) return null;
      const isTodos =
        !a.tipoAtribuicao || a.tipoAtribuicao === "TODOS";
      const atribuidos = new Set(a.alunosAtribuidos ?? []);
      let total = 0;
      let count = 0;
      for (const aluno of alunos) {
        if (!isAlunoAtivoNoBimestre(aluno.inativoApartirDeBimestre, periodo.ordem))
          continue;
        if (!isTodos && !atribuidos.has(aluno.id)) continue;
        const n = notas.find(
          (nn) => nn.alunoId === aluno.id && nn.atividadeId === a.id
        );
        total += ((n?.valor ?? 0) / cap) * 10;
        count++;
      }
      if (count === 0) return null;
      return {
        id: a.id,
        nome: a.nome,
        bimestre: periodo.ordem,
        media: total / count,
      };
    })
    .filter((a): a is AtividadeRank => a !== null)
    .sort((a, b) => b.media - a.media);

  // Top / Bottom alunos
  const ranked = dadosAlunos
    .filter((d): d is { aluno: typeof d.aluno; media: number } => d.media !== null)
    .map((d) => ({
      alunoId: d.aluno.id,
      nome: d.aluno.nome,
      media: d.media,
      inativo: d.aluno.inativoApartirDeBimestre != null,
    }));

  const topAlunos = [...ranked].sort((a, b) => b.media - a.media).slice(0, LIMITE);
  const bottomAlunos = [...ranked].sort((a, b) => a.media - b.media).slice(0, LIMITE);

  // Delta: precisa de pelo menos 2 bimestres selecionados.
  // Usa primeiro e último cronológicos da seleção.
  let melhoraram: RankedDelta[] = [];
  let pioraram: RankedDelta[] = [];
  let bimRefA: number | undefined;
  let bimRefB: number | undefined;
  if (periodosSel.length >= 2) {
    const periodoA = periodosSel[0];
    const periodoB = periodosSel[periodosSel.length - 1];
    bimRefA = periodoA.ordem;
    bimRefB = periodoB.ordem;
    const deltas = alunos
      .map((aluno) => {
        const mA = mediaBimestre(
          aluno.id,
          periodoA,
          atividadesNorm,
          notas,
          aluno.inativoApartirDeBimestre
        );
        const mB = mediaBimestre(
          aluno.id,
          periodoB,
          atividadesNorm,
          notas,
          aluno.inativoApartirDeBimestre
        );
        if (mA === null || mB === null) return null;
        return {
          alunoId: aluno.id,
          nome: aluno.nome,
          mediaA: mA,
          mediaB: mB,
          delta: mB - mA,
          inativo: aluno.inativoApartirDeBimestre != null,
        };
      })
      .filter((d): d is RankedDelta => d !== null);
    melhoraram = [...deltas]
      .filter((d) => d.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, LIMITE);
    pioraram = [...deltas]
      .filter((d) => d.delta < 0)
      .sort((a, b) => a.delta - b.delta)
      .slice(0, LIMITE);
  }

  return {
    turma: {
      id: turma.id,
      nome: turma.nome,
      disciplina: turma.disciplina,
      nivel: turma.nivel,
      ano: turma.ano,
    },
    bimestresSelecionados,
    totalAlunos: alunos.length,
    totalAtividades: atividadesSel.length,
    mediaTurma,
    percentualAprovados,
    distribuicao,
    mediaPorBimestre,
    atividadesRanking,
    topAlunos,
    bottomAlunos,
    melhoraram,
    pioraram,
    bimRefA,
    bimRefB,
  };
}
