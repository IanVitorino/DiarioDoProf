"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TabNavProps {
  turmaId: string;
}

const tabs = [
  { label: "Alunos", segment: "alunos" },
  { label: "Períodos", segment: "periodos" },
  { label: "Atividades", segment: "atividades" },
  { label: "Mapeamento", segment: "mapeamento" },
];

export function TurmaTabNav({ turmaId }: TabNavProps) {
  const pathname = usePathname();

  return (
    <div className="border-b border-default-200">
      <nav className="flex gap-6 -mb-px">
        {tabs.map((tab) => {
          const href = `/turmas/${turmaId}/${tab.segment}`;
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                "py-3 px-1 border-b-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-default-600 hover:text-default-900"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
