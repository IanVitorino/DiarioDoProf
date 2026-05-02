import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { NIVEL_LABEL } from "@/lib/turma-format";
import type { Trend } from "@/actions/dashboard-aluno";

interface Props {
  aluno: { nome: string; numeroChamada: number };
  turma: { nome: string; disciplina: string; nivel: string; ano: number };
  trend: Trend;
}

const trendConfig = {
  evolucao: {
    icon: TrendingUp,
    label: "Evoluindo",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  estavel: {
    icon: Minus,
    label: "Estável",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  queda: {
    icon: TrendingDown,
    label: "Em queda",
    className:
      "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  },
};

export function IdentificacaoCard({ aluno, turma, trend }: Props) {
  const t = trendConfig[trend];
  const Icon = t.icon;

  return (
    <Card className="p-6 flex items-center gap-5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className="bg-primary text-primary-foreground text-sm font-bold px-2.5 py-0.5 rounded-md">
            #{aluno.numeroChamada}
          </span>
          <h2 className="text-xl font-bold text-default-900 truncate">
            {aluno.nome}
          </h2>
        </div>
        <p className="text-sm text-default-600">
          {turma.nome} · {turma.disciplina} ·{" "}
          {NIVEL_LABEL[turma.nivel] ?? turma.nivel} · {turma.ano}
        </p>
      </div>
      <Badge
        variant="outline"
        className={`gap-1.5 px-3 py-1.5 text-sm ${t.className}`}
      >
        <Icon className="w-4 h-4" />
        {t.label}
      </Badge>
    </Card>
  );
}
