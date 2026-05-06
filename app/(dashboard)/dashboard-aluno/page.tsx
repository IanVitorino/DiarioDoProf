import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  Trophy,
  Award,
  AlertTriangle,
  ClipboardList,
  Users,
  UserMinus,
} from "lucide-react";
import { listTurmas } from "@/actions/turmas";
import {
  getDashboardAluno,
  listAlunosDeTurma,
} from "@/actions/dashboard-aluno";
import { TurmaAlunoFiltros } from "@/components/dashboard-aluno/turma-aluno-filtros";
import { IdentificacaoCard } from "@/components/dashboard-aluno/identificacao-card";
import { CronologicaChart } from "@/components/dashboard-aluno/cronologica-chart";
import { AlunoVsTurmaChart } from "@/components/dashboard-aluno/aluno-vs-turma-chart";
import { DistribuicaoAlunoChart } from "@/components/dashboard-aluno/distribuicao-aluno";
import { AtividadesTable } from "@/components/dashboard-aluno/atividades-table";
import { StatCard } from "@/components/analise/stat-card";
import { bimestreNome } from "@/lib/turma-format";

interface SearchParams {
  turma?: string;
  aluno?: string;
}

export default async function DashboardAlunoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const turmaId = searchParams.turma ?? null;
  const alunoId = searchParams.aluno ?? null;

  const turmas = await listTurmas();
  const alunos = turmaId ? await listAlunosDeTurma(turmaId) : [];

  // Validação cruzada: aluno precisa estar na turma. Se não está, ignora.
  const alunoValido =
    alunoId && alunos.some((a) => a.id === alunoId) ? alunoId : null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-default-600">
        Visão completa de desempenho de um aluno específico.
      </p>

      <TurmaAlunoFiltros
        turmas={turmas.map((t) => ({
          id: t.id,
          nome: t.nome,
          disciplina: t.disciplina,
          serie: t.serie,
          escola: t.escola,
        }))}
        alunos={alunos}
        turmaId={turmaId}
        alunoId={alunoValido}
      />

      {!turmaId || !alunoValido ? (
        <Card className="p-12 flex flex-col items-center text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <p className="text-default-700 mb-2 text-lg font-medium">
            {!turmaId
              ? "Selecione uma turma para começar"
              : "Agora escolha o aluno"}
          </p>
          <p className="text-sm text-default-500 max-w-sm">
            {!turmaId
              ? "Use os filtros acima. Depois de escolher a turma, você poderá selecionar o aluno."
              : "O dashboard com os gráficos aparece aqui assim que você escolher um aluno."}
          </p>
        </Card>
      ) : (
        <DashboardContent turmaId={turmaId} alunoId={alunoValido} />
      )}
    </div>
  );
}

async function DashboardContent({
  turmaId,
  alunoId,
}: {
  turmaId: string;
  alunoId: string;
}) {
  const data = await getDashboardAluno(turmaId, alunoId);

  return (
    <div className="space-y-5">
      {data.aluno.inativoApartirDeBimestre != null && (
        <div className="flex items-start gap-3 rounded-md border border-default-200 bg-default-100/60 dark:bg-default-100/30 p-4">
          <div className="rounded-full bg-default-200 p-2 shrink-0">
            <UserMinus className="w-4 h-4 text-default-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-default-900">
              Aluno inativo desde o {bimestreNome(data.aluno.inativoApartirDeBimestre)}
            </p>
            {data.aluno.motivoInativacao && (
              <p className="text-xs text-default-600 mt-0.5">
                Motivo: {data.aluno.motivoInativacao}
              </p>
            )}
            <p className="text-xs text-default-500 mt-0.5">
              Bimestres anteriores contam normalmente; bimestres seguintes não
              entram nas médias.
            </p>
          </div>
        </div>
      )}

      <IdentificacaoCard
        aluno={data.aluno}
        turma={data.turma}
        trend={data.trend}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          value={
            data.mediaAnual !== null ? data.mediaAnual.toFixed(1) : "—"
          }
          label="média anual"
          tone={
            data.mediaAnual === null
              ? "default"
              : data.mediaAnual >= 7
              ? "success"
              : data.mediaAnual >= 6
              ? "warning"
              : "destructive"
          }
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          value={`#${data.rank}`}
          label={`de ${data.totalAlunos}`}
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          value={
            data.melhorBim
              ? `${data.melhorBim.media.toFixed(1)}`
              : "—"
          }
          label={
            data.melhorBim
              ? `melhor: ${bimestreNome(data.melhorBim.ordem)}`
              : "melhor bimestre"
          }
          tone="success"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          value={data.piorBim ? `${data.piorBim.media.toFixed(1)}` : "—"}
          label={
            data.piorBim
              ? `pior: ${bimestreNome(data.piorBim.ordem)}`
              : "pior bimestre"
          }
          tone={data.piorBim && data.piorBim.media < 6 ? "destructive" : "warning"}
        />
      </div>

      <CronologicaChart
        pontos={data.atividadesCronologicas}
        trend={data.trend}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AlunoVsTurmaChart
          aluno={data.mediasPorBimAluno}
          turma={data.mediasPorBimTurma}
        />
        <DistribuicaoAlunoChart {...data.distribuicao} />
      </div>

      <Card className="p-5 flex items-center gap-4">
        <div className="rounded-lg bg-primary/10 p-3">
          <ClipboardList className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-default-600">Atividades feitas</div>
          <div className="text-default-900 font-medium">
            {data.totalAtividadesFeitas} de {data.totalAtividadesPossivel}{" "}
            <span className="text-xs text-default-500">
              ({data.totalAtividadesPossivel === 0
                ? 0
                : Math.round(
                    (data.totalAtividadesFeitas /
                      data.totalAtividadesPossivel) *
                      100
                  )}
              %)
            </span>
          </div>
        </div>
      </Card>

      <AtividadesTable pontos={data.atividadesCronologicas} />
    </div>
  );
}
