-- CreateEnum
CREATE TYPE "TipoAtribuicao" AS ENUM ('TODOS', 'SELECIONADOS');

-- AlterTable
ALTER TABLE "Atividade" ADD COLUMN "tipoAtribuicao" "TipoAtribuicao" NOT NULL DEFAULT 'TODOS';

-- CreateTable
CREATE TABLE "AtividadeAluno" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atividadeId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,

    CONSTRAINT "AtividadeAluno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeAluno_atividadeId_alunoId_key" ON "AtividadeAluno"("atividadeId", "alunoId");

-- CreateIndex
CREATE INDEX "AtividadeAluno_alunoId_idx" ON "AtividadeAluno"("alunoId");

-- CreateIndex
CREATE INDEX "AtividadeAluno_professorId_idx" ON "AtividadeAluno"("professorId");

-- AddForeignKey
ALTER TABLE "AtividadeAluno" ADD CONSTRAINT "AtividadeAluno_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeAluno" ADD CONSTRAINT "AtividadeAluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
