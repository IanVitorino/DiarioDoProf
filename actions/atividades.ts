"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getProfessorIdOrThrow } from "@/lib/session";
import { ensure4Periodos } from "@/lib/periodos-helper";

const atividadeSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  valorMaximo: z.coerce.number().positive("Valor máximo deve ser maior que 0"),
  periodoId: z.string().min(1, "Período é obrigatório"),
  data: z.string().optional(), // ISO "YYYY-MM-DD" ou ""
});

function parseData(raw: string | undefined): Date | null {
  if (!raw || raw.trim() === "") return null;
  // Parse como UTC midnight, consistente com armazenamento
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export async function listPeriodosComAtividades(turmaId: string) {
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
    include: {
      atividades: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

function exigirVigencia(periodo: {
  ordem: number;
  dataInicio: Date | null;
  dataFim: Date | null;
}) {
  if (!periodo.dataInicio || !periodo.dataFim) {
    throw new Error(
      `Configure a vigência do ${periodo.ordem}º bimestre antes de adicionar atividades.`
    );
  }
}

function validarDataDentroDoBimestre(
  data: Date | null,
  periodo: { ordem: number; dataInicio: Date | null; dataFim: Date | null }
) {
  if (!data) return;
  if (periodo.dataInicio && data < periodo.dataInicio) {
    throw new Error(
      `A data da atividade não pode ser anterior ao início do ${periodo.ordem}º bimestre.`
    );
  }
  if (periodo.dataFim && data > periodo.dataFim) {
    throw new Error(
      `A data da atividade não pode ser posterior ao fim do ${periodo.ordem}º bimestre.`
    );
  }
}

export async function createAtividade(input: unknown) {
  const professorId = await getProfessorIdOrThrow();
  const data = atividadeSchema.parse(input);

  const periodo = await prisma.periodo.findFirst({
    where: { id: data.periodoId, professorId },
    select: {
      id: true,
      turmaId: true,
      ordem: true,
      dataInicio: true,
      dataFim: true,
    },
  });
  if (!periodo) throw new Error("Período não encontrado");

  exigirVigencia(periodo);
  const dataParsed = parseData(data.data);
  validarDataDentroDoBimestre(dataParsed, periodo);

  const atividade = await prisma.atividade.create({
    data: {
      nome: data.nome,
      valorMaximo: data.valorMaximo,
      data: dataParsed,
      periodoId: data.periodoId,
      professorId,
    },
  });
  revalidatePath(`/turmas/${periodo.turmaId}/atividades`);
  return atividade;
}

export async function updateAtividade(id: string, input: unknown) {
  const professorId = await getProfessorIdOrThrow();
  const data = atividadeSchema.parse(input);

  const found = await prisma.atividade.findFirst({
    where: { id, professorId },
    include: {
      periodo: { select: { turmaId: true, modoCalculo: true } },
      notas: { select: { id: true, valor: true } },
    },
  });
  if (!found) throw new Error("Atividade não encontrada");

  const novoPeriodo = await prisma.periodo.findFirst({
    where: { id: data.periodoId, professorId },
    select: {
      id: true,
      turmaId: true,
      ordem: true,
      dataInicio: true,
      dataFim: true,
      modoCalculo: true,
    },
  });
  if (!novoPeriodo) throw new Error("Período não encontrado");

  if (novoPeriodo.turmaId !== found.periodo.turmaId) {
    throw new Error("Não é possível mover atividade entre turmas");
  }

  exigirVigencia(novoPeriodo);
  const dataParsed = parseData(data.data);
  validarDataDentroDoBimestre(dataParsed, novoPeriodo);

  // Reescala notas existentes se o cap efetivo da atividade mudou.
  // Cap depende do modo do período de origem/destino:
  //   - MEDIA: cap = 10 (ignora valorMaximo)
  //   - SOMA:  cap = valorMaximo da atividade
  const capAntigo =
    found.periodo.modoCalculo === "MEDIA" ? 10 : found.valorMaximo;
  const capNovo =
    novoPeriodo.modoCalculo === "MEDIA" ? 10 : data.valorMaximo;

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const updates =
    capAntigo > 0 && capNovo > 0 && capAntigo !== capNovo
      ? found.notas.map((n) =>
          prisma.nota.update({
            where: { id: n.id },
            data: { valor: round2((n.valor / capAntigo) * capNovo) },
          }),
        )
      : [];

  await prisma.$transaction([
    prisma.atividade.update({
      where: { id },
      data: {
        nome: data.nome,
        valorMaximo: data.valorMaximo,
        data: dataParsed,
        periodoId: data.periodoId,
      },
    }),
    ...updates,
  ]);
  revalidatePath(`/turmas/${found.periodo.turmaId}/atividades`);
}

export async function removeAtividade(id: string) {
  const professorId = await getProfessorIdOrThrow();
  const found = await prisma.atividade.findFirst({
    where: { id, professorId },
    include: { periodo: { select: { turmaId: true } } },
  });
  if (!found) throw new Error("Atividade não encontrada");

  await prisma.atividade.delete({ where: { id } });
  revalidatePath(`/turmas/${found.periodo.turmaId}/atividades`);
}
