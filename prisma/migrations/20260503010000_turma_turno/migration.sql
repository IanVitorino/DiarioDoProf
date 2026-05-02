-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MATUTINO', 'VESPERTINO', 'NOTURNO');

-- AlterTable
ALTER TABLE "Turma" ADD COLUMN "turno" "Turno";
