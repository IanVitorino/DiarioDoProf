"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

export interface AlunoOption {
  id: string;
  nome: string;
  numero: number; // ordem alfabética (1-based)
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Alunos disponíveis (não posicionados) */
  alunosDisponiveis: AlunoOption[];
  /** Aluno atualmente nessa carteira (pra mostrar opção "remover") */
  alunoAtualId?: string | null;
  alunoAtualNome?: string | null;
  onSelecionar: (alunoId: string) => void;
  onRemover: () => void;
  posicaoLabel: string; // ex: "Linha 2 · Coluna 3"
}

function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function EscolherAlunoModal({
  open,
  onOpenChange,
  alunosDisponiveis,
  alunoAtualId,
  alunoAtualNome,
  onSelecionar,
  onRemover,
  posicaoLabel,
}: Props) {
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = stripDiacritics(query.trim());
    if (q === "") return alunosDisponiveis;
    return alunosDisponiveis.filter((a) => {
      const haystack = stripDiacritics(`${a.numero} ${a.nome}`);
      return haystack.includes(q);
    });
  }, [alunosDisponiveis, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolher aluno</DialogTitle>
          <p className="text-sm text-default-600 mt-1">{posicaoLabel}</p>
        </DialogHeader>

        {alunoAtualId && (
          <div className="border border-default-200 rounded-md p-3 bg-default-50/40">
            <div className="text-xs text-default-600 mb-1">Atualmente nesta carteira:</div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-default-900 truncate">
                {alunoAtualNome}
              </span>
              <button
                type="button"
                onClick={onRemover}
                className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
              >
                <X className="w-3.5 h-3.5" />
                Tirar daqui
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-500 pointer-events-none" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou número..."
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto border border-default-200 rounded-md divide-y divide-default-200 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-default-500 text-center">
              {alunosDisponiveis.length === 0
                ? "Todos os alunos já estão posicionados."
                : "Nenhum aluno encontrado."}
            </p>
          ) : (
            filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelecionar(a.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-default-50 transition-colors text-left"
              >
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                  {a.numero}
                </span>
                <span className="text-sm text-default-900 truncate">
                  {a.nome}
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
