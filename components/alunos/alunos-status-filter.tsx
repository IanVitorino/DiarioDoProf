"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Status = "ativos" | "inativos" | "todos";

interface Props {
  turmaId: string;
  current: Status;
  counts: { ativos: number; inativos: number; todos: number };
}

const ITEMS: { value: Status; label: string }[] = [
  { value: "ativos", label: "Ativos" },
  { value: "inativos", label: "Inativos" },
  { value: "todos", label: "Todos" },
];

export function AlunosStatusFilter({ turmaId, current, counts }: Props) {
  return (
    <div className="inline-flex rounded-md border border-default-200 bg-card p-0.5 text-sm">
      {ITEMS.map((item) => {
        const active = current === item.value;
        const href =
          item.value === "ativos"
            ? `/turmas/${turmaId}/alunos`
            : `/turmas/${turmaId}/alunos?status=${item.value}`;
        return (
          <Link
            key={item.value}
            href={href}
            className={cn(
              "px-3 py-1.5 rounded transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-default-600 hover:text-default-900",
            )}
          >
            {item.label}
            <span
              className={cn(
                "ml-1.5 text-xs",
                active ? "opacity-90" : "text-default-400",
              )}
            >
              {counts[item.value]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
