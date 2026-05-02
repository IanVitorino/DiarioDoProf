import Link from "next/link";
import { listTurmas } from "@/actions/turmas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NovaTurmaButton } from "@/components/turmas/nova-turma-button";
import { TurmaFilterBar } from "@/components/turmas/turma-filter-bar";
import { NIVEL_LABEL, TURNO_LABEL } from "@/lib/turma-format";
import {
  aplicarFiltros,
  extrairFilterOptions,
  type TurmaFiltros,
} from "@/lib/turma-filters";

interface SearchParams {
  disciplina?: string;
  nivel?: string;
  ano?: string;
  escola?: string;
  turno?: string;
}

export default async function TurmasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
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
      <div className="flex justify-end">
        <NovaTurmaButton />
      </div>

      {turmas.length > 0 && <TurmaFilterBar options={options} />}

      {turmas.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-default-700 mb-2 text-lg font-medium">
            Você ainda não tem turmas
          </p>
          <p className="text-sm text-default-500">
            Clique em <strong>Nova turma</strong> para criar a primeira.
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
            <Link href={`/turmas/${turma.id}`} key={turma.id} className="block">
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
