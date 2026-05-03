"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getProfessorIdOrThrow } from "@/lib/session";

export async function getNotasGrid(turmaId: string, bimestreOrdem: number) {
  const professorId = await getProfessorIdOrThrow();

  const turma = await prisma.turma.findFirst({
    where: { id: turmaId, professorId },
    select: { id: true },
  });
  if (!turma) throw new Error("Turma não encontrada");

  const periodo = await prisma.periodo.findFirst({
    where: { turmaId, ordem: bimestreOrdem, professorId },
    select: { id: true, modoCalculo: true },
  });
  if (!periodo) throw new Error("Bimestre não encontrado");

  const [alunos, atividades, notas] = await Promise.all([
    prisma.aluno.findMany({
      where: { turmaId, professorId },
      orderBy: { nome: "asc" },
    }),
    prisma.atividade.findMany({
      where: { periodoId: periodo.id, professorId },
      orderBy: { createdAt: "asc" },
      include: { atribuicoes: { select: { alunoId: true } } },
    }),
    prisma.nota.findMany({
      where: { professorId, atividade: { periodoId: periodo.id } },
      select: { id: true, valor: true, alunoId: true, atividadeId: true },
    }),
  ]);

  const atividadesNorm = atividades.map((a) => ({
    ...a,
    alunosAtribuidos: a.atribuicoes.map((x) => x.alunoId),
  }));

  return {
    alunos,
    atividades: atividadesNorm,
    notas,
    modoCalculo: periodo.modoCalculo,
  };
}

const setNotaSchema = z.object({
  alunoId: z.string().min(1),
  atividadeId: z.string().min(1),
  valor: z.number().min(0).nullable(),
});

export async function setNota(
  alunoId: string,
  atividadeId: string,
  valor: number | null
) {
  const professorId = await getProfessorIdOrThrow();
  const data = setNotaSchema.parse({ alunoId, atividadeId, valor });

  const [aluno, atividade] = await Promise.all([
    prisma.aluno.findFirst({
      where: { id: data.alunoId, professorId },
      select: { id: true, turmaId: true },
    }),
    prisma.atividade.findFirst({
      where: { id: data.atividadeId, professorId },
      select: {
        id: true,
        valorMaximo: true,
        periodo: { select: { turmaId: true, ordem: true, modoCalculo: true } },
      },
    }),
  ]);
  if (!aluno || !atividade) throw new Error("Não autorizado");
  if (aluno.turmaId !== atividade.periodo.turmaId) {
    throw new Error("Aluno e atividade pertencem a turmas diferentes");
  }
  // Em modo MEDIA, o cap efetivo é sempre 10. Em SOMA, é o valorMaximo da atividade.
  const capEfetivo =
    atividade.periodo.modoCalculo === "MEDIA" ? 10 : atividade.valorMaximo;
  if (data.valor !== null && data.valor > capEfetivo) {
    throw new Error(`Nota deve estar entre 0 e ${capEfetivo}`);
  }

  if (data.valor === null) {
    await prisma.nota.deleteMany({
      where: {
        alunoId: data.alunoId,
        atividadeId: data.atividadeId,
        professorId,
      },
    });
  } else {
    await prisma.nota.upsert({
      where: {
        alunoId_atividadeId: {
          alunoId: data.alunoId,
          atividadeId: data.atividadeId,
        },
      },
      create: {
        valor: data.valor,
        alunoId: data.alunoId,
        atividadeId: data.atividadeId,
        professorId,
      },
      update: { valor: data.valor },
    });
  }

  revalidatePath(
    `/notas?turma=${aluno.turmaId}&bimestre=${atividade.periodo.ordem}`
  );
  revalidatePath(`/turmas/${aluno.turmaId}/atividades`);
  revalidatePath(`/analise-turma`);
  revalidatePath(`/dashboard-aluno`);
}
