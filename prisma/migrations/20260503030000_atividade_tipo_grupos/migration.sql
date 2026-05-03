-- CreateEnum
CREATE TYPE "TipoAtividade" AS ENUM ('INDIVIDUAL', 'GRUPO');

-- AlterTable
ALTER TABLE "Atividade" ADD COLUMN "tipo" "TipoAtividade" NOT NULL DEFAULT 'INDIVIDUAL';

-- CreateTable
CREATE TABLE "Grupo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tema" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,

    CONSTRAINT "Grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrupoAluno" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grupoId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,

    CONSTRAINT "GrupoAluno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Grupo_atividadeId_idx" ON "Grupo"("atividadeId");

-- CreateIndex
CREATE INDEX "Grupo_professorId_idx" ON "Grupo"("professorId");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoAluno_grupoId_alunoId_key" ON "GrupoAluno"("grupoId", "alunoId");

-- CreateIndex
CREATE INDEX "GrupoAluno_alunoId_idx" ON "GrupoAluno"("alunoId");

-- CreateIndex
CREATE INDEX "GrupoAluno_professorId_idx" ON "GrupoAluno"("professorId");

-- AddForeignKey
ALTER TABLE "Grupo" ADD CONSTRAINT "Grupo_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoAluno" ADD CONSTRAINT "GrupoAluno_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoAluno" ADD CONSTRAINT "GrupoAluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
