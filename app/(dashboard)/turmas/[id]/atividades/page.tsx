import { listPeriodosComAtividades } from "@/actions/atividades";
import { listAlunosByTurma } from "@/actions/alunos";
import { getTurma } from "@/actions/turmas";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { User, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NovaAtividadeButton } from "@/components/atividades/nova-atividade-button";
import { AtividadeActions } from "@/components/atividades/atividade-actions";
import { AtribuicaoButton } from "@/components/atividades/atribuicao-button";
import { GruposButton } from "@/components/atividades/grupos-button";
import { ModoCalculoToggle } from "@/components/atividades/modo-toggle";
import { bimestreNome } from "@/lib/turma-format";
import { formatBrazilDate } from "@/lib/dates";

export default async function AtividadesTabPage({
  params,
}: {
  params: { id: string };
}) {
  const [periodos, alunosTurma, turma] = await Promise.all([
    listPeriodosComAtividades(params.id),
    listAlunosByTurma(params.id),
    getTurma(params.id),
  ]);

  const escolaParam = turma?.escola && turma.escola.trim() !== ""
    ? turma.escola
    : "__SEM_ESCOLA__";

  const dashboardHref = (atividadeId: string) =>
    `/dashboard-atividades?escola=${encodeURIComponent(escolaParam)}&turma=${params.id}&atividade=${atividadeId}`;

  const periodoOptions = periodos.map((p) => ({
    id: p.id,
    nome: bimestreNome(p.ordem),
    modo: p.modoCalculo as "MEDIA" | "SOMA",
    dataInicio: p.dataInicio,
    dataFim: p.dataFim,
  }));

  const alunosTurmaSimple = alunosTurma.map((a) => ({
    id: a.id,
    nome: a.nome,
  }));

  return (
    <div className="space-y-6">
      {periodos.map((periodo) => {
        const modo = periodo.modoCalculo as "MEDIA" | "SOMA";
        return (
          <div key={periodo.id} className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-default-900">
                  {bimestreNome(periodo.ordem)}
                </h3>
                <ModoCalculoToggle periodoId={periodo.id} modo={modo} />
              </div>
              <NovaAtividadeButton
                periodoId={periodo.id}
                periodoNome={bimestreNome(periodo.ordem)}
                modo={modo}
                dataInicio={periodo.dataInicio}
                dataFim={periodo.dataFim}
                turmaId={params.id}
              />
            </div>

            {periodo.atividades.length === 0 ? (
              <Card className="p-6 text-center text-sm text-default-500">
                Nenhuma atividade neste período ainda.
              </Card>
            ) : (
              <Card className="p-0 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-32">Tipo</TableHead>
                      <TableHead className="w-32">Data</TableHead>
                      <TableHead className="w-32">
                        {modo === "SOMA" ? "Peso" : "Valor máximo"}
                      </TableHead>
                      <TableHead className="w-40">Atribuição</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periodo.atividades.map((atividade) => (
                      <TableRow key={atividade.id}>
                        <TableCell className="font-medium">{atividade.nome}</TableCell>
                        <TableCell>
                          {atividade.tipo === "GRUPO" ? (
                            <Badge
                              color="success"
                              variant="soft"
                              className="text-xs font-normal"
                            >
                              <Users className="w-3 h-3 mr-1" />
                              Em grupo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs font-normal text-default-600"
                            >
                              <User className="w-3 h-3 mr-1" />
                              Individual
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-default-600">
                          {formatBrazilDate(atividade.data)}
                        </TableCell>
                        <TableCell className="text-default-600">
                          {modo === "SOMA" ? atividade.valorMaximo : 10}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            <AtribuicaoButton
                              atividadeId={atividade.id}
                              atividadeNome={atividade.nome}
                              tipoAtribuicao={
                                atividade.tipoAtribuicao as "TODOS" | "SELECIONADOS"
                              }
                              alunosAtribuidos={atividade.atribuicoes.map(
                                (x) => x.alunoId,
                              )}
                              alunosTurma={alunosTurmaSimple}
                              modoCalculo={modo}
                              valorMaximo={atividade.valorMaximo}
                              notas={atividade.notas}
                            />
                            {atividade.tipo === "GRUPO" && (
                              <GruposButton
                                atividadeId={atividade.id}
                                atividadeNome={atividade.nome}
                                grupos={atividade.grupos}
                                alunosAtribuidos={
                                  atividade.tipoAtribuicao === "TODOS"
                                    ? alunosTurmaSimple
                                    : alunosTurmaSimple.filter((a) =>
                                        atividade.atribuicoes.some(
                                          (x) => x.alunoId === a.id,
                                        ),
                                      )
                                }
                                modoCalculo={modo}
                                valorMaximo={atividade.valorMaximo}
                                notas={atividade.notas}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <AtividadeActions
                            atividade={atividade}
                            periodos={periodoOptions}
                            dashboardHref={dashboardHref(atividade.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
