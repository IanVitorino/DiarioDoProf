import { listAlunosByTurma } from "@/actions/alunos";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NovoAlunoButton } from "@/components/alunos/novo-aluno-button";
import { ImportarAlunosButton } from "@/components/alunos/importar-alunos-button";
import { AlunoActions } from "@/components/alunos/aluno-actions";
import { AlunosStatusFilter } from "@/components/alunos/alunos-status-filter";
import { Badge } from "@/components/ui/badge";
import { bimestreNome } from "@/lib/turma-format";
import { cn } from "@/lib/utils";

type Status = "ativos" | "inativos" | "todos";

function parseStatus(raw: string | undefined): Status {
  if (raw === "inativos" || raw === "todos") return raw;
  return "ativos";
}

export default async function AlunosTabPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { status?: string };
}) {
  const alunos = await listAlunosByTurma(params.id);
  const status = parseStatus(searchParams?.status);

  const counts = {
    ativos: alunos.filter((a) => a.inativoApartirDeBimestre == null).length,
    inativos: alunos.filter((a) => a.inativoApartirDeBimestre != null).length,
    todos: alunos.length,
  };

  const filtrados = alunos.filter((a) => {
    if (status === "ativos") return a.inativoApartirDeBimestre == null;
    if (status === "inativos") return a.inativoApartirDeBimestre != null;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <AlunosStatusFilter
          turmaId={params.id}
          current={status}
          counts={counts}
        />
        <div className="flex items-center gap-2">
          <ImportarAlunosButton turmaId={params.id} />
          <NovoAlunoButton turmaId={params.id} />
        </div>
      </div>

      {alunos.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-default-700 mb-2 text-lg font-medium">
            Nenhum aluno cadastrado
          </p>
          <p className="text-sm text-default-500">
            Clique em <strong>Adicionar aluno</strong> para começar.
          </p>
        </Card>
      ) : filtrados.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-default-700 mb-2 text-lg font-medium">
            {status === "inativos"
              ? "Nenhum aluno inativo"
              : "Nenhum aluno ativo"}
          </p>
          <p className="text-sm text-default-500">
            {status === "inativos"
              ? "Inative um aluno pra ele aparecer aqui."
              : "Reative ou cadastre um novo aluno."}
          </p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Nº</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="w-48">Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((aluno, index) => {
                const inativo = aluno.inativoApartirDeBimestre != null;
                return (
                  <TableRow
                    key={aluno.id}
                    className={cn(inativo && "opacity-60")}
                  >
                    <TableCell className="text-default-600">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{aluno.nome}</TableCell>
                    <TableCell>
                      {inativo ? (
                        <Badge
                          variant="soft"
                          className="text-xs font-normal bg-default-200 text-default-700 hover:bg-default-200"
                          title={
                            aluno.motivoInativacao
                              ? `Motivo: ${aluno.motivoInativacao}`
                              : undefined
                          }
                        >
                          Inativo · {bimestreNome(aluno.inativoApartirDeBimestre!)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-default-500">Ativo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <AlunoActions
                        aluno={{
                          id: aluno.id,
                          nome: aluno.nome,
                          inativoApartirDeBimestre: aluno.inativoApartirDeBimestre,
                          motivoInativacao: aluno.motivoInativacao,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
