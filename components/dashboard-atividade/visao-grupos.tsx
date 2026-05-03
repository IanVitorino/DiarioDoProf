"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users } from "lucide-react";
import type { GrupoBar } from "@/actions/dashboard-atividade";

interface Props {
  grupos: GrupoBar[];
  capEfetivo: number;
}

const COLORS = {
  vermelha: "#ef4444",
  alerta: "#f59e0b",
  azul: "#10b981",
};

function corPorMedia(media: number) {
  if (media < 6) return COLORS.vermelha;
  if (media < 7) return COLORS.alerta;
  return COLORS.azul;
}

export function VisaoGrupos({ grupos, capEfetivo }: Props) {
  if (grupos.length === 0) {
    return (
      <Card className="p-12 flex flex-col items-center text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <p className="text-default-700 mb-1 text-lg font-medium">
          Sem grupos cadastrados
        </p>
        <p className="text-sm text-default-500 max-w-md">
          Esta atividade é em grupo mas ainda não tem grupos definidos. Volte na
          aba Atividades pra criar.
        </p>
      </Card>
    );
  }

  const data = grupos.map((g) => ({
    nome: g.nome,
    media: Number(g.mediaNormalizada.toFixed(2)),
  }));

  const mediaGeral =
    grupos.length === 0
      ? 0
      : grupos.reduce((s, g) => s + g.mediaNormalizada, 0) / grupos.length;

  const height = Math.max(220, grupos.length * 36);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-default-900">Média por grupo</h3>
            <p className="text-xs text-default-500 mt-0.5">
              Valores normalizados (0–10)
            </p>
          </div>
          <div className="text-xs text-default-600">
            Geral:{" "}
            <span className="font-semibold text-default-900">
              {mediaGeral.toFixed(1)}
            </span>
          </div>
        </div>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 32, bottom: 5, left: 8 }}
            >
              <XAxis
                type="number"
                domain={[0, 10]}
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--default-400))"
              />
              <YAxis
                type="category"
                dataKey="nome"
                width={140}
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--default-500))"
                interval={0}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--default-100))" }}
                contentStyle={{
                  background: "#fff",
                  border: "1px solid hsl(var(--default-300))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v.toFixed(1)} / 10`, "Média"]}
              />
              <ReferenceLine
                x={Number(mediaGeral.toFixed(2))}
                stroke="hsl(var(--default-600))"
                strokeDasharray="3 3"
              />
              <Bar dataKey="media" radius={[0, 4, 4, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={corPorMedia(d.media)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grupos.map((g) => (
          <Card key={g.grupoId} className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-default-900 truncate">
                  {g.nome}
                </h4>
                {g.tema && (
                  <p className="text-sm text-default-600 truncate">{g.tema}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div
                  className="text-2xl font-bold"
                  style={{ color: corPorMedia(g.mediaNormalizada) }}
                >
                  {g.mediaNormalizada.toFixed(1)}
                </div>
                <div className="text-[10px] text-default-500 uppercase tracking-wider">
                  média
                </div>
              </div>
            </div>
            <div className="text-xs text-default-600 mb-2">
              {g.membrosComNota} de {g.totalMembros} com nota
            </div>
            <div className="space-y-1.5">
              {g.membros.map((m) => (
                <div
                  key={m.alunoId}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-sm text-default-800 truncate">
                    {m.nome}
                  </span>
                  {m.temNota ? (
                    <Badge
                      variant="soft"
                      color="success"
                      className="text-xs font-mono shrink-0"
                    >
                      {m.valor} / {capEfetivo}
                    </Badge>
                  ) : (
                    <span className="text-xs text-default-400 italic shrink-0">
                      sem nota
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
