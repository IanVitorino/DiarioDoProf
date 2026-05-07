"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getProfessorIdOrThrow } from "@/lib/session";

const alunoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
});

const inativarSchema = z.object({
  bimestre: z.number().int().min(1).max(4),
  motivo: z.string().trim().max(200).optional().nullable(),
});

const NOME_REGEX = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'-]*$/;

const importarSchema = z.object({
  nomes: z.array(z.string().min(1).max(120)).min(1).max(500),
});

export async function listAlunosByTurma(turmaId: string) {
  const professorId = await getProfessorIdOrThrow();
  return prisma.aluno.findMany({
    where: { turmaId, professorId },
    orderBy: { nome: "asc" },
  });
}

export async function createAluno(turmaId: string, input: unknown) {
  const professorId = await getProfessorIdOrThrow();
  const data = alunoSchema.parse(input);

  const turma = await prisma.turma.findFirst({
    where: { id: turmaId, professorId },
    select: { id: true },
  });
  if (!turma) throw new Error("Turma não encontrada");

  const aluno = await prisma.aluno.create({
    data: {
      nome: data.nome,
      turmaId,
      professorId,
    },
  });
  revalidatePath(`/turmas/${turmaId}/alunos`);
  return aluno;
}

export async function updateAluno(id: string, input: unknown) {
  const professorId = await getProfessorIdOrThrow();
  const data = alunoSchema.parse(input);

  const found = await prisma.aluno.findFirst({
    where: { id, professorId },
    select: { id: true, turmaId: true },
  });
  if (!found) throw new Error("Aluno não encontrado");

  await prisma.aluno.update({
    where: { id },
    data: { nome: data.nome },
  });
  revalidatePath(`/turmas/${found.turmaId}/alunos`);
}

export async function removeAluno(id: string) {
  const professorId = await getProfessorIdOrThrow();
  const found = await prisma.aluno.findFirst({
    where: { id, professorId },
    select: { id: true, turmaId: true, inativoApartirDeBimestre: true },
  });
  if (!found) throw new Error("Aluno não encontrado");
  if (found.inativoApartirDeBimestre == null) {
    throw new Error("Inative o aluno antes de excluir");
  }

  await prisma.aluno.delete({ where: { id } });
  revalidatePath(`/turmas/${found.turmaId}/alunos`);
}

export async function inativarAluno(id: string, input: unknown) {
  const professorId = await getProfessorIdOrThrow();
  const data = inativarSchema.parse(input);

  const found = await prisma.aluno.findFirst({
    where: { id, professorId },
    select: { id: true, turmaId: true },
  });
  if (!found) throw new Error("Aluno não encontrado");

  const motivo = data.motivo?.trim() || null;

  await prisma.$transaction([
    prisma.aluno.update({
      where: { id },
      data: {
        inativoApartirDeBimestre: data.bimestre,
        inativadoEm: new Date(),
        motivoInativacao: motivo,
      },
    }),
    // Libera carteira do mapa, se houver
    prisma.carteira.updateMany({
      where: { alunoId: id, professorId },
      data: { alunoId: null },
    }),
  ]);

  revalidatePath(`/turmas/${found.turmaId}/alunos`);
  revalidatePath(`/turmas/${found.turmaId}/mapeamento`);
  revalidatePath(`/turmas/${found.turmaId}/atividades`);
  revalidatePath(`/notas`);
  revalidatePath(`/analise-turma`);
  revalidatePath(`/dashboard-aluno`);
  revalidatePath(`/dashboard-atividades`);
}

export async function importarAlunos(turmaId: string, input: unknown) {
  const professorId = await getProfessorIdOrThrow();
  const data = importarSchema.parse(input);

  const turma = await prisma.turma.findFirst({
    where: { id: turmaId, professorId },
    select: { id: true },
  });
  if (!turma) throw new Error("Turma não encontrada");

  // Sanitiza: trim + colapsa espaços + filtra inválidos (defesa em profundidade)
  const limpos = Array.from(
    new Set(
      data.nomes
        .map((n) => n.trim().replace(/\s+/g, " "))
        .filter((n) => n !== "" && NOME_REGEX.test(n)),
    ),
  );
  if (limpos.length === 0) {
    return { inseridos: 0, duplicados: 0 };
  }

  // Pula nomes que já existem na turma (case-insensitive)
  const existentes = await prisma.aluno.findMany({
    where: { turmaId, professorId },
    select: { nome: true },
  });
  const setExistentes = new Set(existentes.map((a) => a.nome.toLowerCase()));

  const aInserir = limpos.filter((n) => !setExistentes.has(n.toLowerCase()));
  const duplicados = limpos.length - aInserir.length;

  if (aInserir.length > 0) {
    await prisma.aluno.createMany({
      data: aInserir.map((nome) => ({ nome, turmaId, professorId })),
    });
  }

  revalidatePath(`/turmas/${turmaId}/alunos`);
  return { inseridos: aInserir.length, duplicados };
}

export async function reativarAluno(id: string) {
  const professorId = await getProfessorIdOrThrow();
  const found = await prisma.aluno.findFirst({
    where: { id, professorId },
    select: { id: true, turmaId: true },
  });
  if (!found) throw new Error("Aluno não encontrado");

  await prisma.aluno.update({
    where: { id },
    data: {
      inativoApartirDeBimestre: null,
      inativadoEm: null,
      motivoInativacao: null,
    },
  });

  revalidatePath(`/turmas/${found.turmaId}/alunos`);
  revalidatePath(`/turmas/${found.turmaId}/mapeamento`);
  revalidatePath(`/turmas/${found.turmaId}/atividades`);
  revalidatePath(`/notas`);
  revalidatePath(`/analise-turma`);
  revalidatePath(`/dashboard-aluno`);
  revalidatePath(`/dashboard-atividades`);
}
