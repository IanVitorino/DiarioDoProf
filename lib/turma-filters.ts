// Helpers para a TurmaFilterBar — extrai valores únicos da lista de turmas
// do professor e aplica o filtro segundo os search params.

import { NIVEL_LABEL, TURNO_LABEL } from "./turma-format";

interface TurmaFiltravel {
  disciplina: string;
  nivel: string;
  ano: number;
  escola: string | null;
  turno: string | null;
}

export interface TurmaFiltros {
  disciplina?: string;
  nivel?: string;
  ano?: string;
  escola?: string;
  turno?: string;
}

export interface TurmaFilterOptions {
  disciplinas: string[];
  niveis: { value: string; label: string }[];
  anos: number[];
  escolas: string[];
  turnos: { value: string; label: string }[];
}

export function extrairFilterOptions<T extends TurmaFiltravel>(
  turmas: T[],
): TurmaFilterOptions {
  const disciplinas = Array.from(
    new Set(turmas.map((t) => t.disciplina).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const niveisSet = new Set(turmas.map((t) => t.nivel));
  const niveis = Array.from(niveisSet)
    .map((n) => ({ value: n, label: NIVEL_LABEL[n] ?? n }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  const anos = Array.from(new Set(turmas.map((t) => t.ano))).sort(
    (a, b) => b - a,
  );

  const escolas = Array.from(
    new Set(
      turmas
        .map((t) => t.escola)
        .filter((e): e is string => !!e && e.trim() !== ""),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const turnosSet = new Set(
    turmas
      .map((t) => t.turno)
      .filter((t): t is string => !!t && t.trim() !== ""),
  );
  const ordemTurno: Record<string, number> = {
    MATUTINO: 0,
    VESPERTINO: 1,
    NOTURNO: 2,
  };
  const turnos = Array.from(turnosSet)
    .map((t) => ({ value: t, label: TURNO_LABEL[t] ?? t }))
    .sort((a, b) => (ordemTurno[a.value] ?? 99) - (ordemTurno[b.value] ?? 99));

  return { disciplinas, niveis, anos, escolas, turnos };
}

export function aplicarFiltros<T extends TurmaFiltravel>(
  turmas: T[],
  f: TurmaFiltros,
): T[] {
  return turmas.filter((t) => {
    if (f.disciplina && t.disciplina !== f.disciplina) return false;
    if (f.nivel && t.nivel !== f.nivel) return false;
    if (f.ano && String(t.ano) !== f.ano) return false;
    if (f.escola && (t.escola ?? "") !== f.escola) return false;
    if (f.turno && (t.turno ?? "") !== f.turno) return false;
    return true;
  });
}
