"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getProfessorIdOrThrow } from "@/lib/session";

const grupoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(80),
  tema: z.string().max(120).optional().nullable(),
  alunoIds: z.array(z.string().min(1)).default([]),
});

export async function listGrupos(atividadeId: string) {
  const professorId = await getProfessorIdOrThrow();
  const atividade = await prisma.atividade.findFirst({
    where: { id: atividadeId, professorId },
    select: { id: true },
  });
  if (!atividade) return [];

  return prisma.grupo.findMany({
    where: { atividadeId, professorId },
    orderBy: { createdAt: "asc" },
    include: {
      membros: { select: { alunoId: true } },
    },
  });
}

/**
 * Filtra alunoIds para apenas os que estão atribuídos à atividade
 * e que não estão em outro grupo da mesma atividade (excluindo o grupo
 * que está sendo editado, se houver).
 */
async function alunosValidosParaGrupo(
  atividadeId: string,
  professorId: string,
  alunoIdsDesejados: string[],
  excludeGrupoId?: string,
): Promise<string[]> {
  if (alunoIdsDesejados.length === 0) return [];

  const atividade = await prisma.atividade.findFirst({
    where: { id: atividadeId, professorId },
    select: {
      id: true,
      tipoAtribuicao: true,
      atribuicoes: { select: { alunoId: true } },
      periodo: { select: { turmaId: true } },
    },
  });
  if (!atividade) throw new Error("Atividade não encontrada");

  // Lista de alunos que podem fazer essa atividade
  let alunosAptos: Set<string>;
  if (atividade.tipoAtribuicao === "TODOS") {
    const alunos = await prisma.aluno.findMany({
      where: { turmaId: atividade.periodo.turmaId, professorId },
      select: { id: true },
    });
    alunosAptos = new Set(alunos.map((a) => a.id));
  } else {
    alunosAptos = new Set(atividade.atribuicoes.map((x) => x.alunoId));
  }

  // Alunos já em outros grupos dessa atividade
  const outrosGrupos = await prisma.grupoAluno.findMany({
    where: {
      professorId,
      grupo: { atividadeId },
      ...(excludeGrupoId ? { grupoId: { not: excludeGrupoId } } : {}),
    },
    select: { alunoId: true },
  });
  const ocupados = new Set(outrosGrupos.map((g) => g.alunoId));

  return alunoIdsDesejados.filter(
    (id) => alunosAptos.has(id) && !ocupados.has(id),
  );
}

export async function createGrupo(atividadeId: string, input: unknown) {
  const professorId = await getProfessorIdOrThrow();
  const data = grupoSchema.parse(input);

  const atividade = await prisma.atividade.findFirst({
    where: { id: atividadeId, professorId },
    include: { periodo: { select: { turmaId: true } } },
  });
  if (!atividade) throw new Error("Atividade não encontrada");

  const validIds = await alunosValidosParaGrupo(
    atividadeId,
    professorId,
    data.alunoIds,
  );
  if (validIds.length === 0) {
    throw new Error("O grupo precisa de pelo menos um aluno");
  }

  const grupo = await prisma.grupo.create({
    data: {
      nome: data.nome.trim(),
      tema: data.tema?.trim() || null,
      atividadeId,
      professorId,
      membros: {
        create: validIds.map((alunoId) => ({
          alunoId,
          professorId,
        })),
      },
    },
  });

  revalidatePath(`/turmas/${atividade.periodo.turmaId}/atividades`);
  return grupo;
}

export async function updateGrupo(grupoId: string, input: unknown) {
  const professorId = await getProfessorIdOrThrow();
  const data = grupoSchema.parse(input);

  const grupo = await prisma.grupo.findFirst({
    where: { id: grupoId, professorId },
    include: {
      atividade: { include: { periodo: { select: { turmaId: true } } } },
    },
  });
  if (!grupo) throw new Error("Grupo não encontrado");

  const validIds = await alunosValidosParaGrupo(
    grupo.atividadeId,
    professorId,
    data.alunoIds,
    grupoId,
  );
  if (validIds.length === 0) {
    throw new Error("O grupo precisa de pelo menos um aluno");
  }

  await prisma.$transaction([
    prisma.grupo.update({
      where: { id: grupoId },
      data: {
        nome: data.nome.trim(),
        tema: data.tema?.trim() || null,
      },
    }),
    prisma.grupoAluno.deleteMany({ where: { grupoId } }),
    prisma.grupoAluno.createMany({
      data: validIds.map((alunoId) => ({
        grupoId,
        alunoId,
        professorId,
      })),
    }),
  ]);

  revalidatePath(`/turmas/${grupo.atividade.periodo.turmaId}/atividades`);
}

/**
 * Persiste a "nota do grupo" e preenche a nota dos membros que estão sem nota
 * para a atividade. Membros que já têm nota não são tocados.
 */
export async function setNotaGrupo(
  grupoId: string,
  valor: number | null,
) {
  const professorId = await getProfessorIdOrThrow();

  const grupo = await prisma.grupo.findFirst({
    where: { id: grupoId, professorId },
    include: {
      atividade: {
        select: {
          id: true,
          valorMaximo: true,
          periodo: { select: { turmaId: true, modoCalculo: true } },
        },
      },
      membros: { select: { alunoId: true } },
    },
  });
  if (!grupo) throw new Error("Grupo não encontrado");

  const capEfetivo =
    grupo.atividade.periodo.modoCalculo === "MEDIA"
      ? 10
      : grupo.atividade.valorMaximo;

  if (valor !== null && (valor < 0 || valor > capEfetivo)) {
    throw new Error(`Nota deve estar entre 0 e ${capEfetivo}`);
  }

  const atividadeId = grupo.atividade.id;
  const membrosIds = grupo.membros.map((m) => m.alunoId);

  // Quais membros já têm nota? Só preenche os vazios.
  const notasExistentes =
    membrosIds.length === 0
      ? []
      : await prisma.nota.findMany({
          where: {
            professorId,
            atividadeId,
            alunoId: { in: membrosIds },
          },
          select: { alunoId: true },
        });
  const jaPreenchidos = new Set(notasExistentes.map((n) => n.alunoId));
  const aPreencher = membrosIds.filter((id) => !jaPreenchidos.has(id));

  await prisma.$transaction([
    prisma.grupo.update({
      where: { id: grupoId },
      data: { notaGrupo: valor },
    }),
    // Só cria notas se temos um valor para aplicar
    ...(valor !== null && aPreencher.length > 0
      ? [
          prisma.nota.createMany({
            data: aPreencher.map((alunoId) => ({
              valor,
              alunoId,
              atividadeId,
              professorId,
            })),
          }),
        ]
      : []),
  ]);

  const turmaId = grupo.atividade.periodo.turmaId;
  revalidatePath(`/turmas/${turmaId}/atividades`);
  revalidatePath(`/notas`);
  revalidatePath(`/analise-turma`);
  revalidatePath(`/dashboard-aluno`);
}

export async function removeGrupo(grupoId: string) {
  const professorId = await getProfessorIdOrThrow();
  const grupo = await prisma.grupo.findFirst({
    where: { id: grupoId, professorId },
    include: {
      atividade: { include: { periodo: { select: { turmaId: true } } } },
    },
  });
  if (!grupo) throw new Error("Grupo não encontrado");

  await prisma.grupo.delete({ where: { id: grupoId } });
  revalidatePath(`/turmas/${grupo.atividade.periodo.turmaId}/atividades`);
}
