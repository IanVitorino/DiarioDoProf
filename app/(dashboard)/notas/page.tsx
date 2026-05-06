import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { listTurmas, getTurma } from "@/actions/turmas";
import { getNotasGrid } from "@/actions/notas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BimestreSelector } from "@/components/notas/bimestre-selector";
import { NotasGrid } from "@/components/notas/notas-grid";
import { TurmaFilterBar } from "@/components/turmas/turma-filter-bar";
import { NIVEL_LABEL, TURNO_LABEL, bimestreNome } from "@/lib/turma-format";
import {
  aplicarFiltros,
  extrairFilterOptions,
  type TurmaFiltros,
} from "@/lib/turma-filters";

interface SearchParams {
  turma?: string;
  bimestre?: string;
  disciplina?: string;
  nivel?: string;
  ano?: string;
  escola?: string;
  turno?: string;
}

export default async function NotasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const turmaId = searchParams.turma;
  const bimestreOrdem = searchParams.bimestre
    ? Number(searchParams.bimestre)
    : undefined;

  // Estado 1: sem turma → cards de turmas
  if (!turmaId) {
    const turmas = await listTurmas();
    const options = extrairFilterOptions(turmas);
    const filtros: TurmaFiltros = {
      disciplina: searchParams.disciplina,
      nivel: searchParams.nivel,
      ano: searchParams.ano,
      escola: searchParams.escola,
      turno: searchParams.turno,
    };
    const turmasFiltradas = aplicarFiltros(turmas, filtros);

    return (
      <div className="space-y-6">
        <p className="text-sm text-default-600">
          Selecione uma turma para lançar notas.
        </p>

        {turmas.length > 0 && <TurmaFilterBar options={options} />}

        {turmas.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-default-700 mb-2 text-lg font-medium">
              Você ainda não tem turmas
            </p>
            <p className="text-sm text-default-500">
              Crie uma turma em{" "}
              <Link href="/turmas" className="text-primary underline">
                Turmas
              </Link>
              .
            </p>
          </Card>
        ) : turmasFiltradas.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-default-700 mb-2 text-lg font-medium">
              Nenhuma turma encontrada
            </p>
            <p className="text-sm text-default-500">
              Ajuste os filtros acima para ver suas turmas.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {turmasFiltradas.map((turma) => (
              <Link
                href={`/notas?turma=${turma.id}`}
                key={turma.id}
                className="block"
              >
                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <h3 className="font-semibold text-default-900 truncate">
                      {turma.nome}
                    </h3>
                    <Badge
                      color={turma.status === "ATIVA" ? "success" : "default"}
                      variant="soft"
                      className="shrink-0"
                    >
                      {turma.status === "ATIVA" ? "Ativa" : "Concluída"}
                    </Badge>
                  </div>
                  <p className="text-sm text-default-700 mb-1 truncate">
                    {turma.disciplina}
                  </p>
                  <p className="text-xs text-default-500">
                    {NIVEL_LABEL[turma.nivel] ?? turma.nivel}
                    {turma.turno ? ` · ${TURNO_LABEL[turma.turno] ?? turma.turno}` : ""}
                    {` · ${turma.ano}`}
                    {turma.escola ? ` · ${turma.escola}` : ""}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Estado 2 e 3: turma escolhida
  const turma = await getTurma(turmaId);
  if (!turma) notFound();

  const validBimestre =
    bimestreOrdem && [1, 2, 3, 4].includes(bimestreOrdem)
      ? bimestreOrdem
      : undefined;

  const grid = validBimestre
    ? await getNotasGrid(turmaId, validBimestre)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/notas"
          className="inline-flex items-center text-sm text-default-600 hover:text-default-900 mb-3"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Notas
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-default-900 truncate">
              {turma.nome}
            </h1>
            <p className="text-sm text-default-600">
              {turma.disciplina} · {NIVEL_LABEL[turma.nivel] ?? turma.nivel} · {turma.ano}
            </p>
          </div>
        </div>
      </div>

      <BimestreSelector
        turmaId={turmaId}
        value={validBimestre ? String(validBimestre) : ""}
      />

      {!validBimestre ? (
        <Card className="p-12 text-center">
          <p className="text-default-600">
            Selecione um bimestre para visualizar e lançar as notas.
          </p>
        </Card>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-default-900 mb-3">
            {bimestreNome(validBimestre)}
          </h2>
          <NotasGrid
            alunos={grid!.alunos}
            atividades={grid!.atividades}
            notas={grid!.notas}
            modoCalculo={grid!.modoCalculo as "MEDIA" | "SOMA"}
            bimestre={validBimestre}
          />
        </div>
      )}
    </div>
  );
}
