"use server";

import { prisma } from "@/lib/prisma";
import { getProfessorIdOrThrow } from "@/lib/session";

export async function getMeuPerfil() {
  const professorId = await getProfessorIdOrThrow();
  const [professor, totalTurmas] = await Promise.all([
    prisma.professor.findUniqueOrThrow({
      where: { id: professorId },
      select: { id: true, nome: true, email: true, createdAt: true },
    }),
    prisma.turma.count({ where: { professorId } }),
  ]);
  return { ...professor, totalTurmas };
}
