"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { createTurma } from "@/actions/turmas";
import { DISCIPLINAS_POR_AREA } from "@/lib/disciplinas";

const schema = z.object({
  serie: z
    .string()
    .regex(/^[1-9]$/, "Série deve ser um número de 1 a 9"),
  turma: z.string().regex(/^[A-Z]$/, "Turma deve ser uma letra de A a Z"),
  nivel: z.enum(["FUNDAMENTAL_I", "FUNDAMENTAL_II", "MEDIO"]),
  disciplina: z.string().min(1, "Disciplina é obrigatória"),
  escola: z
    .string()
    .min(1, "Escola é obrigatória")
    .max(120, "Máximo 120 caracteres"),
  turno: z.enum(["MATUTINO", "VESPERTINO", "NOTURNO"], {
    errorMap: () => ({ message: "Turno é obrigatório" }),
  }),
  ano: z
    .string()
    .regex(/^\d{4}$/, "Ano deve ter 4 dígitos"),
});

type FormData = z.infer<typeof schema>;

interface NovaTurmaButtonProps {
  escolas?: string[];
}

export function NovaTurmaButton({ escolas = [] }: NovaTurmaButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [discOpen, setDiscOpen] = React.useState(false);
  const [escolaOpen, setEscolaOpen] = React.useState(false);
  const [escolaQuery, setEscolaQuery] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      serie: "",
      turma: "",
      nivel: "FUNDAMENTAL_II",
      disciplina: "",
      escola: "",
      turno: "MATUTINO",
      ano: String(new Date().getFullYear()),
    },
  });

  const nivel = watch("nivel");
  const escolaSelecionada = watch("escola");
  const turno = watch("turno");
  const disciplina = watch("disciplina");

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        await createTurma(data);
        toast.success("Turma criada");
        reset();
        setOpen(false);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao criar turma");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova turma
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova turma</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="serie">Série</Label>
              <div className="relative">
                <Input
                  id="serie"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  placeholder="1"
                  className="pr-8"
                  {...register("serie", {
                    onChange: (e) => {
                      const sanitized = e.target.value
                        .replace(/[^1-9]/g, "")
                        .slice(0, 1);
                      if (sanitized !== e.target.value) {
                        setValue("serie", sanitized);
                      }
                    },
                  })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-default-500 pointer-events-none select-none">
                  º
                </span>
              </div>
              {errors.serie && (
                <p className="text-destructive text-sm mt-1">{errors.serie.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="turma">Turma</Label>
              <Input
                id="turma"
                placeholder="Ex: A"
                maxLength={1}
                className="uppercase"
                {...register("turma", {
                  onChange: (e) => {
                    const sanitized = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z]/g, "")
                      .slice(0, 1);
                    if (sanitized !== e.target.value) {
                      setValue("turma", sanitized);
                    }
                  },
                })}
              />
              {errors.turma && (
                <p className="text-destructive text-sm mt-1">{errors.turma.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nivel">Ensino</Label>
              <Select
                value={nivel}
                onValueChange={(v: "FUNDAMENTAL_I" | "FUNDAMENTAL_II" | "MEDIO") =>
                  setValue("nivel", v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FUNDAMENTAL_I">Fundamental I</SelectItem>
                  <SelectItem value="FUNDAMENTAL_II">Fundamental II</SelectItem>
                  <SelectItem value="MEDIO">Médio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="turno">Turno</Label>
              <Select
                value={turno}
                onValueChange={(v: "MATUTINO" | "VESPERTINO" | "NOTURNO") =>
                  setValue("turno", v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MATUTINO">Matutino</SelectItem>
                  <SelectItem value="VESPERTINO">Vespertino</SelectItem>
                  <SelectItem value="NOTURNO">Noturno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="ano">Ano</Label>
            <Input
              id="ano"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="2026"
              {...register("ano", {
                onChange: (e) => {
                  const sanitized = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 4);
                  if (sanitized !== e.target.value) {
                    setValue("ano", sanitized);
                  }
                },
              })}
            />
            {errors.ano && (
              <p className="text-destructive text-sm mt-1">{errors.ano.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="disciplina">Disciplina</Label>
            <Popover open={discOpen} onOpenChange={setDiscOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={discOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className={cn(!disciplina && "text-default-500")}>
                    {disciplina || "Selecione a disciplina"}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-[var(--radix-popover-trigger-width)] z-[10000]"
                align="start"
              >
                <Command
                  filter={(value, search) => {
                    const stripDiacritics = (s: string) =>
                      s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
                    return stripDiacritics(value).includes(
                      stripDiacritics(search),
                    )
                      ? 1
                      : 0;
                  }}
                >
                  <CommandInput placeholder="Buscar disciplina..." />
                  <CommandList
                    className="max-h-72 overflow-y-auto"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                  >
                    <CommandEmpty>Nenhuma disciplina encontrada.</CommandEmpty>
                    {DISCIPLINAS_POR_AREA.map((grupo) => (
                      <CommandGroup key={grupo.area} heading={grupo.area}>
                        {grupo.disciplinas.map((d) => (
                          <CommandItem
                            key={d}
                            value={d}
                            onSelect={() => {
                              setValue("disciplina", d, {
                                shouldValidate: true,
                              });
                              setDiscOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                disciplina === d ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {d}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.disciplina && (
              <p className="text-destructive text-sm mt-1">{errors.disciplina.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="escola">Escola</Label>
            <Popover open={escolaOpen} onOpenChange={setEscolaOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={escolaOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className={cn(!escolaSelecionada && "text-default-500", "truncate")}>
                    {escolaSelecionada || "Selecione ou digite uma escola"}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-[var(--radix-popover-trigger-width)] z-[10000]"
                align="start"
              >
                <Command
                  filter={(value, search) => {
                    const stripDiacritics = (s: string) =>
                      s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
                    return stripDiacritics(value).includes(
                      stripDiacritics(search),
                    )
                      ? 1
                      : 0;
                  }}
                >
                  <CommandInput
                    placeholder="Buscar ou criar nova..."
                    value={escolaQuery}
                    onValueChange={setEscolaQuery}
                    maxLength={120}
                  />
                  <CommandList
                    className="max-h-72 overflow-y-auto"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                  >
                    {escolas.length > 0 && (
                      <CommandGroup heading="Suas escolas">
                        {escolas.map((e) => (
                          <CommandItem
                            key={e}
                            value={e}
                            onSelect={() => {
                              setValue("escola", e, { shouldValidate: true });
                              setEscolaQuery("");
                              setEscolaOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                escolaSelecionada === e
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span className="truncate">{e}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {(() => {
                      const trimmed = escolaQuery.trim();
                      const jaExiste = escolas.some(
                        (e) =>
                          e.toLowerCase() === trimmed.toLowerCase(),
                      );
                      if (trimmed === "" || jaExiste) {
                        return escolas.length === 0 ? (
                          <CommandEmpty>
                            Digite o nome da escola pra criar.
                          </CommandEmpty>
                        ) : null;
                      }
                      return (
                        <CommandGroup heading="Adicionar nova">
                          <CommandItem
                            value={`__new__${trimmed}`}
                            onSelect={() => {
                              setValue("escola", trimmed, {
                                shouldValidate: true,
                              });
                              setEscolaQuery("");
                              setEscolaOpen(false);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4 text-primary" />
                            <span className="truncate">
                              Criar &ldquo;{trimmed}&rdquo;
                            </span>
                          </CommandItem>
                        </CommandGroup>
                      );
                    })()}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.escola && (
              <p className="text-destructive text-sm mt-1">{errors.escola.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
