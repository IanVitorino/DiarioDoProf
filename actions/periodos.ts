"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getProfessorIdOrThrow } from "@/lib/session";
import { ensure4Periodos } from "@/lib/periodos-helper";

const modoSchema = z.enum(["MEDIA", "SOMA"]);

export async function setModoCalculoPeriodo(
  periodoId: string,
  modo: "MEDIA" | "SOMA"
) {
  const professorId = await getProfessorIdOrThrow();
  const data = modoSchema.parse(modo);

  const found = await prisma.periodo.findFirst({
    where: { id: periodoId, professorId },
    select: { id: true, turmaId: true, modoCalculo: true },
  });
  if (!found) throw new Error("Período não encontrado");

  // Se modo realmente mudou, reescala as notas existentes proporcionalmente
  // pra manter o desempenho do aluno coerente com o novo cap.
  if (found.modoCalculo !== data) {
    const atividades = await prisma.atividade.findMany({
      where: { periodoId, professorId },
      select: {
        id: true,
        valorMaximo: true,
        notas: { select: { id: true, valor: true } },
      },
    });

    const round2 = (n: number) => Math.round(n * 100) / 100;

    const updates = atividades.flatMap((a) => {
      if (a.valorMaximo <= 0) return [];
      return a.notas.map((n) => {
        const novoValor =
          data === "SOMA"
            ? // MEDIA → SOMA: cap antigo era 10
              round2((n.valor / 10) * a.valorMaximo)
            : // SOMA → MEDIA: cap antigo era valorMaximo da atividade
              round2((n.valor / a.valorMaximo) * 10);
        return prisma.nota.update({
          where: { id: n.id },
          data: { valor: novoValor },
        });
      });
    });

    await prisma.$transaction([
      prisma.periodo.update({
        where: { id: periodoId },
        data: { modoCalculo: data },
      }),
      ...updates,
    ]);
  } else {
    await prisma.periodo.update({
      where: { id: periodoId },
      data: { modoCalculo: data },
    });
  }

  revalidatePath(`/turmas/${found.turmaId}/atividades`);
  revalidatePath(`/turmas/${found.turmaId}/periodos`);
  revalidatePath(`/notas`);
  revalidatePath(`/analise-turma`);
}

export async function listPeriodosByTurma(turmaId: string) {
  const professorId = await getProfessorIdOrThrow();
  const turma = await prisma.turma.findFirst({
    where: { id: turmaId, professorId },
    select: { id: true },
  });
  if (!turma) return [];

  await ensure4Periodos(turmaId, professorId);

  return prisma.periodo.findMany({
    where: { turmaId, professorId },
    orderBy: { ordem: "asc" },
  });
}

const vigenciaSchema = z.object({
  bimestres: z
    .array(
      z.object({
        id: z.string().min(1),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
      })
    )
    .length(4),
});

export async function updatePeriodosVigencia(turmaId: string, input: unknown) {
  const professorId = await getProfessorIdOrThrow();
  const data = vigenciaSchema.parse(input);

  const owned = await prisma.periodo.findMany({
    where: {
      turmaId,
      professorId,
      id: { in: data.bimestres.map((b) => b.id) },
    },
    select: { id: true },
  });
  if (owned.length !== 4) {
    throw new Error("Períodos não encontrados");
  }

  await prisma.$transaction(
    data.bimestres.map((b) =>
      prisma.periodo.update({
        where: { id: b.id },
        data: {
          dataInicio: b.dataInicio ? new Date(b.dataInicio) : null,
          dataFim: b.dataFim ? new Date(b.dataFim) : null,
        },
      })
    )
  );
  revalidatePath(`/turmas/${turmaId}/periodos`);
}
