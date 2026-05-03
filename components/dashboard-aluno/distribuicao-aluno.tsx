"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";

interface Props {
  vermelha: number;
  alerta: number;
  azul: number;
}

const COLORS = {
  vermelha: "#ef4444",
  alerta: "#f59e0b",
  azul: "#10b981",
};

function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;
  return (
    <g
      className="animate-sector-pop"
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

export function DistribuicaoAlunoChart({ vermelha, alerta, azul }: Props) {
  const total = vermelha + alerta + azul;
  const data = [
    { name: "Em risco", value: vermelha, color: COLORS.vermelha, range: "< 6" },
    { name: "Alerta", value: alerta, color: COLORS.alerta, range: "6 a 7" },
    { name: "Bom", value: azul, color: COLORS.azul, range: "≥ 7" },
  ];

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const ativo = activeIndex !== null ? data[activeIndex] : null;
  const percent = ativo
    ? total > 0
      ? Math.round((ativo.value / total) * 100)
      : 0
    : 100;
  const labelTopo = ativo ? ativo.name : "Total";
  const labelBaixo = ativo
    ? `${ativo.value} ${ativo.value === 1 ? "atividade" : "atividades"}`
    : `${total} ${total === 1 ? "atividade" : "atividades"}`;

  return (
    <Card className="p-5">
      <div className="mb-3">
        <h3 className="font-semibold text-default-900">Distribuição de notas</h3>
        <p className="text-xs text-default-500 mt-0.5">
          Atividades do aluno por faixa
        </p>
      </div>

      {total === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-default-500">
          Sem notas lançadas
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  strokeWidth={0}
                  activeIndex={activeIndex ?? undefined}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {data.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.color}
                      stroke="none"
                      style={{
                        cursor: "pointer",
                        opacity:
                          activeIndex === null || activeIndex === i ? 1 : 0.4,
                        filter:
                          activeIndex !== null && activeIndex !== i
                            ? "saturate(0.7)"
                            : "saturate(1)",
                        transition:
                          "opacity 220ms ease-out, filter 220ms ease-out",
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Texto centralizado */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div
                key={activeIndex ?? "total"}
                className="text-2xl font-bold transition-colors animate-pop"
                style={{
                  color: ativo ? ativo.color : "hsl(var(--default-900))",
                }}
              >
                {percent}%
              </div>
              <div
                key={`label-${activeIndex ?? "total"}`}
                className="text-[11px] uppercase tracking-wider text-default-500 mt-0.5 animate-fade"
              >
                {labelTopo}
              </div>
              <div
                key={`sub-${activeIndex ?? "total"}`}
                className="text-[10px] text-default-500 animate-fade"
              >
                {labelBaixo}
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {data.map((l, i) => (
              <div
                key={l.name}
                className="flex items-center gap-3 cursor-pointer"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <span
                  className="inline-block w-3 h-3 rounded-sm shrink-0 transition-transform"
                  style={{
                    background: l.color,
                    transform: activeIndex === i ? "scale(1.25)" : "scale(1)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-default-900">
                    {l.name}
                  </div>
                  <div className="text-xs text-default-500">{l.range}</div>
                </div>
                <div className="text-sm font-semibold text-default-900">
                  {l.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
