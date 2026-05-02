"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import type { TurmaFilterOptions } from "@/lib/turma-filters";

const ALL = "__ALL__";

interface Props {
  options: TurmaFilterOptions;
}

export function TurmaFilterBar({ options }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const disciplina = searchParams.get("disciplina") ?? "";
  const nivel = searchParams.get("nivel") ?? "";
  const ano = searchParams.get("ano") ?? "";
  const escola = searchParams.get("escola") ?? "";
  const turno = searchParams.get("turno") ?? "";

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("disciplina");
    params.delete("nivel");
    params.delete("ano");
    params.delete("escola");
    params.delete("turno");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const hasAny = !!(disciplina || nivel || ano || escola || turno);

  return (
    <Card className="p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <FilterSelect
          label="Disciplina"
          value={disciplina}
          onChange={(v) => update("disciplina", v)}
          items={options.disciplinas.map((d) => ({ value: d, label: d }))}
        />
        <FilterSelect
          label="Ensino"
          value={nivel}
          onChange={(v) => update("nivel", v)}
          items={options.niveis}
        />
        <FilterSelect
          label="Turno"
          value={turno}
          onChange={(v) => update("turno", v)}
          items={options.turnos}
        />
        <FilterSelect
          label="Ano"
          value={ano}
          onChange={(v) => update("ano", v)}
          items={options.anos.map((a) => ({
            value: String(a),
            label: String(a),
          }))}
        />
        <FilterSelect
          label="Escola"
          value={escola}
          onChange={(v) => update("escola", v)}
          items={options.escolas.map((e) => ({ value: e, label: e }))}
        />
      </div>
      {hasAny && (
        <div className="flex justify-end mt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-default-600"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Limpar filtros
          </Button>
        </div>
      )}
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-medium text-default-600 mb-1 block">
        {label}
      </label>
      <Select value={value || ALL} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={ALL}>Todas</SelectItem>
          {items.map((i) => (
            <SelectItem key={i.value} value={i.value}>
              {i.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
