"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getProfessorIdOrThrow } from "@/lib/session";

const dimensoesSchema = z.object({
  linhas: z.coerce.number().int().min(1).max(9),
  colunas: z.coerce.number().int().min(1).max(9),
});

const referenciasSchema = z.object({
  refDireitaTopo: z.string().max(40).nullable(),
  refEsquerdaBase: z.string().max(40).nullable(),
});

async function assertTurmaPertence(turmaId: string, professorId: string) {
  const turma = await prisma.turma.findFirst({
    where: { id: turmaId, professorId },
    select: { id: true },
  });
  if (!turma) throw new Error("Turma não encontrada");
}

export async function getMapeamento(turmaId: string) {
  const professorId = await getProfessorIdOrThrow();
  await assertTurmaPertence(turmaId, professorId);

  const [mapeamento, alunos] = await Promise.all([
    prisma.mapeamento.findUnique({
      where: { turmaId },
      include: {
        carteiras: {
          orderBy: [{ linha: "asc" }, { coluna: "asc" }],
        },
      },
    }),
    prisma.aluno.findMany({
      where: { turmaId, professorId },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return { mapeamento, alunos };
}

export async function criarMapeamento(turmaId: string, input: unknown) {
  const professorId = await getProfessorIdOrThrow();
  await assertTurmaPertence(turmaId, professorId);

  const data = dimensoesSchema.parse(input);

  // Valida cap (área >= número de alunos)
  const totalAlunos = await prisma.aluno.count({
    where: { turmaId, professorId },
  });
  const area = data.linhas * data.colunas;
  if (area < totalAlunos) {
    throw new Error(
      `O grid (${data.linhas}×${data.colunas} = ${area} carteiras) é menor que a quantidade de alunos (${totalAlunos}).`,
    );
  }

  // Já existe?
  const existente = await prisma.mapeamento.findUnique({
    where: { turmaId },
    select: { id: true },
  });
  if (existente) {
    throw new Error("A turma já tem um mapeamento.");
  }

  // Cria mapeamento + carteiras vazias
  const carteiras: { linha: number; coluna: number; professorId: string }[] = [];
  for (let l = 1; l <= data.linhas; l++) {
    for (let c = 1; c <= data.colunas; c++) {
      carteiras.push({ linha: l, coluna: c, professorId });
    }
  }

  await prisma.mapeamento.create({
    data: {
      turmaId,
      linhas: data.linhas,
      colunas: data.colunas,
      professorId,
      carteiras: { create: carteiras },
    },
  });

  revalidatePath(`/turmas/${turmaId}/mapeamento`);
}

export async function atualizarDimensoes(
  mapeamentoId: string,
  input: unknown,
) {
  const professorId = await getProfessorIdOrThrow();
  const data = dimensoesSchema.parse(input);

  const mapeamento = await prisma.mapeamento.findFirst({
    where: { id: mapeamentoId, professorId },
    select: {
      id: true,
      turmaId: true,
      linhas: true,
      colunas: true,
    },
  });
  if (!mapeamento) throw new Error("Mapeamento não encontrado");

  const totalAlunos = await prisma.aluno.count({
    where: { turmaId: mapeamento.turmaId, professorId },
  });
  const area = data.linhas * data.colunas;
  if (area < totalAlunos) {
    throw new Error(
      `O grid (${data.linhas}×${data.colunas} = ${area}) é menor que a quantidade de alunos (${totalAlunos}).`,
    );
  }

  // Carteiras que vão sumir (linha > novasLinhas OU coluna > novasColunas)
  const carteirasParaRemover = await prisma.carteira.findMany({
    where: {
      mapeamentoId,
      OR: [
        { linha: { gt: data.linhas } },
        { coluna: { gt: data.colunas } },
      ],
    },
    select: { id: true, linha: true, coluna: true, alunoId: true },
  });

  const ocupadasParaRemover = carteirasParaRemover.filter((c) => c.alunoId);
  if (ocupadasParaRemover.length > 0) {
    throw new Error(
      `Não é possível reduzir o grid: ${ocupadasParaRemover.length} aluno(s) ocupariam carteiras removidas. Tire-os dessas posições primeiro.`,
    );
  }

  // Carteiras a criar (que não existem ainda no novo grid)
  const carteirasExistentes = await prisma.carteira.findMany({
    where: { mapeamentoId },
    select: { linha: true, coluna: true },
  });
  const setExistentes = new Set(
    carteirasExistentes.map((c) => `${c.linha}_${c.coluna}`),
  );
  const novasCarteiras: {
    linha: number;
    coluna: number;
    mapeamentoId: string;
    professorId: string;
  }[] = [];
  for (let l = 1; l <= data.linhas; l++) {
    for (let c = 1; c <= data.colunas; c++) {
      if (!setExistentes.has(`${l}_${c}`)) {
        novasCarteiras.push({
          linha: l,
          coluna: c,
          mapeamentoId,
          professorId,
        });
      }
    }
  }

  await prisma.$transaction([
    prisma.mapeamento.update({
      where: { id: mapeamentoId },
      data: { linhas: data.linhas, colunas: data.colunas },
    }),
    prisma.carteira.deleteMany({
      where: {
        mapeamentoId,
        OR: [
          { linha: { gt: data.linhas } },
          { coluna: { gt: data.colunas } },
        ],
      },
    }),
    ...(novasCarteiras.length > 0
      ? [prisma.carteira.createMany({ data: novasCarteiras })]
      : []),
  ]);

  revalidatePath(`/turmas/${mapeamento.turmaId}/mapeamento`);
}

export async function setReferencias(mapeamentoId: string, input: unknown) {
  const professorId = await getProfessorIdOrThrow();
  const data = referenciasSchema.parse(input);

  const mapeamento = await prisma.mapeamento.findFirst({
    where: { id: mapeamentoId, professorId },
    select: { id: true, turmaId: true },
  });
  if (!mapeamento) throw new Error("Mapeamento não encontrado");

  await prisma.mapeamento.update({
    where: { id: mapeamentoId },
    data: {
      refDireitaTopo: data.refDireitaTopo?.trim() || null,
      refEsquerdaBase: data.refEsquerdaBase?.trim() || null,
    },
  });

  revalidatePath(`/turmas/${mapeamento.turmaId}/mapeamento`);
}

/**
 * Posiciona um aluno numa carteira específica.
 * Se o aluno já está em outra carteira, move ele.
 * Se a carteira destino já tem outro aluno, é um erro
 * (caller deve confirmar a substituição via removerDaCarteira primeiro).
 */
export async function posicionarAluno(
  carteiraId: string,
  alunoId: string,
) {
  const professorId = await getProfessorIdOrThrow();

  const [carteira, aluno] = await Promise.all([
    prisma.carteira.findFirst({
      where: { id: carteiraId, professorId },
      include: { mapeamento: { select: { turmaId: true } } },
    }),
    prisma.aluno.findFirst({
      where: { id: alunoId, professorId },
      select: { id: true, turmaId: true },
    }),
  ]);
  if (!carteira) throw new Error("Carteira não encontrada");
  if (!aluno) throw new Error("Aluno não encontrado");
  if (aluno.turmaId !== carteira.mapeamento.turmaId) {
    throw new Error("Aluno e carteira não pertencem à mesma turma");
  }

  // Se a carteira destino já tem outro aluno, troca os dois (swap).
  // Senão, só posiciona.
  if (carteira.alunoId && carteira.alunoId !== alunoId) {
    // Aluno atual da carteira destino
    const alunoAtualNaCarteira = carteira.alunoId;
    // Onde o aluno que está sendo movido estava (se estava em alguma)
    const carteiraOrigem = await prisma.carteira.findFirst({
      where: { mapeamentoId: carteira.mapeamentoId, alunoId },
      select: { id: true },
    });

    if (carteiraOrigem) {
      // Swap: aluno destino vai pra carteira de origem do que está sendo movido
      await prisma.$transaction([
        // Limpa as duas carteiras antes (pra evitar conflito de unique alunoId)
        prisma.carteira.update({
          where: { id: carteira.id },
          data: { alunoId: null },
        }),
        prisma.carteira.update({
          where: { id: carteiraOrigem.id },
          data: { alunoId: null },
        }),
        prisma.carteira.update({
          where: { id: carteira.id },
          data: { alunoId },
        }),
        prisma.carteira.update({
          where: { id: carteiraOrigem.id },
          data: { alunoId: alunoAtualNaCarteira },
        }),
      ]);
    } else {
      // Aluno destino sai da carteira (vira não-posicionado), aluno novo entra
      await prisma.$transaction([
        prisma.carteira.update({
          where: { id: carteira.id },
          data: { alunoId: null },
        }),
        prisma.carteira.update({
          where: { id: carteira.id },
          data: { alunoId },
        }),
      ]);
    }
  } else {
    // Carteira vazia ou já tem o mesmo aluno → só garante o estado
    // Tira o aluno de qualquer outra carteira (pode estar em outra)
    await prisma.$transaction([
      prisma.carteira.updateMany({
        where: {
          mapeamentoId: carteira.mapeamentoId,
          alunoId,
          NOT: { id: carteira.id },
        },
        data: { alunoId: null },
      }),
      prisma.carteira.update({
        where: { id: carteira.id },
        data: { alunoId },
      }),
    ]);
  }

  revalidatePath(`/turmas/${carteira.mapeamento.turmaId}/mapeamento`);
}

export async function removerDaCarteira(carteiraId: string) {
  const professorId = await getProfessorIdOrThrow();

  const carteira = await prisma.carteira.findFirst({
    where: { id: carteiraId, professorId },
    include: { mapeamento: { select: { turmaId: true } } },
  });
  if (!carteira) throw new Error("Carteira não encontrada");

  await prisma.carteira.update({
    where: { id: carteiraId },
    data: { alunoId: null },
  });

  revalidatePath(`/turmas/${carteira.mapeamento.turmaId}/mapeamento`);
}

export async function limparPosicoes(mapeamentoId: string) {
  const professorId = await getProfessorIdOrThrow();
  const mapeamento = await prisma.mapeamento.findFirst({
    where: { id: mapeamentoId, professorId },
    select: { id: true, turmaId: true },
  });
  if (!mapeamento) throw new Error("Mapeamento não encontrado");

  await prisma.carteira.updateMany({
    where: { mapeamentoId },
    data: { alunoId: null },
  });

  revalidatePath(`/turmas/${mapeamento.turmaId}/mapeamento`);
}

export async function apagarMapeamento(mapeamentoId: string) {
  const professorId = await getProfessorIdOrThrow();
  const mapeamento = await prisma.mapeamento.findFirst({
    where: { id: mapeamentoId, professorId },
    select: { id: true, turmaId: true },
  });
  if (!mapeamento) throw new Error("Mapeamento não encontrado");

  await prisma.mapeamento.delete({ where: { id: mapeamentoId } });

  revalidatePath(`/turmas/${mapeamento.turmaId}/mapeamento`);
}
