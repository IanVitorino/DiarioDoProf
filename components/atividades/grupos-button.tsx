"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createGrupo,
  removeGrupo,
  setNotaGrupo,
  updateGrupo,
} from "@/actions/grupos";
import { setNota } from "@/actions/notas";

interface Aluno {
  id: string;
  nome: string;
}

interface GrupoIn {
  id: string;
  nome: string;
  tema: string | null;
  notaGrupo: number | null;
  membros: { alunoId: string }[];
}

interface NotaIn {
  alunoId: string;
  valor: number;
}

type Modo = "MEDIA" | "SOMA";

interface Props {
  atividadeId: string;
  atividadeNome: string;
  grupos: GrupoIn[];
  /** Alunos que podem entrar em grupos (atribuídos à atividade). */
  alunosAtribuidos: Aluno[];
  modoCalculo: Modo;
  valorMaximo: number;
  notas: NotaIn[];
}

type View =
  | { mode: "list" }
  | { mode: "form"; grupo: GrupoIn | null };

export function GruposButton({
  atividadeId,
  atividadeNome,
  grupos,
  alunosAtribuidos,
  modoCalculo,
  valorMaximo,
  notas,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<View>({ mode: "list" });
  const [removeOpen, setRemoveOpen] = React.useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [removing, startRemoveTransition] = React.useTransition();

  const totalGrupos = grupos.length;

  const alunosEmGrupos = new Set<string>();
  for (const g of grupos) {
    for (const m of g.membros) alunosEmGrupos.add(m.alunoId);
  }
  const alunosSemGrupo = alunosAtribuidos.filter(
    (a) => !alunosEmGrupos.has(a.id),
  );

  const alunoNomePorId = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const a of alunosAtribuidos) map.set(a.id, a.nome);
    return map;
  }, [alunosAtribuidos]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setView({ mode: "list" });
  };

  const onConfirmRemove = () => {
    if (!removeOpen) return;
    const id = removeOpen.id;
    startRemoveTransition(async () => {
      try {
        await removeGrupo(id);
        toast.success("Grupo removido");
        setRemoveOpen(null);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao remover");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 group"
        title="Gerenciar grupos"
      >
        <Badge
          variant="outline"
          className="text-xs font-normal text-default-600 group-hover:border-primary group-hover:text-primary transition-colors"
        >
          <Users className="w-3 h-3 mr-1" />
          {totalGrupos === 0
            ? "Sem grupos"
            : `${totalGrupos} ${totalGrupos === 1 ? "grupo" : "grupos"}`}
        </Badge>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-3xl lg:max-w-4xl">
          {view.mode === "list" ? (
            <ListView
              atividadeNome={atividadeNome}
              grupos={grupos}
              alunosSemGrupoCount={alunosSemGrupo.length}
              alunoNomePorId={alunoNomePorId}
              onNovo={() => setView({ mode: "form", grupo: null })}
              onEditar={(grupo) => setView({ mode: "form", grupo })}
              onRemove={(id, nome) => setRemoveOpen({ id, nome })}
            />
          ) : (
            <FormView
              key={view.grupo?.id ?? "new"}
              atividadeId={atividadeId}
              grupo={view.grupo}
              alunosAtribuidos={alunosAtribuidos}
              gruposExistentes={grupos}
              modoCalculo={modoCalculo}
              valorMaximo={valorMaximo}
              notas={notas}
              onBack={() => setView({ mode: "list" })}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!removeOpen}
        onOpenChange={(o) => !o && setRemoveOpen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Remover o grupo <strong>{removeOpen?.nome}</strong>? Os alunos
              dele continuam atribuídos à atividade, mas perdem essa
              organização.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirmRemove();
              }}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ListView({
  atividadeNome,
  grupos,
  alunosSemGrupoCount,
  alunoNomePorId,
  onNovo,
  onEditar,
  onRemove,
}: {
  atividadeNome: string;
  grupos: GrupoIn[];
  alunosSemGrupoCount: number;
  alunoNomePorId: Map<string, string>;
  onNovo: () => void;
  onEditar: (g: GrupoIn) => void;
  onRemove: (id: string, nome: string) => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Grupos</DialogTitle>
        <p className="text-sm text-default-600 mt-1">{atividadeNome}</p>
      </DialogHeader>

      {grupos.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <p className="text-default-600 text-sm text-center max-w-xs">
            Nenhum grupo cadastrado para esta atividade.
          </p>
          <Button onClick={onNovo}>
            <Plus className="w-4 h-4 mr-2" />
            Novo grupo
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-default-600">
              {alunosSemGrupoCount === 0
                ? "Todos os alunos atribuídos estão em grupos."
                : `${alunosSemGrupoCount} ${alunosSemGrupoCount === 1 ? "aluno atribuído sem grupo" : "alunos atribuídos sem grupo"}.`}
            </p>
            <Button size="sm" onClick={onNovo}>
              <Plus className="w-4 h-4 mr-2" />
              Novo grupo
            </Button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {grupos.map((g, idx) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onEditar(g)}
                className="w-full text-left group/card bg-card border border-default-200 rounded-lg p-4 hover:border-primary hover:shadow-md hover:bg-default-50/40 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary font-bold shrink-0 group-hover/card:bg-primary group-hover/card:text-primary-foreground transition-colors">
                    {idx + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-default-900 truncate">
                          {g.nome}
                        </h4>
                        {g.tema ? (
                          <p className="text-sm text-default-600 truncate">
                            {g.tema}
                          </p>
                        ) : (
                          <p className="text-xs text-default-400 italic">
                            Sem tema
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className="text-xs font-normal text-default-600"
                        >
                          <Users className="w-3 h-3 mr-1" />
                          {g.membros.length}
                        </Badge>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(g.id, g.nome);
                          }}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-default-500 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Remover grupo"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {g.membros.length === 0 ? (
                      <p className="text-xs text-default-500 italic">
                        Sem integrantes.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {g.membros.map((m) => (
                          <Badge
                            key={m.alunoId}
                            color="success"
                            variant="soft"
                            className="text-xs font-normal"
                          >
                            {alunoNomePorId.get(m.alunoId) ?? "—"}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

const VALID_INPUT = /^$|^\d+([.,]\d?)?$/;

function parseNotaInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const num = parseFloat(trimmed.replace(",", "."));
  if (Number.isNaN(num)) return null;
  return Math.round(num * 10) / 10;
}

function FormView({
  atividadeId,
  grupo,
  alunosAtribuidos,
  gruposExistentes,
  modoCalculo,
  valorMaximo,
  notas,
  onBack,
}: {
  atividadeId: string;
  grupo: GrupoIn | null;
  alunosAtribuidos: Aluno[];
  gruposExistentes: GrupoIn[];
  modoCalculo: Modo;
  valorMaximo: number;
  notas: NotaIn[];
  onBack: () => void;
}) {
  const isEdit = grupo != null;
  const [pending, startTransition] = React.useTransition();

  const nomeDefaultNovo = `Grupo ${gruposExistentes.length + 1}`;
  const [nome, setNome] = React.useState(grupo?.nome ?? nomeDefaultNovo);
  const [tema, setTema] = React.useState(grupo?.tema ?? "");
  const [selecionados, setSelecionados] = React.useState<Set<string>>(
    new Set(grupo?.membros.map((m) => m.alunoId) ?? []),
  );
  // No edit, "main" mostra membros atuais; "picker" abre lista pra adicionar.
  // No create, sempre "picker".
  const [subMode, setSubMode] = React.useState<"main" | "picker">(
    isEdit ? "main" : "picker",
  );

  // Estado pós-save: botão vira "Salvo" com contorno até usuário editar de novo
  const [justSaved, setJustSaved] = React.useState(false);

  const alunosOcupadosEmOutros = React.useMemo(() => {
    const set = new Set<string>();
    for (const g of gruposExistentes) {
      if (grupo && g.id === grupo.id) continue;
      for (const m of g.membros) set.add(m.alunoId);
    }
    return set;
  }, [gruposExistentes, grupo]);

  // Candidatos no MODO CREATE: alunos atribuídos que não estão em outros grupos
  const candidatosCreate = alunosAtribuidos.filter(
    (a) => !alunosOcupadosEmOutros.has(a.id),
  );

  // Candidatos no MODO EDIT/PICKER: igual + ainda não está neste grupo
  const candidatosAdd = alunosAtribuidos.filter(
    (a) => !alunosOcupadosEmOutros.has(a.id) && !selecionados.has(a.id),
  );

  const alunoNomePorId = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const a of alunosAtribuidos) map.set(a.id, a.nome);
    return map;
  }, [alunosAtribuidos]);

  // ===== NOTAS (somente edit) =====
  const cap = modoCalculo === "MEDIA" ? 10 : valorMaximo;

  // Estado da "Nota do grupo" (string controlada)
  const initialNotaGrupo =
    grupo?.notaGrupo != null ? String(grupo.notaGrupo) : "";
  const [notaGrupo, setNotaGrupoLocal] = React.useState(initialNotaGrupo);
  const [savingNotaGrupo, setSavingNotaGrupo] = React.useState(false);

  // Estado das notas individuais por alunoId
  const initialNotaIndividual = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of notas) map[n.alunoId] = String(n.valor);
    return map;
  }, [notas]);
  const [notasIndividuais, setNotasIndividuais] = React.useState<
    Record<string, string>
  >(initialNotaIndividual);
  const [savingNota, setSavingNotaIndividual] = React.useState<
    Record<string, boolean>
  >({});

  // Sincroniza quando notas externas mudam
  React.useEffect(() => {
    setNotasIndividuais(initialNotaIndividual);
  }, [initialNotaIndividual]);

  React.useEffect(() => {
    setNotaGrupoLocal(initialNotaGrupo);
  }, [initialNotaGrupo]);

  const handleNotaGrupoChange = (raw: string) => {
    if (!VALID_INPUT.test(raw)) return;
    if (raw !== "") {
      const parsed = parseNotaInput(raw);
      if (parsed !== null && parsed > cap) return;
    }
    setNotaGrupoLocal(raw);
  };

  const saveNotaGrupo = async (raw: string) => {
    if (!grupo) return;
    if (raw === initialNotaGrupo) return;

    const parsed = parseNotaInput(raw);
    if (parsed !== null && (parsed < 0 || parsed > cap)) {
      toast.error(`Nota deve estar entre 0 e ${cap}`);
      setNotaGrupoLocal(initialNotaGrupo);
      return;
    }
    setSavingNotaGrupo(true);
    try {
      await setNotaGrupo(grupo.id, parsed);
      if (parsed !== null) {
        toast.success("Nota aplicada nos alunos sem nota");
      }
    } catch (err) {
      toast.error((err as Error)?.message ?? "Erro ao salvar nota do grupo");
      setNotaGrupoLocal(initialNotaGrupo);
    } finally {
      setSavingNotaGrupo(false);
    }
  };

  const handleNotaGrupoBlur = async () => {
    await saveNotaGrupo(notaGrupo);
  };

  const handleNotaIndividualChange = (alunoId: string, raw: string) => {
    if (!VALID_INPUT.test(raw)) return;
    if (raw !== "") {
      const parsed = parseNotaInput(raw);
      if (parsed !== null && parsed > cap) return;
    }
    setNotasIndividuais((v) => ({ ...v, [alunoId]: raw }));
  };

  // Salva uma nota com base num valor cru passado direto.
  // Usado por Enter (lê do DOM) e por blur (lê do state).
  const saveNotaIndividual = async (alunoId: string, raw: string) => {
    if (!grupo) return;
    const initial = initialNotaIndividual[alunoId] ?? "";
    if (raw === initial) return;
    const parsed = parseNotaInput(raw);
    if (parsed !== null && (parsed < 0 || parsed > cap)) {
      toast.error(`Nota deve estar entre 0 e ${cap}`);
      setNotasIndividuais((v) => ({ ...v, [alunoId]: initial }));
      return;
    }
    setSavingNotaIndividual((s) => ({ ...s, [alunoId]: true }));
    try {
      await setNota(alunoId, atividadeId, parsed);
      setNotasIndividuais((v) => ({
        ...v,
        [alunoId]: parsed === null ? "" : String(parsed),
      }));
    } catch (err) {
      toast.error((err as Error)?.message ?? "Erro ao salvar nota");
      setNotasIndividuais((v) => ({ ...v, [alunoId]: initial }));
    } finally {
      setSavingNotaIndividual((s) => ({ ...s, [alunoId]: false }));
    }
  };

  const handleNotaIndividualBlur = async (alunoId: string) => {
    const raw = notasIndividuais[alunoId] ?? "";
    await saveNotaIndividual(alunoId, raw);
  };

  const toggleCreate = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removerMembro = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setJustSaved(false);
  };

  const adicionarMembros = (ids: string[]) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
    setSubMode("main");
    setJustSaved(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim() === "") {
      toast.error("Nome é obrigatório");
      return;
    }
    if (selecionados.size === 0) {
      toast.error("Selecione pelo menos um aluno para o grupo");
      return;
    }
    const payload = {
      nome: nome.trim(),
      tema: tema.trim() || undefined,
      alunoIds: Array.from(selecionados),
    };
    startTransition(async () => {
      try {
        if (isEdit && grupo) {
          await updateGrupo(grupo.id, payload);
          toast.success("Grupo atualizado");
          setJustSaved(true);
        } else {
          await createGrupo(atividadeId, payload);
          toast.success("Grupo criado");
          onBack();
        }
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao salvar grupo");
      }
    });
  };

  // ============================================================
  // SUB-VIEW: PICKER (adicionar integrantes ao grupo em edição)
  // ============================================================
  if (isEdit && subMode === "picker") {
    return (
      <PickerView
        candidatos={candidatosAdd}
        onCancel={() => setSubMode("main")}
        onConfirm={adicionarMembros}
      />
    );
  }

  // ============================================================
  // VIEW: CREATE (formulário simples com picker direto)
  // ============================================================
  if (!isEdit) {
    return (
      <>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <DialogTitle>Novo grupo</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="grupo-nome">Nome</Label>
            <Input
              id="grupo-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Grupo 1"
              maxLength={80}
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="grupo-tema">Tema (opcional)</Label>
            <Input
              id="grupo-tema"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex: Revolução Industrial"
              maxLength={120}
            />
          </div>

          <div>
            <Label className="mb-2 block">Membros</Label>
            <div className="border border-default-200 rounded-md overflow-hidden">
              {alunosAtribuidos.length === 0 ? (
                <p className="p-4 text-sm text-default-500 text-center">
                  Nenhum aluno atribuído à atividade.
                </p>
              ) : candidatosCreate.length === 0 ? (
                <p className="p-4 text-sm text-default-500 text-center">
                  Todos os alunos atribuídos já estão em outros grupos.
                </p>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-default-200 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {candidatosCreate.map((aluno, i) => (
                    <label
                      key={aluno.id}
                      className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-default-50 transition-colors"
                    >
                      <Checkbox
                        checked={selecionados.has(aluno.id)}
                        onCheckedChange={() => toggleCreate(aluno.id)}
                      />
                      <span className="text-sm text-default-500 w-6 shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-default-900 truncate">
                        {aluno.nome}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-default-500 mt-1.5">
              Apenas alunos atribuídos à atividade que ainda não estão em outro
              grupo aparecem aqui.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </form>
      </>
    );
  }

  // ============================================================
  // VIEW: EDIT MAIN (lista de membros + botão de adicionar)
  // ============================================================
  const membrosAtuais = Array.from(selecionados)
    .map((id) => ({ id, nome: alunoNomePorId.get(id) ?? "—" }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <DialogTitle>Editar grupo</DialogTitle>
        </div>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="grupo-nome">Nome</Label>
            <Input
              id="grupo-nome"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setJustSaved(false);
              }}
              maxLength={80}
            />
          </div>
          <div>
            <Label htmlFor="grupo-tema">Tema (opcional)</Label>
            <Input
              id="grupo-tema"
              value={tema}
              onChange={(e) => {
                setTema(e.target.value);
                setJustSaved(false);
              }}
              placeholder="Ex: Revolução Industrial"
              maxLength={120}
            />
          </div>
        </div>

        <div className="rounded-md border border-default-200 bg-default-50/40 p-3 flex items-center gap-3">
          <div className="flex-1">
            <Label htmlFor="nota-grupo" className="text-default-900 font-medium">
              Nota do grupo
            </Label>
            <p className="text-xs text-default-500 mt-0.5">
              Aplica a mesma nota nos integrantes que estão sem nota.
              Notas já lançadas não são alteradas.
            </p>
          </div>
          <div className="relative w-28 shrink-0">
            <Input
              id="nota-grupo"
              value={notaGrupo}
              onChange={(e) => handleNotaGrupoChange(e.target.value)}
              onBlur={handleNotaGrupoBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  const raw = e.currentTarget.value;
                  setNotaGrupoLocal(raw);
                  saveNotaGrupo(raw);
                }
              }}
              type="text"
              inputMode="decimal"
              placeholder="—"
              className="text-center"
              disabled={savingNotaGrupo}
            />
            {savingNotaGrupo && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-default-400" />
            )}
          </div>
          <span className="text-xs text-default-500 shrink-0">/ {cap}</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Integrantes ({membrosAtuais.length})</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSubMode("picker")}
              disabled={candidatosAdd.length === 0}
              title={
                candidatosAdd.length === 0
                  ? "Não há alunos disponíveis pra adicionar"
                  : undefined
              }
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar integrante
            </Button>
          </div>
          <div className="border border-default-200 rounded-md overflow-hidden">
            {membrosAtuais.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-3">
                <div className="rounded-full bg-default-100 p-3">
                  <Users className="w-5 h-5 text-default-500" />
                </div>
                <p className="text-sm text-default-500">
                  Nenhum integrante neste grupo.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setSubMode("picker")}
                  disabled={candidatosAdd.length === 0}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            ) : (
              <div className="max-h-[40vh] overflow-y-auto divide-y divide-default-200 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {membrosAtuais.map((m, i) => {
                  const isSavingMembro = !!savingNota[m.id];
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-default-50 transition-colors"
                    >
                      <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-default-900 flex-1 truncate">
                        {m.nome}
                      </span>
                      <div className="relative w-20 shrink-0">
                        <Input
                          value={notasIndividuais[m.id] ?? ""}
                          onChange={(e) =>
                            handleNotaIndividualChange(m.id, e.target.value)
                          }
                          onBlur={() => handleNotaIndividualBlur(m.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              const raw = e.currentTarget.value;
                              setNotasIndividuais((v) => ({
                                ...v,
                                [m.id]: raw,
                              }));
                              saveNotaIndividual(m.id, raw);
                            }
                          }}
                          type="text"
                          inputMode="decimal"
                          placeholder="—"
                          className="text-center h-8"
                          disabled={isSavingMembro}
                        />
                        {isSavingMembro && (
                          <Loader2 className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-default-400" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removerMembro(m.id)}
                        className="h-7 w-7 text-default-500 hover:text-destructive"
                        title="Remover do grupo"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={pending}
          >
            Voltar
          </Button>
          <Button
            type="submit"
            disabled={pending}
            variant={justSaved ? "outline" : undefined}
            className={
              justSaved
                ? "border-primary text-primary hover:bg-primary/5"
                : undefined
            }
          >
            {pending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : justSaved ? (
              <Check className="w-4 h-4 mr-2" />
            ) : null}
            {justSaved ? "Salvo" : "Salvar"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

function PickerView({
  candidatos,
  onCancel,
  onConfirm,
}: {
  candidatos: Aluno[];
  onCancel: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const [picked, setPicked] = React.useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <DialogTitle>Adicionar integrantes</DialogTitle>
        </div>
      </DialogHeader>

      <div className="border border-default-200 rounded-md overflow-hidden">
        {candidatos.length === 0 ? (
          <p className="p-6 text-sm text-default-500 text-center">
            Não há alunos disponíveis pra adicionar a este grupo.
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-default-200 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {candidatos.map((aluno, i) => (
              <label
                key={aluno.id}
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-default-50 transition-colors"
              >
                <Checkbox
                  checked={picked.has(aluno.id)}
                  onCheckedChange={() => toggle(aluno.id)}
                />
                <span className="text-sm text-default-500 w-6 shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-default-900 truncate">
                  {aluno.nome}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => onConfirm(Array.from(picked))}
          disabled={picked.size === 0}
        >
          Adicionar
          {picked.size > 0 ? ` (${picked.size})` : ""}
        </Button>
      </DialogFooter>
    </>
  );
}
