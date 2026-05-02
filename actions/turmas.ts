"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getProfessorIdOrThrow } from "@/lib/session";
import { BIMESTRES_FIXOS } from "@/lib/turma-format";

const turmaSchema = z.object({
  turma: z.string().min(1, "Turma é obrigatória").max(10),
  nivel: z.enum(["FUNDAMENTAL_I", "FUNDAMENTAL_II", "MEDIO"]),
  serie: z.string().min(1, "Série é obrigatória"),
  disciplina: z.string().min(1, "Disciplina é obrigatória"),
  escola: z.string().min(1, "Escola é obrigatória").max(120),
  turno: z.enum(["MATUTINO", "VESPERTINO", "NOTURNO"]),
  ano: z.coerce.number().int().min(2000).max(2100),
});

function buildNome(serie: string, turma: string) {
  return `${serie}º ${turma.toUpperCase()}`;
}

export async function listTurmas() {
  const professorId = await getProfessorIdOrThrow();
  return prisma.turma.findMany({
    where: { professorId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getTurma(id: string) {
  const professorId = await getProfessorIdOrThrow();
  return prisma.turma.findFirst({
    where: { id, professorId },
  });
}

export async function createTurma(input: unknown) {
  const professorId = await getProfessorIdOrThrow();
  const data = turmaSchema.parse(input);
  const turma = await prisma.turma.create({
    data: {
      ...data,
      turma: data.turma.toUpperCase(),
      nome: buildNome(data.serie, data.turma),
      professorId,
      periodos: {
        create: BIMESTRES_FIXOS.map((ordem) => ({
          ordem,
          professorId,
        })),
      },
    },
  });
  revalidatePath("/turmas");
  return turma;
}

export async function updateTurma(id: string, input: unknown) {
  const professorId = await getProfessorIdOrThrow();
  const data = turmaSchema.parse(input);
  const updated = await prisma.turma.updateMany({
    where: { id, professorId },
    data: {
      ...data,
      turma: data.turma.toUpperCase(),
      nome: buildNome(data.serie, data.turma),
    },
  });
  if (updated.count === 0) throw new Error("Turma não encontrada");
  revalidatePath("/turmas");
  revalidatePath(`/turmas/${id}`);
}

export async function archiveTurma(id: string) {
  const professorId = await getProfessorIdOrThrow();
  const updated = await prisma.turma.updateMany({
    where: { id, professorId },
    data: { status: "CONCLUIDA" },
  });
  if (updated.count === 0) throw new Error("Turma não encontrada");
  revalidatePath("/turmas");
}

export async function reactivateTurma(id: string) {
  const professorId = await getProfessorIdOrThrow();
  const updated = await prisma.turma.updateMany({
    where: { id, professorId },
    data: { status: "ATIVA" },
  });
  if (updated.count === 0) throw new Error("Turma não encontrada");
  revalidatePath("/turmas");
}

export async function removeTurma(id: string) {
  const professorId = await getProfessorIdOrThrow();
  const found = await prisma.turma.findFirst({
    where: { id, professorId },
    select: { id: true },
  });
  if (!found) throw new Error("Turma não encontrada");
  await prisma.turma.delete({ where: { id } });
  revalidatePath("/turmas");
}
