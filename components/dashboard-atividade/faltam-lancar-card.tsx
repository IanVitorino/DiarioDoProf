import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ChevronRight, ClipboardList } from "lucide-react";

interface Props {
  alunos: { alunoId: string; nome: string }[];
  turmaId: string;
  bimestre: number;
}

export function FaltamLancarCard({ alunos, turmaId, bimestre }: Props) {
  if (alunos.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="font-semibold text-default-900 mb-3">Faltam lançar</h3>
        <div className="flex items-center gap-3 py-4">
          <div className="rounded-full bg-emerald-500/10 p-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm text-default-700">
            Todas as notas foram lançadas.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-default-900">Faltam lançar</h3>
          <p className="text-xs text-default-500 mt-0.5">
            {alunos.length}{" "}
            {alunos.length === 1 ? "aluno sem nota" : "alunos sem nota"}
          </p>
        </div>
        <Link
          href={`/notas?turma=${turmaId}&bimestre=${bimestre}`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Lançar notas
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-default-200 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-5 px-5">
        {alunos.map((a) => (
          <div
            key={a.alunoId}
            className="py-2 text-sm text-default-700 truncate"
          >
            {a.nome}
          </div>
        ))}
      </div>
    </Card>
  );
}
