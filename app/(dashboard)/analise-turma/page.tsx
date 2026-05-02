import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Users,
  ClipboardList,
  TrendingUp,
  Award,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { listTurmas } from "@/actions/turmas";
import { getAnaliseTurma } from "@/actions/analise";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BimestresMultiselect } from "@/components/analise/bimestres-multiselect";
import { StatCard } from "@/components/analise/stat-card";
import { DistribuicaoChart } from "@/components/analise/distribuicao-chart";
import { MediaBimestreChart } from "@/components/analise/media-bimestre-chart";
import { AtividadesChart } from "@/components/analise/atividades-chart";
import {
  ListCard,
  ListItem,
  EmptyMessage,
} from "@/components/analise/list-card";
import { TurmaFilterBar } from "@/components/turmas/turma-filter-bar";
import { NIVEL_LABEL, TURNO_LABEL, bimestreNome } from "@/lib/turma-format";
import {
  aplicarFiltros,
  extrairFilterOptions,
  type TurmaFiltros,
} from "@/lib/turma-filters";

interface SearchParams {
  turma?: string;
  bimestres?: string;
  disciplina?: string;
  nivel?: string;
  ano?: string;
  escola?: string;
  turno?: string;
}

export default async function AnaliseTurmaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const turmaId = searchParams.turma;

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
          Selecione uma turma para ver o dashboard.
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
                href={`/analise-turma?turma=${turma.id}`}
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

  // Parse selecionados
  const selecionados = searchParams.bimestres
    ? searchParams.bimestres
        .split(",")
        .map((s) => Number(s))
        .filter((n) => [1, 2, 3, 4].includes(n))
    : [];

  const r = await getAnaliseTurma(turmaId, selecionados);
  if (!r.turma) notFound();

  const tituloRanking = (() => {
    if (r.bimestresSelecionados.length === 4) return "Média anual";
    if (r.bimestresSelecionados.length === 1)
      return `Notas no ${bimestreNome(r.bimestresSelecionados[0])}`;
    return `Média em ${r.bimestresSelecionados.length} bimestres`;
  })();

  const subtituloDelta =
    r.bimRefA !== undefined && r.bimRefB !== undefined
      ? `${bimestreNome(r.bimRefA)} → ${bimestreNome(r.bimRefB)}`
      : "";

  const toneAprov: "success" | "warning" | "destructive" =
    r.percentualAprovados >= 80
      ? "success"
      : r.percentualAprovados >= 60
      ? "warning"
      : "destructive";

  const toneMedia: "success" | "warning" | "destructive" =
    r.mediaTurma >= 7 ? "success" : r.mediaTurma >= 6 ? "warning" : "destructive";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/analise-turma"
          className="inline-flex items-center text-sm text-default-600 hover:text-default-900 mb-3"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Análise da turma
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-default-900 truncate">
              {r.turma.nome}
            </h1>
            <p className="text-sm text-default-600">
              {r.turma.disciplina} · {NIVEL_LABEL[r.turma.nivel] ?? r.turma.nivel} ·{" "}
              {r.turma.ano}
            </p>
          </div>
          <BimestresMultiselect
            turmaId={turmaId}
            selecionados={r.bimestresSelecionados}
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          value={r.totalAlunos}
          label="alunos"
        />
        <StatCard
          icon={<ClipboardList className="w-5 h-5" />}
          value={r.totalAtividades}
          label="atividades"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          value={r.mediaTurma > 0 ? r.mediaTurma.toFixed(1) : "—"}
          label="média da turma"
          tone={r.mediaTurma > 0 ? toneMedia : "default"}
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          value={`${Math.round(r.percentualAprovados)}%`}
          label="aprovados (≥ 7)"
          tone={toneAprov}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistribuicaoChart {...r.distribuicao} />
        <MediaBimestreChart data={r.mediaPorBimestre} />
      </div>

      {/* Atividades chart */}
      <AtividadesChart data={r.atividadesRanking} />

      {/* Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListCard title="Maiores notas" subtitle={tituloRanking}>
          {r.topAlunos.length === 0 ? (
            <EmptyMessage>Sem dados suficientes ainda.</EmptyMessage>
          ) : (
            r.topAlunos.map((a, i) => (
              <ListItem
                key={a.alunoId}
                position={i + 1}
                nome={a.nome}
                right={a.media.toFixed(1)}
              />
            ))
          )}
        </ListCard>

        <ListCard title="Menores notas" subtitle={tituloRanking}>
          {r.bottomAlunos.length === 0 ? (
            <EmptyMessage>Sem dados suficientes ainda.</EmptyMessage>
          ) : (
            r.bottomAlunos.map((a, i) => (
              <ListItem
                key={a.alunoId}
                position={i + 1}
                nome={a.nome}
                right={a.media.toFixed(1)}
              />
            ))
          )}
        </ListCard>

        {r.bimRefA !== undefined && r.bimRefB !== undefined && (
          <>
            <ListCard title="Maior melhoria" subtitle={subtituloDelta}>
              {r.melhoraram.length === 0 ? (
                <EmptyMessage>Nenhum aluno com melhoria registrada.</EmptyMessage>
              ) : (
                r.melhoraram.map((d, i) => (
                  <ListItem
                    key={d.alunoId}
                    position={i + 1}
                    nome={d.nome}
                    right={
                      <span className="flex items-center gap-1 text-emerald-600">
                        <ArrowUp className="w-3 h-3" />
                        {d.mediaA.toFixed(1)} → {d.mediaB.toFixed(1)} (+{d.delta.toFixed(1)})
                      </span>
                    }
                  />
                ))
              )}
            </ListCard>

            <ListCard title="Maior queda" subtitle={subtituloDelta}>
              {r.pioraram.length === 0 ? (
                <EmptyMessage>Nenhum aluno com queda registrada.</EmptyMessage>
              ) : (
                r.pioraram.map((d, i) => (
                  <ListItem
                    key={d.alunoId}
                    position={i + 1}
                    nome={d.nome}
                    right={
                      <span className="flex items-center gap-1 text-red-600">
                        <ArrowDown className="w-3 h-3" />
                        {d.mediaA.toFixed(1)} → {d.mediaB.toFixed(1)} ({d.delta.toFixed(1)})
                      </span>
                    }
                  />
                ))
              )}
            </ListCard>
          </>
        )}
      </div>
    </div>
  );
}
