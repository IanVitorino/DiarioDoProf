import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const PROFESSOR_ID = "b7acd583-8e19-4945-a9a8-e76f1a1151d6"; // Ian Vitorino

const NOMES = [
  "Alice Pereira Cavalcanti", "Arthur Souza Andrade", "Beatriz Cardoso Lima",
  "Bernardo Alves Mendes", "Bianca Ribeiro Souza", "Caio Soares Oliveira",
  "Cecília Martins Reis", "Daniel Pinto Rocha", "Davi Mendes Carvalho",
  "Eloá Ferreira Lima", "Enzo Castro Almeida", "Esther Lima Pereira",
  "Felipe Andrade Costa", "Gabriela Souza Pinto", "Heitor Reis Vasconcelos",
  "Helena Rodrigues Santos", "Igor Carvalho Cardoso", "Isabella Moreira Reis",
  "Joaquim Soares Lopes", "Júlia Ribeiro Cardoso", "Lara Souza Pereira",
  "Leandro Costa Andrade", "Lívia Almeida Mendes", "Lorenzo Carvalho Mendes",
  "Maitê Oliveira Santos", "Miguel Ferreira Lopes", "Nicole Castro Reis",
  "Pedro Mendes Silva", "Sofia Carvalho Cunha", "Theo Pereira Lima",
];

const VIGENCIAS_2026 = [
  { ordem: 1, dataInicio: new Date("2026-02-03"), dataFim: new Date("2026-04-17") },
  { ordem: 2, dataInicio: new Date("2026-04-27"), dataFim: new Date("2026-07-10") },
  { ordem: 3, dataInicio: new Date("2026-07-27"), dataFim: new Date("2026-10-02") },
  { ordem: 4, dataInicio: new Date("2026-10-13"), dataFim: new Date("2026-12-18") },
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function notaAleatoria(): number {
  // distribuição mais próxima de uma turma real: maior densidade entre 5-9
  const r = Math.random();
  let v: number;
  if (r < 0.15) v = rand(2, 5);
  else if (r < 0.35) v = rand(5, 6);
  else if (r < 0.7) v = rand(6, 8);
  else v = rand(8, 10);
  return Math.round(v * 10) / 10;
}

const TEMAS_GRUPO = [
  "Globalização",
  "Mudanças climáticas",
  "Geopolítica do petróleo",
  "Urbanização e mobilidade",
  "Biomas brasileiros",
  "Conflitos no Oriente Médio",
];

interface AtividadeSpec {
  nome: string;
  valorMaximo: number;
  tipo: "INDIVIDUAL" | "GRUPO";
  data: string; // dia dentro do bimestre
}

const ATIVIDADES_POR_BIMESTRE: AtividadeSpec[] = [
  { nome: "Prova mensal", valorMaximo: 10, tipo: "INDIVIDUAL", data: "+15d" },
  { nome: "Exercícios em sala", valorMaximo: 10, tipo: "INDIVIDUAL", data: "+30d" },
  { nome: "Trabalho em grupo", valorMaximo: 10, tipo: "GRUPO", data: "+45d" },
  { nome: "Apresentação em grupo", valorMaximo: 10, tipo: "GRUPO", data: "+60d" },
];

function dataDentroDoBimestre(inicio: Date, offsetDias: number): Date {
  const d = new Date(inicio);
  d.setUTCDate(d.getUTCDate() + offsetDias);
  return d;
}

function parseOffset(spec: string): number {
  const m = spec.match(/^\+(\d+)d$/);
  return m ? Number(m[1]) : 0;
}

async function main() {
  console.log("→ Criando turma 3º C · Geografia (Ensino Médio)...");

  // 1) Cria turma + 4 períodos
  const turma = await prisma.turma.create({
    data: {
      nome: "3º C",
      serie: "3",
      turma: "C",
      nivel: "MEDIO",
      disciplina: "Geografia",
      escola: "EE Cecília Meireles",
      turno: "MATUTINO",
      ano: 2026,
      professorId: PROFESSOR_ID,
      periodos: {
        create: VIGENCIAS_2026.map((v) => ({
          ordem: v.ordem,
          dataInicio: v.dataInicio,
          dataFim: v.dataFim,
          professorId: PROFESSOR_ID,
        })),
      },
    },
    include: { periodos: { orderBy: { ordem: "asc" } } },
  });
  console.log(`  ✓ Turma ${turma.id}`);

  // 2) Cria alunos
  const nomesEscolhidos = shuffle(NOMES).slice(0, 30);
  await prisma.aluno.createMany({
    data: nomesEscolhidos.map((nome) => ({
      nome,
      turmaId: turma.id,
      professorId: PROFESSOR_ID,
    })),
  });
  const alunos = await prisma.aluno.findMany({
    where: { turmaId: turma.id },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
  console.log(`  ✓ ${alunos.length} alunos`);

  // 3) Cria atividades por bimestre
  for (const periodo of turma.periodos) {
    console.log(`\n  → Bimestre ${periodo.ordem}`);
    for (const spec of ATIVIDADES_POR_BIMESTRE) {
      const data = dataDentroDoBimestre(periodo.dataInicio!, parseOffset(spec.data));

      const atividade = await prisma.atividade.create({
        data: {
          nome: spec.nome,
          valorMaximo: spec.valorMaximo,
          data,
          tipo: spec.tipo,
          periodoId: periodo.id,
          professorId: PROFESSOR_ID,
        },
      });

      if (spec.tipo === "INDIVIDUAL") {
        // Lança nota pra ~85% dos alunos
        const lancamentos = shuffle(alunos)
          .slice(0, Math.floor(alunos.length * 0.85))
          .map((a) => ({
            valor: notaAleatoria(),
            alunoId: a.id,
            atividadeId: atividade.id,
            professorId: PROFESSOR_ID,
          }));
        await prisma.nota.createMany({ data: lancamentos });
        console.log(
          `    ✓ ${spec.nome} (individual) · ${lancamentos.length} notas`,
        );
      } else {
        // GRUPO: cria 5–6 grupos com 4-7 alunos cada, deixa 2-4 alunos sem grupo
        const numGrupos = randInt(5, 6);
        const tamanhosGrupo: number[] = [];
        const totalAlunosEmGrupos = Math.min(
          alunos.length - randInt(2, 4),
          alunos.length,
        );
        // distribui aproximadamente igual
        const baseTamanho = Math.floor(totalAlunosEmGrupos / numGrupos);
        for (let i = 0; i < numGrupos; i++) tamanhosGrupo.push(baseTamanho);
        let resto = totalAlunosEmGrupos - baseTamanho * numGrupos;
        for (let i = 0; i < resto; i++) tamanhosGrupo[i]++;

        const ordemAlunos = shuffle(alunos);
        let cursor = 0;
        const temasShuffled = shuffle(TEMAS_GRUPO);

        for (let i = 0; i < numGrupos; i++) {
          const membros = ordemAlunos.slice(cursor, cursor + tamanhosGrupo[i]);
          cursor += tamanhosGrupo[i];

          const tema = i < temasShuffled.length ? temasShuffled[i] : null;
          const notaGrupo = notaAleatoria();

          const grupo = await prisma.grupo.create({
            data: {
              nome: `Grupo ${i + 1}`,
              tema,
              notaGrupo,
              atividadeId: atividade.id,
              professorId: PROFESSOR_ID,
              membros: {
                create: membros.map((m) => ({
                  alunoId: m.id,
                  professorId: PROFESSOR_ID,
                })),
              },
            },
          });

          // Lança a nota do grupo nos membros — com 20% de chance de "override
          // individual" (nota um pouco diferente da do grupo, simulando ajuste).
          const notasMembros = membros.map((m) => {
            const override = Math.random() < 0.2;
            return {
              valor: override
                ? Math.max(0, Math.min(10, notaGrupo + (Math.random() < 0.5 ? -1 : 1) * rand(0.5, 2)))
                : notaGrupo,
              alunoId: m.id,
              atividadeId: atividade.id,
              professorId: PROFESSOR_ID,
            };
          });
          await prisma.nota.createMany({
            data: notasMembros.map((n) => ({
              ...n,
              valor: Math.round(n.valor * 10) / 10,
            })),
          });

          console.log(
            `    ✓ ${grupo.nome}${tema ? ` · ${tema}` : ""} · ${membros.length} membros · nota ${notaGrupo}`,
          );
        }

        // Alunos que ficaram fora de grupos não recebem nota nessa atividade
        const semGrupo = alunos.length - cursor;
        console.log(
          `    ✓ ${spec.nome} (grupo) · ${numGrupos} grupos · ${semGrupo} sem grupo`,
        );
      }
    }
  }

  console.log("\n✅ Seed concluído.");
  console.log(`   Turma ID: ${turma.id}`);
}

main()
  .catch((e) => {
    console.error("ERRO:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
