"use client";

import { Card } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AlunoBar } from "@/actions/dashboard-atividade";

interface Props {
  alunos: AlunoBar[];
  media: number;
}

const COLORS = {
  vermelha: "#ef4444",
  alerta: "#f59e0b",
  azul: "#10b981",
};

interface Bucket {
  label: string;
  start: number;
  end: number; // exclusive (exceto último)
  faixa: "vermelha" | "alerta" | "azul";
}

const BUCKETS_PADRAO: Bucket[] = [
  { label: "0–2", start: 0, end: 2, faixa: "vermelha" },
  { label: "2–4", start: 2, end: 4, faixa: "vermelha" },
  { label: "4–6", start: 4, end: 6, faixa: "vermelha" },
  { label: "6–7", start: 6, end: 7, faixa: "alerta" },
  { label: "7–8", start: 7, end: 8, faixa: "azul" },
  { label: "8–10", start: 8, end: 10.0001, faixa: "azul" },
];

function distribuir(alunos: AlunoBar[], media: number) {
  const buckets = BUCKETS_PADRAO.map((b) => ({
    ...b,
    count: 0,
  }));

  // Pode haver valores > 10 (data antiga); concentra num bucket "10+"
  let acima = 0;

  for (const a of alunos) {
    if (!a.temNota) continue;
    const v = a.valorNormalizado;
    const idx = buckets.findIndex((b) => v >= b.start && v < b.end);
    if (idx === -1) {
      if (v >= 10) acima++;
    } else {
      buckets[idx].count++;
    }
  }

  if (acima > 0) {
    buckets.push({
      label: "10+",
      start: 10,
      end: Infinity,
      faixa: "azul",
      count: acima,
    });
  }

  return buckets;
}

export function NotasPorAlunoChart({ alunos, media }: Props) {
  const comNota = alunos.filter((a) => a.temNota);

  if (comNota.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="font-semibold text-default-900 mb-1">
          Distribuição por faixa
        </h3>
        <p className="text-xs text-default-500 mb-4">
          Quantidade de alunos por intervalo de nota
        </p>
        <div className="h-[260px] flex items-center justify-center text-sm text-default-500">
          Nenhuma nota lançada ainda
        </div>
      </Card>
    );
  }

  const buckets = distribuir(comNota, media);
  const max = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-default-900">
            Distribuição por faixa
          </h3>
          <p className="text-xs text-default-500 mt-0.5">
            Quantidade de alunos por intervalo de nota
          </p>
        </div>
        <div className="text-xs text-default-600">
          Média:{" "}
          <span className="font-semibold text-default-900">
            {media.toFixed(1)}
          </span>{" "}
          · {comNota.length} {comNota.length === 1 ? "aluno" : "alunos"}
        </div>
      </div>

      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={buckets}
            margin={{ top: 24, right: 16, bottom: 24, left: 8 }}
            barCategoryGap="20%"
          >
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--default-500))"
              label={{
                value: "Faixa de nota",
                position: "insideBottom",
                offset: -8,
                style: { fontSize: 10, fill: "hsl(var(--default-500))" },
              }}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, Math.ceil(max * 1.1) + 1]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--default-400))"
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--default-100))" }}
              contentStyle={{
                background: "#fff",
                border: "1px solid hsl(var(--default-300))",
                borderRadius: 6,
                fontSize: 12,
                padding: "6px 10px",
              }}
              formatter={(v: number) => [
                `${v} ${v === 1 ? "aluno" : "alunos"}`,
                "",
              ]}
              labelFormatter={(label: string) => `Faixa ${label}`}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {buckets.map((b, i) => (
                <Cell key={i} fill={COLORS[b.faixa]} fillOpacity={b.count === 0 ? 0.2 : 1} />
              ))}
              <LabelList
                dataKey="count"
                position="top"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fill: "hsl(var(--default-700))",
                }}
                formatter={(v: number) => (v > 0 ? v : "")}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ background: COLORS.vermelha }}
          />
          <span className="text-default-600">Em risco (&lt; 6)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ background: COLORS.alerta }}
          />
          <span className="text-default-600">Alerta (6–7)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ background: COLORS.azul }}
          />
          <span className="text-default-600">Bom (≥ 7)</span>
        </div>
      </div>
    </Card>
  );
}
