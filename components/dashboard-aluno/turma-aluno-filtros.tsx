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

interface TurmaOption {
  id: string;
  nome: string;
  disciplina: string;
  serie?: string | null;
  escola?: string | null;
}

interface AlunoOption {
  id: string;
  nome: string;
}

interface Props {
  turmas: TurmaOption[];
  alunos: AlunoOption[];
  turmaId: string | null;
  alunoId: string | null;
}

function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function TurmaAlunoFiltros({ turmas, alunos, turmaId, alunoId }: Props) {
  const router = useRouter();

  const onTurmaChange = (id: string) => {
    router.push(`/dashboard-aluno?turma=${id}`);
  };

  const onAlunoChange = (id: string) => {
    router.push(`/dashboard-aluno?turma=${turmaId}&aluno=${id}`);
  };

  const turmaSelecionada = turmas.find((t) => t.id === turmaId);
  const alunoSelecionado = alunos.find((a) => a.id === alunoId);
  const alunoIndex =
    alunoSelecionado != null
      ? alunos.findIndex((a) => a.id === alunoSelecionado.id)
      : -1;

  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block">Turma</Label>
          <TurmaCombobox
            turmas={turmas}
            selecionada={turmaSelecionada ?? null}
            onSelect={onTurmaChange}
          />
        </div>
        <div>
          <Label className="mb-2 block">Aluno</Label>
          <AlunoCombobox
            alunos={alunos}
            selecionado={alunoSelecionado ?? null}
            selecionadoIndex={alunoIndex}
            disabled={!turmaId}
            onSelect={onAlunoChange}
          />
        </div>
      </div>
    </Card>
  );
}

function TurmaCombobox({
  turmas,
  selecionada,
  onSelect,
}: {
  turmas: TurmaOption[];
  selecionada: TurmaOption | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!selecionada && "text-default-500", "truncate")}>
            {selecionada
              ? `${selecionada.nome} · ${selecionada.disciplina}${
                  selecionada.escola ? ` · ${selecionada.escola}` : ""
                }`
              : "Selecione uma turma"}
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
          <CommandInput placeholder="Buscar por série, disciplina ou escola..." />
          <CommandList
            className="max-h-72 overflow-y-auto"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <CommandEmpty>Nenhuma turma encontrada.</CommandEmpty>
            <CommandGroup>
              {turmas.map((t) => {
                const haystack = [t.nome, t.disciplina, t.serie ?? "", t.escola ?? ""]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <CommandItem
                    key={t.id}
                    value={`${haystack} ${t.id}`}
                    onSelect={() => {
                      onSelect(t.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selecionada?.id === t.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">
                        {t.nome} · {t.disciplina}
                      </span>
                      {t.escola && (
                        <span className="text-xs text-default-500 truncate">
                          {t.escola}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AlunoCombobox({
  alunos,
  selecionado,
  selecionadoIndex,
  disabled,
  onSelect,
}: {
  alunos: AlunoOption[];
  selecionado: AlunoOption | null;
  selecionadoIndex: number;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!selecionado && "text-default-500", "truncate")}>
            {selecionado
              ? `${selecionadoIndex + 1}. ${selecionado.nome}`
              : disabled
              ? "Selecione uma turma primeiro"
              : "Selecione um aluno"}
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
          <CommandInput placeholder="Buscar aluno..." />
          <CommandList
            className="max-h-72 overflow-y-auto"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
            <CommandGroup>
              {alunos.map((a, i) => (
                <CommandItem
                  key={a.id}
                  value={`${a.nome} ${a.id}`}
                  onSelect={() => {
                    onSelect(a.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selecionado?.id === a.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">
                    {i + 1}. {a.nome}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
