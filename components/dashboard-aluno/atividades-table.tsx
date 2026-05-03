import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bimestreNome } from "@/lib/turma-format";
import { formatBrazilDate } from "@/lib/dates";
import type { AtividadePonto } from "@/actions/dashboard-aluno";

interface Props {
  pontos: AtividadePonto[];
}

function pillClass(valorNormalizado: number, temNota: boolean) {
  if (!temNota) return "bg-default-100 text-default-500";
  if (valorNormalizado < 6) return "bg-red-500/10 text-red-600 dark:text-red-400";
  if (valorNormalizado < 7)
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
}

export function AtividadesTable({ pontos }: Props) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-default-200">
        <h3 className="font-semibold text-default-900">Atividades</h3>
        <p className="text-xs text-default-500 mt-0.5">
          Em ordem cronológica · {pontos.length} no total
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28 hidden md:table-cell">Data</TableHead>
              <TableHead>Atividade</TableHead>
              <TableHead className="w-28 hidden md:table-cell">Bimestre</TableHead>
              <TableHead className="w-32 text-center">Nota bruta</TableHead>
              <TableHead className="w-28 text-center hidden md:table-cell">
                Equiv. /10
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pontos.map((p) => (
              <TableRow key={p.atividadeId}>
                <TableCell className="text-default-600 hidden md:table-cell">
                  {formatBrazilDate(p.data)}
                </TableCell>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell className="text-default-600 hidden md:table-cell">
                  {bimestreNome(p.bimestre)}
                </TableCell>
                <TableCell className="text-center text-default-700">
                  {p.temNota
                    ? `${p.valor} / ${p.modoCalculo === "MEDIA" ? 10 : p.valorMaximo}`
                    : "—"}
                </TableCell>
                <TableCell className="text-center hidden md:table-cell">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${pillClass(p.valorNormalizado, p.temNota)}`}
                  >
                    {p.temNota ? p.valorNormalizado.toFixed(1) : "—"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
