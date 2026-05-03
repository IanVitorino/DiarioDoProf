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
  tipo: z.enum(["INDIVIDUAL", "GRUPO"]).default("INDIVIDUAL"),
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
        include: {
          atribuicoes: {
            select: { alunoId: true },
          },
          notas: {
            select: { alunoId: true, valor: true },
          },
          grupos: {
            orderBy: { createdAt: "asc" },
            include: {
              membros: { select: { alunoId: true } },
            },
          },
        },
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
      tipo: data.tipo,
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
        tipo: data.tipo,
        periodoId: data.periodoId,
      },
    }),
    ...updates,
  ]);
  revalidatePath(`/turmas/${found.periodo.turmaId}/atividades`);
}

export async function setAtribuicaoAtividade(
  atividadeId: string,
  alunoIds: string[],
) {
  const professorId = await getProfessorIdOrThrow();

  const atividade = await prisma.atividade.findFirst({
    where: { id: atividadeId, professorId },
    include: { periodo: { select: { turmaId: true } } },
  });
  if (!atividade) throw new Error("Atividade não encontrada");

  const turmaId = atividade.periodo.turmaId;

  const alunosTurma = await prisma.aluno.findMany({
    where: { turmaId, professorId },
    select: { id: true },
  });
  const alunosTurmaIds = new Set(alunosTurma.map((a) => a.id));

  // Filtra apenas alunos que pertencem à turma (defesa em profundidade)
  const validIds = alunoIds.filter((id) => alunosTurmaIds.has(id));
  const todosMarcados =
    validIds.length === alunosTurmaIds.size && alunosTurmaIds.size > 0;

  if (todosMarcados) {
    // Volta para "TODOS" e limpa a tabela de junção.
    // Não mexe em grupos: todos os atribuídos são todos, nenhum aluno fica órfão.
    await prisma.$transaction([
      prisma.atividadeAluno.deleteMany({ where: { atividadeId } }),
      prisma.atividade.update({
        where: { id: atividadeId },
        data: { tipoAtribuicao: "TODOS" },
      }),
    ]);
  } else {
    // Vira SELECIONADOS. Remove dos grupos qualquer aluno que saiu da atribuição.
    const selecionadosSet = new Set(validIds);
    const removidos = Array.from(alunosTurmaIds).filter(
      (id) => !selecionadosSet.has(id),
    );

    await prisma.$transaction([
      prisma.atividadeAluno.deleteMany({ where: { atividadeId } }),
      prisma.atividadeAluno.createMany({
        data: validIds.map((alunoId) => ({
          atividadeId,
          alunoId,
          professorId,
        })),
      }),
      prisma.atividade.update({
        where: { id: atividadeId },
        data: { tipoAtribuicao: "SELECIONADOS" },
      }),
      // Cascata: remove dos grupos qualquer aluno desatribuído
      ...(removidos.length > 0
        ? [
            prisma.grupoAluno.deleteMany({
              where: {
                professorId,
                alunoId: { in: removidos },
                grupo: { atividadeId },
              },
            }),
          ]
        : []),
    ]);
  }

  revalidatePath(`/turmas/${turmaId}/atividades`);
  revalidatePath(`/notas`);
  revalidatePath(`/analise-turma`);
  revalidatePath(`/dashboard-aluno`);
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
