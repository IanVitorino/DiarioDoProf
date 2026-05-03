import { Card } from "@/components/ui/card";
import { ClipboardList, TrendingUp, ArrowUp, ArrowDown, CheckCheck } from "lucide-react";
import { listTurmas } from "@/actions/turmas";
import {
  getDashboardAtividade,
  listAtividadesDeTurma,
} from "@/actions/dashboard-atividade";
import { FiltrosBar } from "@/components/dashboard-atividade/filtros-bar";
import { DistribuicaoChart } from "@/components/analise/distribuicao-chart";
import { NotasPorAlunoChart } from "@/components/dashboard-atividade/notas-por-aluno-chart";
import { FaltamLancarCard } from "@/components/dashboard-atividade/faltam-lancar-card";
import { VisaoGrupos } from "@/components/dashboard-atividade/visao-grupos";
import { VisaoToggle } from "@/components/dashboard-atividade/visao-toggle";
import { StatCard } from "@/components/analise/stat-card";
import { NIVEL_LABEL, bimestreNome } from "@/lib/turma-format";

interface SearchParams {
  escola?: string;
  turma?: string;
  atividade?: string;
  view?: "grupo" | "individual";
}

export default async function DashboardAtividadesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const turmas = await listTurmas();

  const turmaSelecionadaId = searchParams.turma ?? null;
  const atividadeId = searchParams.atividade ?? null;
  const escola = searchParams.escola ?? null;

  // Lista de atividades da turma selecionada
  const atividades = turmaSelecionadaId
    ? await listAtividadesDeTurma(turmaSelecionadaId)
    : [];

  const turmasItem = turmas.map((t) => ({
    id: t.id,
    nome: t.nome,
    disciplina: t.disciplina,
    serie: t.serie,
    ano: t.ano,
    escola: t.escola,
  }));

  const atividadesItem = atividades.map((a) => ({
    id: a.id,
    nome: a.nome,
    bimestre: a.periodo.ordem,
  }));

  // Validação cruzada: atividade tem que pertencer à turma
  const atividadeValida =
    atividadeId && atividades.some((a) => a.id === atividadeId)
      ? atividadeId
      : null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-default-600">
        Análise detalhada do desempenho da turma em uma atividade específica.
      </p>

      <FiltrosBar
        turmas={turmasItem}
        atividades={atividadesItem}
        escolaSelecionada={escola}
        turmaId={turmaSelecionadaId}
        atividadeId={atividadeValida}
      />

      {!atividadeValida ? (
        <Card className="p-12 flex flex-col items-center text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
          <p className="text-default-700 mb-2 text-lg font-medium">
            {!escola
              ? "Selecione uma escola para começar"
              : !turmaSelecionadaId
                ? "Agora escolha a turma"
                : "Agora escolha a atividade"}
          </p>
          <p className="text-sm text-default-500 max-w-sm">
            Os gráficos aparecem assim que você terminar de preencher os filtros
            acima.
          </p>
        </Card>
      ) : (
        <DashboardContent
          atividadeId={atividadeValida}
          view={searchParams.view ?? "individual"}
        />
      )}
    </div>
  );
}

async function DashboardContent({
  atividadeId,
  view,
}: {
  atividadeId: string;
  view: "grupo" | "individual";
}) {
  const data = await getDashboardAtividade(atividadeId);
  const ehGrupo = data.atividade.tipo === "GRUPO";
  const visao = ehGrupo ? view : "individual";

  const toneMedia: "success" | "warning" | "destructive" =
    data.kpis.media >= 7
      ? "success"
      : data.kpis.media >= 6
        ? "warning"
        : "destructive";

  const toneAprov: "success" | "warning" | "destructive" =
    data.kpis.percentualAprovados >= 70
      ? "success"
      : data.kpis.percentualAprovados >= 50
        ? "warning"
        : "destructive";

  return (
    <div className="space-y-5">
      {/* Header da atividade */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-default-900">
              {data.atividade.nome}
            </h2>
            <p className="text-sm text-default-600">
              {data.turma.nome} · {data.turma.disciplina} ·{" "}
              {NIVEL_LABEL[data.turma.nivel] ?? data.turma.nivel} ·{" "}
              {bimestreNome(data.atividade.bimestre)}
            </p>
            <p className="text-xs text-default-500 mt-1">
              {data.atividade.tipo === "GRUPO" ? "Em grupo" : "Individual"} ·{" "}
              {data.atividade.modoCalculo === "MEDIA"
                ? "Modo média"
                : "Modo soma"}{" "}
              · Cap {data.atividade.capEfetivo}
            </p>
          </div>
          {ehGrupo && <VisaoToggle value={visao} />}
        </div>
      </Card>

      {visao === "grupo" ? (
        <VisaoGrupos
          grupos={data.grupos}
          capEfetivo={data.atividade.capEfetivo}
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<CheckCheck className="w-5 h-5" />}
              value={`${data.kpis.totalLancados} / ${data.kpis.totalAtribuidos}`}
              label="notas lançadas"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              value={
                data.kpis.totalLancados > 0
                  ? data.kpis.media.toFixed(1)
                  : "—"
              }
              label="média da atividade"
              tone={data.kpis.totalLancados > 0 ? toneMedia : "default"}
            />
            <StatCard
              icon={<ArrowUp className="w-5 h-5" />}
              value={
                data.kpis.maior !== null ? data.kpis.maior.toFixed(1) : "—"
              }
              label="maior nota"
              tone="success"
            />
            <StatCard
              icon={<ArrowDown className="w-5 h-5" />}
              value={
                data.kpis.menor !== null ? data.kpis.menor.toFixed(1) : "—"
              }
              label="menor nota"
              tone={
                data.kpis.menor !== null && data.kpis.menor < 6
                  ? "destructive"
                  : "warning"
              }
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <NotasPorAlunoChart
                alunos={data.alunos}
                media={data.kpis.media}
              />
            </div>
            <div className="space-y-4">
              <DistribuicaoChart {...data.distribuicao} />
              <FaltamLancarCard
                alunos={data.faltamLancar}
                turmaId={data.turma.id}
                bimestre={data.atividade.bimestre}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
