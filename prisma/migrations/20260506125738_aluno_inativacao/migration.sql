-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "inativadoEm" TIMESTAMP(3),
ADD COLUMN     "inativoApartirDeBimestre" INTEGER,
ADD COLUMN     "motivoInativacao" TEXT;
