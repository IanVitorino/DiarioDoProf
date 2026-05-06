"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Eraser,
  Eye,
  GripVertical,
  Loader2,
  MoreVertical,
  Pencil,
  Save,
  Search,
  Trash,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  apagarMapeamento,
  atualizarDimensoes,
  limparPosicoes,
  posicionarAluno,
  removerDaCarteira,
  setReferencias,
} from "@/actions/mapeamento";
import {
  EscolherAlunoModal,
  type AlunoOption,
} from "./escolher-aluno-modal";

interface Aluno {
  id: string;
  nome: string;
}

interface Carteira {
  id: string;
  linha: number;
  coluna: number;
  alunoId: string | null;
}

interface MapeamentoData {
  id: string;
  linhas: number;
  colunas: number;
  refDireitaTopo: string | null;
  refEsquerdaBase: string | null;
  carteiras: Carteira[];
}

interface Props {
  turmaId: string;
  alunos: Aluno[];
  mapeamento: MapeamentoData;
}

const DROPPABLE_PREFIX = "carteira-";
const DRAGGABLE_PREFIX = "aluno-";
const PAINEL_DROPPABLE = "painel-disponiveis";

export function MapeamentoView({ alunos, mapeamento }: Props) {
  // Modo edit (true) só aparece se já tem mapeamento. Default = view.
  const [editing, setEditing] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  // Linhas e colunas locais (em edição podem ser ajustadas)
  const [linhas, setLinhas] = React.useState(String(mapeamento.linhas));
  const [colunas, setColunas] = React.useState(String(mapeamento.colunas));

  // Referências locais
  const [refDireitaTopo, setRefDireitaTopo] = React.useState(
    mapeamento.refDireitaTopo ?? "",
  );
  const [refEsquerdaBase, setRefEsquerdaBase] = React.useState(
    mapeamento.refEsquerdaBase ?? "",
  );

  // Modais
  const [confirmLimpar, setConfirmLimpar] = React.useState(false);
  const [confirmApagar, setConfirmApagar] = React.useState(false);
  const [escolherCarteiraId, setEscolherCarteiraId] = React.useState<
    string | null
  >(null);
  // Substituição via DnD: aparece quando arrasta um aluno pra carteira ocupada
  const [confirmSubstituir, setConfirmSubstituir] = React.useState<{
    carteiraId: string;
    alunoNovoId: string;
    alunoNovoNome: string;
    alunoAtualNome: string;
    isSwap: boolean;
  } | null>(null);

  // Reset state quando dados externos mudam (revalidate)
  React.useEffect(() => {
    setLinhas(String(mapeamento.linhas));
    setColunas(String(mapeamento.colunas));
    setRefDireitaTopo(mapeamento.refDireitaTopo ?? "");
    setRefEsquerdaBase(mapeamento.refEsquerdaBase ?? "");
  }, [mapeamento.linhas, mapeamento.colunas, mapeamento.refDireitaTopo, mapeamento.refEsquerdaBase]);

  // Mapas auxiliares
  const alunoNomePorId = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const a of alunos) m.set(a.id, a.nome);
    return m;
  }, [alunos]);

  // Numero de chamada (alfabético) — alunos já vem ordenados por nome
  const numeroPorAlunoId = React.useMemo(() => {
    const m = new Map<string, number>();
    alunos.forEach((a, i) => m.set(a.id, i + 1));
    return m;
  }, [alunos]);

  const alunosPosicionadosIds = React.useMemo(
    () =>
      new Set(
        mapeamento.carteiras
          .map((c) => c.alunoId)
          .filter((id): id is string => !!id),
      ),
    [mapeamento.carteiras],
  );

  const alunosDisponiveis: AlunoOption[] = React.useMemo(
    () =>
      alunos
        .filter((a) => !alunosPosicionadosIds.has(a.id))
        .map((a) => ({
          id: a.id,
          nome: a.nome,
          numero: numeroPorAlunoId.get(a.id) ?? 0,
        })),
    [alunos, alunosPosicionadosIds, numeroPorAlunoId],
  );

  // Inconsistência: tem aluno na turma sem carteira E não há carteiras vazias
  const carteirasVazias = mapeamento.carteiras.filter((c) => !c.alunoId).length;
  const inconsistencia =
    alunosDisponiveis.length > 0 && carteirasVazias === 0;

  // ======== Handlers ========

  const handleSetReferencias = () => {
    startTransition(async () => {
      try {
        await setReferencias(mapeamento.id, {
          refDireitaTopo: refDireitaTopo.trim() || null,
          refEsquerdaBase: refEsquerdaBase.trim() || null,
        });
        toast.success("Referências salvas");
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao salvar referências");
      }
    });
  };

  const handleSalvarDimensoes = () => {
    const numLinhas = Number(linhas);
    const numColunas = Number(colunas);
    if (!numLinhas || !numColunas) return;
    if (
      numLinhas === mapeamento.linhas &&
      numColunas === mapeamento.colunas
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await atualizarDimensoes(mapeamento.id, {
          linhas: numLinhas,
          colunas: numColunas,
        });
        toast.success("Dimensões atualizadas");
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao atualizar");
        // Reverte estado local
        setLinhas(String(mapeamento.linhas));
        setColunas(String(mapeamento.colunas));
      }
    });
  };

  const handleLimpar = () => {
    startTransition(async () => {
      try {
        await limparPosicoes(mapeamento.id);
        toast.success("Posições limpas");
        setConfirmLimpar(false);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao limpar");
      }
    });
  };

  const handleApagar = () => {
    startTransition(async () => {
      try {
        await apagarMapeamento(mapeamento.id);
        toast.success("Mapeamento apagado");
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao apagar");
      }
    });
  };

  const handlePosicionar = (carteiraId: string, alunoId: string) => {
    startTransition(async () => {
      try {
        await posicionarAluno(carteiraId, alunoId);
        setEscolherCarteiraId(null);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao posicionar");
      }
    });
  };

  const handleRemover = (carteiraId: string) => {
    startTransition(async () => {
      try {
        await removerDaCarteira(carteiraId);
        setEscolherCarteiraId(null);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao remover");
      }
    });
  };

  // ======== DnD ========

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;

    if (!activeId.startsWith(DRAGGABLE_PREFIX)) return;
    const alunoId = activeId.slice(DRAGGABLE_PREFIX.length);

    if (overId.startsWith(DROPPABLE_PREFIX)) {
      const carteiraId = overId.slice(DROPPABLE_PREFIX.length);
      const carteira = mapeamento.carteiras.find((c) => c.id === carteiraId);
      if (!carteira) return;

      // Mesmo aluno na mesma carteira → no-op
      if (carteira.alunoId === alunoId) return;

      // Carteira destino tem outro aluno → confirma substituição/troca antes
      if (carteira.alunoId && carteira.alunoId !== alunoId) {
        const carteiraOrigem = mapeamento.carteiras.find(
          (c) => c.alunoId === alunoId,
        );
        setConfirmSubstituir({
          carteiraId,
          alunoNovoId: alunoId,
          alunoNovoNome: alunoNomePorId.get(alunoId) ?? "—",
          alunoAtualNome: alunoNomePorId.get(carteira.alunoId) ?? "—",
          isSwap: !!carteiraOrigem,
        });
        return;
      }

      // Carteira destino vazia → posiciona direto
      handlePosicionar(carteiraId, alunoId);
      return;
    }

    if (overId === PAINEL_DROPPABLE) {
      // Soltou no painel → remover da carteira atual
      const carteiraOrigem = mapeamento.carteiras.find(
        (c) => c.alunoId === alunoId,
      );
      if (carteiraOrigem) {
        handleRemover(carteiraOrigem.id);
      }
    }
  };

  // ======== Render auxiliares ========

  const sanitize = (v: string) => v.replace(/[^1-9]/g, "").slice(0, 1);

  const carteiraDoEscolher = escolherCarteiraId
    ? mapeamento.carteiras.find((c) => c.id === escolherCarteiraId) ?? null
    : null;

  const linhasArr = Array.from({ length: mapeamento.linhas }, (_, i) => i + 1);
  const colunasArr = Array.from(
    { length: mapeamento.colunas },
    (_, i) => i + 1,
  );

  // Mapa: linha+coluna → carteira
  const carteiraPorLinhaColuna = new Map<string, Carteira>();
  for (const c of mapeamento.carteiras) {
    carteiraPorLinhaColuna.set(`${c.linha}_${c.coluna}`, c);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="space-y-4">
        {/* Header com modo + ações */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-sm text-default-600">
              {mapeamento.linhas} × {mapeamento.colunas} ·{" "}
              {mapeamento.linhas * mapeamento.colunas} carteiras ·{" "}
              {alunos.length} alunos
            </span>
            {editing && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                Modo edição
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={pending}
              >
                <Eye className="w-4 h-4 mr-2" />
                Sair da edição
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => setConfirmLimpar(true)}
                  disabled={pending}
                >
                  <Eraser className="w-4 h-4 mr-2" />
                  Limpar posições
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setConfirmApagar(true)}
                  disabled={pending}
                  className="text-destructive"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Apagar mapeamento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Banner de inconsistência */}
        {inconsistencia && (
          <Card className="p-4 border-amber-500/40 bg-amber-500/5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-default-900 text-sm">
                Há alunos sem cadeira
              </h4>
              <p className="text-sm text-default-700 mt-0.5">
                {alunosDisponiveis.length} aluno(s) não estão posicionados e
                não há carteiras vazias. Edite o grid para aumentar a
                quantidade de carteiras.
              </p>
            </div>
          </Card>
        )}

        {/* Editor de dimensões — só em edição */}
        {editing && (
          <Card className="p-4">
            <h4 className="font-semibold text-default-900 text-sm mb-3">
              Dimensões do grid
            </h4>
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="text-xs text-default-600 block mb-1">
                  Linhas
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={linhas}
                  onChange={(e) => setLinhas(sanitize(e.target.value))}
                  className="w-20 text-center"
                />
              </div>
              <span className="text-default-500 pb-2">×</span>
              <div>
                <label className="text-xs text-default-600 block mb-1">
                  Colunas
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={colunas}
                  onChange={(e) => setColunas(sanitize(e.target.value))}
                  className="w-20 text-center"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleSalvarDimensoes}
                disabled={
                  pending ||
                  !linhas ||
                  !colunas ||
                  (Number(linhas) === mapeamento.linhas &&
                    Number(colunas) === mapeamento.colunas)
                }
              >
                {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Aplicar
              </Button>
            </div>
            <p className="text-xs text-default-500 mt-2">
              Reduzir o grid não é permitido se houver alunos nas posições
              removidas.
            </p>
          </Card>
        )}

        {/* Layout: grid + painel lateral (só desktop em edição) */}
        <div
          className={cn(
            "grid gap-4",
            editing ? "lg:grid-cols-[1fr_280px]" : "grid-cols-1",
          )}
        >
          {/* GRID + REFERÊNCIAS */}
          <Card className="p-5 overflow-x-auto">
            <div className="min-w-fit">
              {/* Indicador "frente da sala" — sutil, acima do grid */}
              <div
                className="grid items-center mb-2"
                style={{
                  gridTemplateColumns: `minmax(110px, auto) repeat(${mapeamento.colunas}, minmax(96px, 1fr)) minmax(110px, auto)`,
                  columnGap: "0.5rem",
                }}
              >
                <div />
                <div
                  className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-default-500 font-semibold"
                  style={{ gridColumn: `2 / span ${mapeamento.colunas}` }}
                >
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-default-300" />
                  <span>Frente da sala</span>
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-default-300" />
                </div>
                <div />
              </div>

              {/* Grid unificado: colunas extras pras referências (1 e N+2) */}
              <div
                className="grid items-center"
                style={{
                  gridTemplateColumns: `minmax(110px, auto) repeat(${mapeamento.colunas}, minmax(96px, 1fr)) minmax(110px, auto)`,
                  columnGap: "0.5rem",
                  rowGap: "0.5rem",
                }}
              >
                {linhasArr.map((linha) => {
                  const isPrimeira = linha === 1;
                  const isUltima = linha === mapeamento.linhas;
                  return (
                    <React.Fragment key={`row-${linha}`}>
                      {/* Coluna esquerda: ref na última linha, vazio nas outras */}
                      {isUltima ? (
                        <div className="pr-1">
                          {editing ? (
                            <Input
                              type="text"
                              placeholder="Ref. (ex: porta)"
                              value={refEsquerdaBase}
                              onChange={(e) =>
                                setRefEsquerdaBase(e.target.value)
                              }
                              onBlur={handleSetReferencias}
                              maxLength={40}
                              className="text-xs h-8"
                            />
                          ) : refEsquerdaBase ? (
                            <div className="text-[11px] text-default-600 italic text-right px-1 leading-tight">
                              {refEsquerdaBase}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div aria-hidden />
                      )}

                      {/* Carteiras da linha */}
                      {colunasArr.map((c) => {
                        const cart = carteiraPorLinhaColuna.get(
                          `${linha}_${c}`,
                        );
                        return (
                          <CarteiraCell
                            key={`${linha}_${c}`}
                            carteira={cart!}
                            alunoNome={
                              cart?.alunoId
                                ? alunoNomePorId.get(cart.alunoId) ?? "—"
                                : null
                            }
                            alunoNumero={
                              cart?.alunoId
                                ? numeroPorAlunoId.get(cart.alunoId) ?? null
                                : null
                            }
                            editing={editing}
                            onClick={() =>
                              editing && setEscolherCarteiraId(cart!.id)
                            }
                          />
                        );
                      })}

                      {/* Coluna direita: ref na primeira linha, vazio nas outras */}
                      {isPrimeira ? (
                        <div className="pl-1">
                          {editing ? (
                            <Input
                              type="text"
                              placeholder="Ref. (ex: lousa)"
                              value={refDireitaTopo}
                              onChange={(e) => setRefDireitaTopo(e.target.value)}
                              onBlur={handleSetReferencias}
                              maxLength={40}
                              className="text-xs h-8"
                            />
                          ) : refDireitaTopo ? (
                            <div className="text-[11px] text-default-600 italic px-1 leading-tight">
                              {refDireitaTopo}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div aria-hidden />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Painel lateral de não posicionados — desktop only, modo edição */}
          {editing && (
            <PainelDisponiveis
              alunos={alunosDisponiveis}
              numeroPorAlunoId={numeroPorAlunoId}
            />
          )}
        </div>
      </div>

      {/* Modais */}
      <EscolherAlunoModal
        open={!!escolherCarteiraId}
        onOpenChange={(o) => !o && setEscolherCarteiraId(null)}
        alunosDisponiveis={alunosDisponiveis}
        alunoAtualId={carteiraDoEscolher?.alunoId ?? null}
        alunoAtualNome={
          carteiraDoEscolher?.alunoId
            ? alunoNomePorId.get(carteiraDoEscolher.alunoId) ?? null
            : null
        }
        onSelecionar={(alunoId) =>
          carteiraDoEscolher && handlePosicionar(carteiraDoEscolher.id, alunoId)
        }
        onRemover={() =>
          carteiraDoEscolher && handleRemover(carteiraDoEscolher.id)
        }
        posicaoLabel={
          carteiraDoEscolher
            ? `Linha ${carteiraDoEscolher.linha} · Coluna ${carteiraDoEscolher.coluna}`
            : ""
        }
      />

      <AlertDialog
        open={!!confirmSubstituir}
        onOpenChange={(o) => !o && setConfirmSubstituir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmSubstituir?.isSwap
                ? "Trocar alunos de lugar?"
                : "Substituir aluno?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmSubstituir?.isSwap ? (
                <>
                  Trocar <strong>{confirmSubstituir.alunoAtualNome}</strong> de
                  lugar com <strong>{confirmSubstituir.alunoNovoNome}</strong>?
                  Os dois ficam nas posições um do outro.
                </>
              ) : (
                <>
                  Substituir <strong>{confirmSubstituir?.alunoAtualNome}</strong>{" "}
                  por <strong>{confirmSubstituir?.alunoNovoNome}</strong> nesta
                  carteira? O aluno atual volta pra lista de não posicionados.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={pending}
              color="default"
              variant="outline"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (confirmSubstituir) {
                  const { carteiraId, alunoNovoId } = confirmSubstituir;
                  setConfirmSubstituir(null);
                  handlePosicionar(carteiraId, alunoNovoId);
                }
              }}
              disabled={pending}
              color="primary"
            >
              {confirmSubstituir?.isSwap ? "Trocar" : "Substituir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmLimpar} onOpenChange={setConfirmLimpar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todas as posições?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os alunos serão removidos das carteiras. As dimensões do
              grid e as referências serão mantidas. Você precisará posicionar
              os alunos novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleLimpar();
              }}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Limpar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmApagar} onOpenChange={setConfirmApagar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar mapeamento da turma?</AlertDialogTitle>
            <AlertDialogDescription>
              O grid inteiro será deletado, incluindo todas as posições e
              referências. Você terá que configurar tudo do zero. Essa ação é{" "}
              <strong>irreversível</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleApagar();
              }}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Apagar mapeamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}

// ============= Carteira Cell =============

function CarteiraCell({
  carteira,
  alunoNome,
  alunoNumero,
  editing,
  onClick,
}: {
  carteira: Carteira;
  alunoNome: string | null;
  alunoNumero: number | null;
  editing: boolean;
  onClick: () => void;
}) {
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `${DROPPABLE_PREFIX}${carteira.id}`,
    disabled: !editing,
  });

  const ocupada = !!carteira.alunoId;

  if (ocupada && carteira.alunoId) {
    return (
      <div ref={setDropRef}>
        <CarteiraOcupada
          carteiraId={carteira.id}
          alunoId={carteira.alunoId}
          alunoNome={alunoNome ?? "—"}
          alunoNumero={alunoNumero ?? 0}
          editing={editing}
          isOver={isOver}
          onClick={onClick}
        />
      </div>
    );
  }

  return (
    <div ref={setDropRef}>
      <button
        type="button"
        onClick={editing ? onClick : undefined}
        disabled={!editing}
        className={cn(
          "group relative w-full h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-xs transition-all",
          // "encosto" da cadeira no topo
          "before:absolute before:top-1.5 before:left-3 before:right-3 before:h-1 before:rounded-full before:transition-colors",
          isOver
            ? "border-primary bg-primary/10 text-primary before:bg-primary/40 scale-[1.02]"
            : "border-default-300 bg-default-100/40 text-default-400 before:bg-default-300/60",
          editing &&
            "hover:border-primary hover:bg-primary/5 hover:text-primary hover:before:bg-primary/40 cursor-pointer",
          !editing && "cursor-default",
        )}
      >
        <span className="font-mono tracking-tight">
          {carteira.linha}
          <span className="opacity-50">·</span>
          {carteira.coluna}
        </span>
        {editing && (
          <span className="absolute bottom-1.5 text-[9px] uppercase tracking-wide opacity-0 group-hover:opacity-70 transition-opacity">
            vazia
          </span>
        )}
      </button>
    </div>
  );
}

// ============= Carteira Ocupada (com aluno) =============

function CarteiraOcupada({
  carteiraId,
  alunoId,
  alunoNome,
  alunoNumero,
  editing,
  isOver,
  onClick,
}: {
  carteiraId: string;
  alunoId: string;
  alunoNome: string;
  alunoNumero: number;
  editing: boolean;
  isOver: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${DRAGGABLE_PREFIX}${alunoId}`,
    disabled: !editing,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className={cn(
        "relative w-full h-20 rounded-lg border bg-card flex items-center px-2 py-1.5 transition-all overflow-hidden",
        // "encosto" da cadeira no topo
        "before:absolute before:top-1.5 before:left-3 before:right-3 before:h-1 before:rounded-full before:bg-default-200 before:transition-colors",
        editing
          ? "border-primary/30 cursor-pointer hover:shadow-md hover:border-primary/60 hover:before:bg-primary/40"
          : "border-default-200",
        isOver && "ring-2 ring-primary ring-offset-1 ring-offset-background",
      )}
    >
      <div className="flex items-center gap-2 w-full pt-1.5">
        {editing && (
          <div
            {...attributes}
            {...listeners}
            className="text-default-300 hover:text-default-700 cursor-grab active:cursor-grabbing shrink-0"
            onClick={(e) => e.stopPropagation()}
            aria-label="Arrastar aluno"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        )}
        <span
          className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 ring-1 ring-primary/20"
          aria-label={`Número de chamada ${alunoNumero}`}
        >
          {alunoNumero}
        </span>
        <button
          type="button"
          onClick={editing ? onClick : undefined}
          disabled={!editing}
          className="flex-1 min-w-0 text-left"
        >
          <div className="text-xs font-medium text-default-900 leading-tight line-clamp-2">
            {alunoNome}
          </div>
        </button>
      </div>
    </div>
  );
}

// ============= Painel de não posicionados =============

function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function PainelDisponiveis({
  alunos,
  numeroPorAlunoId,
}: {
  alunos: AlunoOption[];
  numeroPorAlunoId: Map<string, number>;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: PAINEL_DROPPABLE });
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = stripDiacritics(query.trim());
    if (q === "") return alunos;
    return alunos.filter((a) => {
      const haystack = stripDiacritics(`${a.numero} ${a.nome}`);
      return haystack.includes(q);
    });
  }, [alunos, query]);

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "p-4 hidden lg:block transition-colors self-start sticky top-4",
        isOver && "border-primary bg-primary/5 ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <h4 className="font-semibold text-default-900 text-sm">
          Não posicionados
        </h4>
        <span
          className={cn(
            "inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-[11px] font-semibold transition-colors",
            alunos.length === 0
              ? "bg-default-200 text-default-600"
              : "bg-primary/15 text-primary",
          )}
        >
          {alunos.length}
        </span>
      </div>
      <p className="text-xs text-default-500 mb-3">
        Arraste para uma carteira ou clique numa carteira pra escolher.
      </p>

      {alunos.length === 0 ? (
        <div className="text-center py-8 px-3 rounded-md border border-dashed border-default-200">
          <p className="text-sm text-default-500">Todos posicionados.</p>
        </div>
      ) : (
        <>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-default-500 pointer-events-none" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou número..."
              className="pl-8 h-8 text-xs"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-xs text-default-500 text-center py-6">
              Nenhum aluno encontrado.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {filtered.map((a) => (
                <AlunoChip
                  key={a.id}
                  alunoId={a.id}
                  numero={a.numero}
                  nome={a.nome}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function AlunoChip({
  alunoId,
  numero,
  nome,
}: {
  alunoId: string;
  numero: number;
  nome: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${DRAGGABLE_PREFIX}${alunoId}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="group flex items-center gap-2 px-2 py-2 rounded-md border border-default-200 bg-card hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
    >
      <GripVertical className="w-3.5 h-3.5 text-default-300 group-hover:text-default-600 shrink-0 transition-colors" />
      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 ring-1 ring-primary/20">
        {numero}
      </span>
      <span className="text-xs font-medium text-default-900 truncate">
        {nome}
      </span>
    </div>
  );
}
