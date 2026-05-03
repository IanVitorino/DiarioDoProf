"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, Users } from "lucide-react";
import toast from "react-hot-toast";
import { setAtribuicaoAtividade } from "@/actions/atividades";
import { setNota } from "@/actions/notas";

interface Aluno {
  id: string;
  nome: string;
}

interface NotaIn {
  alunoId: string;
  valor: number;
}

type Modo = "MEDIA" | "SOMA";

interface Props {
  atividadeId: string;
  atividadeNome: string;
  tipoAtribuicao: "TODOS" | "SELECIONADOS";
  alunosAtribuidos: string[];
  alunosTurma: Aluno[];
  modoCalculo: Modo;
  valorMaximo: number;
  notas: NotaIn[];
}

const VALID_INPUT = /^$|^\d+([.,]\d?)?$/;

function parseNota(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const num = parseFloat(trimmed.replace(",", "."));
  if (Number.isNaN(num)) return null;
  return Math.round(num * 10) / 10;
}

export function AtribuicaoButton({
  atividadeId,
  atividadeNome,
  tipoAtribuicao,
  alunosAtribuidos,
  alunosTurma,
  modoCalculo,
  valorMaximo,
  notas,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const isTodos = tipoAtribuicao === "TODOS";
  const totalAlunos = alunosTurma.length;
  const totalAtribuidos = isTodos ? totalAlunos : alunosAtribuidos.length;

  const cap = modoCalculo === "MEDIA" ? 10 : valorMaximo;

  // Estado da seleção dentro do modal
  const initialSet = React.useMemo(
    () =>
      new Set(isTodos ? alunosTurma.map((a) => a.id) : alunosAtribuidos),
    [isTodos, alunosAtribuidos, alunosTurma],
  );
  const [selecionados, setSelecionados] =
    React.useState<Set<string>>(initialSet);

  // Estado das notas (key = alunoId, value = string)
  const initialNotaValues = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of notas) map[n.alunoId] = String(n.valor);
    return map;
  }, [notas]);

  const [notaValues, setNotaValues] =
    React.useState<Record<string, string>>(initialNotaValues);
  const [savingNota, setSavingNota] = React.useState<Record<string, boolean>>({});

  // Reseta quando reabre
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setSelecionados(new Set(initialSet));
      setNotaValues({ ...initialNotaValues });
    }
  };

  // Mantém em sync se as notas externas mudarem (ex: salvar no grid principal)
  React.useEffect(() => {
    setNotaValues({ ...initialNotaValues });
  }, [initialNotaValues]);

  const toggle = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const marcarTodos = () => {
    setSelecionados(new Set(alunosTurma.map((a) => a.id)));
  };
  const desmarcarTodos = () => setSelecionados(new Set());

  const handleNotaChange = (alunoId: string, raw: string) => {
    if (!VALID_INPUT.test(raw)) return;
    if (raw !== "") {
      const parsed = parseNota(raw);
      if (parsed !== null && parsed > cap) return;
    }
    setNotaValues((v) => ({ ...v, [alunoId]: raw }));
  };

  const handleNotaBlur = async (alunoId: string) => {
    const raw = notaValues[alunoId] ?? "";
    const initial = initialNotaValues[alunoId] ?? "";
    if (raw === initial) return;

    const parsed = parseNota(raw);
    if (parsed !== null && (parsed < 0 || parsed > cap)) {
      toast.error(`Nota deve estar entre 0 e ${cap}`);
      setNotaValues((v) => ({ ...v, [alunoId]: initial }));
      return;
    }

    setSavingNota((s) => ({ ...s, [alunoId]: true }));
    try {
      await setNota(alunoId, atividadeId, parsed);
      setNotaValues((v) => ({
        ...v,
        [alunoId]: parsed === null ? "" : String(parsed),
      }));
    } catch (err) {
      toast.error((err as Error)?.message ?? "Erro ao salvar nota");
      setNotaValues((v) => ({ ...v, [alunoId]: initial }));
    } finally {
      setSavingNota((s) => ({ ...s, [alunoId]: false }));
    }
  };

  const onSaveAtribuicao = () => {
    startTransition(async () => {
      try {
        await setAtribuicaoAtividade(atividadeId, Array.from(selecionados));
        toast.success("Atribuição salva");
        setOpen(false);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao salvar");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        className="inline-flex items-center gap-1.5 group"
        title="Atribuir alunos"
      >
        {isTodos ? (
          <Badge
            variant="outline"
            className="text-xs font-normal text-default-600 group-hover:border-primary group-hover:text-primary transition-colors"
          >
            <Users className="w-3 h-3 mr-1" />
            Para todos
          </Badge>
        ) : (
          <Badge
            color="success"
            variant="soft"
            className="text-xs font-medium group-hover:opacity-80 transition-opacity"
          >
            <Users className="w-3 h-3 mr-1" />
            {totalAtribuidos} {totalAtribuidos === 1 ? "aluno" : "alunos"}
          </Badge>
        )}
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-3xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Atribuir alunos</DialogTitle>
            <p className="text-sm text-default-600 mt-1">
              {atividadeNome}
            </p>
          </DialogHeader>

          <div className="border border-default-200 rounded-md overflow-hidden">
            {alunosTurma.length === 0 ? (
              <p className="p-4 text-sm text-default-500 text-center">
                Esta turma não tem alunos cadastrados.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-4 px-4 py-2.5 bg-default-100 dark:bg-default-100/50 border-b border-default-200">
                  <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                    <Checkbox
                      checked={
                        selecionados.size === totalAlunos
                          ? true
                          : selecionados.size === 0
                            ? false
                            : "indeterminate"
                      }
                      onCheckedChange={(checked) => {
                        if (checked === true) marcarTodos();
                        else desmarcarTodos();
                      }}
                    />
                    <span className="text-sm font-medium text-default-900">
                      Selecionar todos
                    </span>
                    <span className="text-xs text-default-600">
                      ({selecionados.size} de {totalAlunos})
                    </span>
                  </label>
                  <div className="flex flex-col items-end shrink-0 leading-tight">
                    <span className="text-xs font-semibold text-default-700">
                      Nota máxima: {cap}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-default-500">
                      {modoCalculo === "MEDIA" ? "Média" : "Soma"}
                    </span>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto divide-y divide-default-200 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {alunosTurma.map((aluno, i) => {
                    const isSavingNota = !!savingNota[aluno.id];
                    const naoAtribuido = !selecionados.has(aluno.id);
                    return (
                      <div
                        key={aluno.id}
                        className="flex items-center gap-4 px-4 py-5 hover:bg-default-50 transition-colors"
                      >
                        <label className="flex items-center gap-4 cursor-pointer flex-1 min-w-0">
                          <Checkbox
                            checked={selecionados.has(aluno.id)}
                            onCheckedChange={() => toggle(aluno.id)}
                          />
                          <span className="text-sm text-default-500 w-6 shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-base text-default-900 truncate">
                            {aluno.nome}
                          </span>
                        </label>
                        <div className="relative w-24 shrink-0">
                          <Input
                            value={notaValues[aluno.id] ?? ""}
                            onChange={(e) =>
                              handleNotaChange(aluno.id, e.target.value)
                            }
                            onBlur={() =>
                              !naoAtribuido && handleNotaBlur(aluno.id)
                            }
                            type="text"
                            inputMode="decimal"
                            placeholder="—"
                            className={
                              naoAtribuido
                                ? "text-center bg-default-100 text-default-400 cursor-not-allowed"
                                : "text-center"
                            }
                            disabled={isSavingNota || naoAtribuido}
                            readOnly={naoAtribuido}
                            title={
                              naoAtribuido
                                ? "Marque o aluno e salve para lançar nota"
                                : undefined
                            }
                          />
                          {isSavingNota && (
                            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-default-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <p className="text-xs text-default-500">
            Atividades atribuídas só pesam na média dos alunos selecionados.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onSaveAtribuicao}
              disabled={pending}
            >
              {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
