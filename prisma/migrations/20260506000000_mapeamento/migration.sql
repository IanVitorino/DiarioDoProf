-- CreateTable
CREATE TABLE "Mapeamento" (
    "id" TEXT NOT NULL,
    "linhas" INTEGER NOT NULL,
    "colunas" INTEGER NOT NULL,
    "refDireitaTopo" TEXT,
    "refEsquerdaBase" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "turmaId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,

    CONSTRAINT "Mapeamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carteira" (
    "id" TEXT NOT NULL,
    "linha" INTEGER NOT NULL,
    "coluna" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mapeamentoId" TEXT NOT NULL,
    "alunoId" TEXT,
    "professorId" TEXT NOT NULL,

    CONSTRAINT "Carteira_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mapeamento_turmaId_key" ON "Mapeamento"("turmaId");

-- CreateIndex
CREATE INDEX "Mapeamento_professorId_idx" ON "Mapeamento"("professorId");

-- CreateIndex
CREATE UNIQUE INDEX "Carteira_alunoId_key" ON "Carteira"("alunoId");

-- CreateIndex
CREATE INDEX "Carteira_professorId_idx" ON "Carteira"("professorId");

-- CreateIndex
CREATE INDEX "Carteira_alunoId_idx" ON "Carteira"("alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "Carteira_mapeamentoId_linha_coluna_key" ON "Carteira"("mapeamentoId", "linha", "coluna");

-- AddForeignKey
ALTER TABLE "Mapeamento" ADD CONSTRAINT "Mapeamento_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carteira" ADD CONSTRAINT "Carteira_mapeamentoId_fkey" FOREIGN KEY ("mapeamentoId") REFERENCES "Mapeamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carteira" ADD CONSTRAINT "Carteira_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;
