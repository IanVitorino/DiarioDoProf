"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { bimestreNome } from "@/lib/turma-format";

export interface TurmaItem {
  id: string;
  nome: string;
  disciplina: string;
  serie: string;
  ano: number;
  escola: string | null;
}

export interface AtividadeItem {
  id: string;
  nome: string;
  bimestre: number;
}

interface Props {
  turmas: TurmaItem[];
  atividades: AtividadeItem[];
  escolaSelecionada: string | null;
  turmaId: string | null;
  atividadeId: string | null;
}

function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

const SEM_ESCOLA_KEY = "__SEM_ESCOLA__";

export function FiltrosBar({
  turmas,
  atividades,
  escolaSelecionada,
  turmaId,
  atividadeId,
}: Props) {
  const router = useRouter();

  // Lista única de escolas (das turmas do prof)
  const escolas = React.useMemo(() => {
    const set = new Set<string>();
    let temVazia = false;
    for (const t of turmas) {
      if (t.escola && t.escola.trim() !== "") set.add(t.escola);
      else temVazia = true;
    }
    const ordered = Array.from(set).sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
    if (temVazia) ordered.push(SEM_ESCOLA_KEY);
    return ordered;
  }, [turmas]);

  // Turmas filtradas pela escola
  const turmasDaEscola = React.useMemo(() => {
    if (!escolaSelecionada) return [];
    if (escolaSelecionada === SEM_ESCOLA_KEY) {
      return turmas.filter((t) => !t.escola || t.escola.trim() === "");
    }
    return turmas.filter((t) => t.escola === escolaSelecionada);
  }, [turmas, escolaSelecionada]);

  const turmaSelecionada = turmaId
    ? turmasDaEscola.find((t) => t.id === turmaId) ?? null
    : null;

  const atividadeSelecionada = atividadeId
    ? atividades.find((a) => a.id === atividadeId) ?? null
    : null;

  const setEscola = (escola: string | null) => {
    const params = new URLSearchParams();
    if (escola) params.set("escola", escola);
    // Reseta turma e atividade
    router.replace(
      params.toString()
        ? `/dashboard-atividades?${params.toString()}`
        : "/dashboard-atividades",
    );
  };

  const setTurma = (id: string) => {
    const params = new URLSearchParams();
    if (escolaSelecionada) params.set("escola", escolaSelecionada);
    params.set("turma", id);
    // Reseta atividade
    router.replace(`/dashboard-atividades?${params.toString()}`);
  };

  const setAtividade = (id: string) => {
    const params = new URLSearchParams();
    if (escolaSelecionada) params.set("escola", escolaSelecionada);
    if (turmaId) params.set("turma", turmaId);
    params.set("atividade", id);
    router.replace(`/dashboard-atividades?${params.toString()}`);
  };

  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* ESCOLA */}
        <div>
          <Label className="mb-2 block">Escola</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                className="w-full justify-between font-normal"
              >
                <span className={cn(!escolaSelecionada && "text-default-500", "truncate")}>
                  {escolaSelecionada
                    ? escolaSelecionada === SEM_ESCOLA_KEY
                      ? "Sem escola definida"
                      : escolaSelecionada
                    : "Selecione uma escola"}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 w-[var(--radix-popover-trigger-width)] z-[10000]"
              align="start"
            >
              <Command
                filter={(value, search) =>
                  stripDiacritics(value).includes(stripDiacritics(search)) ? 1 : 0
                }
              >
                <CommandInput placeholder="Buscar escola..." />
                <CommandList
                  className="max-h-72 overflow-y-auto"
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  <CommandEmpty>Nenhuma escola encontrada.</CommandEmpty>
                  <CommandGroup>
                    {escolas.map((e) => {
                      const label =
                        e === SEM_ESCOLA_KEY ? "Sem escola definida" : e;
                      return (
                        <CommandItem
                          key={e}
                          value={label}
                          onSelect={() => setEscola(e)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              escolaSelecionada === e ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="truncate">{label}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* TURMA */}
        <div>
          <Label className="mb-2 block">Turma</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                disabled={!escolaSelecionada}
                className="w-full justify-between font-normal"
              >
                <span className={cn(!turmaSelecionada && "text-default-500", "truncate")}>
                  {turmaSelecionada
                    ? `${turmaSelecionada.nome} · ${turmaSelecionada.disciplina}`
                    : escolaSelecionada
                      ? "Selecione uma turma"
                      : "Selecione uma escola primeiro"}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 w-[var(--radix-popover-trigger-width)] z-[10000]"
              align="start"
            >
              <Command
                filter={(value, search) =>
                  stripDiacritics(value).includes(stripDiacritics(search)) ? 1 : 0
                }
              >
                <CommandInput placeholder="Buscar turma ou disciplina..." />
                <CommandList
                  className="max-h-72 overflow-y-auto"
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  <CommandEmpty>Nenhuma turma encontrada.</CommandEmpty>
                  <CommandGroup>
                    {turmasDaEscola.map((t) => {
                      const haystack = [t.nome, t.disciplina, t.serie, String(t.ano)]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <CommandItem
                          key={t.id}
                          value={`${haystack} ${t.id}`}
                          onSelect={() => setTurma(t.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              turmaId === t.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="truncate">
                            {t.nome} · {t.disciplina}{" "}
                            <span className="text-default-500">
                              · {t.ano}
                            </span>
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* ATIVIDADE */}
        <div>
          <Label className="mb-2 block">Atividade</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                disabled={!turmaId}
                className="w-full justify-between font-normal"
              >
                <span className={cn(!atividadeSelecionada && "text-default-500", "truncate")}>
                  {atividadeSelecionada
                    ? `${atividadeSelecionada.nome} · ${bimestreNome(atividadeSelecionada.bimestre)}`
                    : turmaId
                      ? "Selecione uma atividade"
                      : "Selecione uma turma primeiro"}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 w-[var(--radix-popover-trigger-width)] z-[10000]"
              align="start"
            >
              <Command
                filter={(value, search) =>
                  stripDiacritics(value).includes(stripDiacritics(search)) ? 1 : 0
                }
              >
                <CommandInput placeholder="Buscar atividade..." />
                <CommandList
                  className="max-h-72 overflow-y-auto"
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  <CommandEmpty>Nenhuma atividade encontrada.</CommandEmpty>
                  {[1, 2, 3, 4].map((ord) => {
                    const items = atividades.filter((a) => a.bimestre === ord);
                    if (items.length === 0) return null;
                    return (
                      <CommandGroup key={ord} heading={bimestreNome(ord)}>
                        {items.map((a) => (
                          <CommandItem
                            key={a.id}
                            value={`${a.nome} ${a.id}`}
                            onSelect={() => setAtividade(a.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                atividadeId === a.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="truncate">{a.nome}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    );
                  })}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Card>
  );
}
