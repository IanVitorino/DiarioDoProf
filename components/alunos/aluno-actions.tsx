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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Loader2,
  Pencil,
  Trash,
  UserMinus,
  UserCheck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import {
  updateAluno,
  removeAluno,
  inativarAluno,
  reativarAluno,
} from "@/actions/alunos";
import { bimestreNome } from "@/lib/turma-format";

interface Aluno {
  id: string;
  nome: string;
  inativoApartirDeBimestre: number | null;
  motivoInativacao: string | null;
}

const NOME_REGEX = /^[A-Za-zÀ-ÿ\s'-]+$/;

const editSchema = z.object({
  nome: z
    .string()
    .min(1, "Nome é obrigatório")
    .regex(NOME_REGEX, "Nome só pode conter letras"),
});

type EditData = z.infer<typeof editSchema>;

export function AlunoActions({ aluno }: { aluno: Aluno }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [inativarOpen, setInativarOpen] = React.useState(false);
  const [reativarOpen, setReativarOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const isInativo = aluno.inativoApartirDeBimestre != null;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      nome: aluno.nome,
    },
  });

  // Estado do modal de inativar
  const [bimestre, setBimestre] = React.useState<string>("");
  const [motivo, setMotivo] = React.useState<string>("");

  const resetInativarForm = () => {
    setBimestre("");
    setMotivo("");
  };

  const onUpdate = (data: EditData) => {
    startTransition(async () => {
      try {
        await updateAluno(aluno.id, data);
        toast.success("Aluno atualizado");
        setEditOpen(false);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao atualizar");
      }
    });
  };

  const onRemove = () => {
    startTransition(async () => {
      try {
        await removeAluno(aluno.id);
        toast.success("Aluno excluído");
        setRemoveOpen(false);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao excluir");
      }
    });
  };

  const onInativar = () => {
    if (!bimestre) {
      toast.error("Escolha o bimestre");
      return;
    }
    const motivoFinal = motivo.trim() || null;

    startTransition(async () => {
      try {
        await inativarAluno(aluno.id, {
          bimestre: Number(bimestre),
          motivo: motivoFinal,
        });
        toast.success("Aluno inativado");
        setInativarOpen(false);
        resetInativarForm();
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao inativar");
      }
    });
  };

  const onReativar = () => {
    startTransition(async () => {
      try {
        await reativarAluno(aluno.id);
        toast.success("Aluno reativado");
        setReativarOpen(false);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao reativar");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </DropdownMenuItem>
          {isInativo ? (
            <>
              <DropdownMenuItem onSelect={() => setReativarOpen(true)}>
                <UserCheck className="w-4 h-4 mr-2" />
                Reativar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRemoveOpen(true)}
                className="text-destructive"
              >
                <Trash className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onSelect={() => setInativarOpen(true)}>
              <UserMinus className="w-4 h-4 mr-2" />
              Inativar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Editar */}
      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) reset({ nome: aluno.nome });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar aluno</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onUpdate)} className="space-y-4">
            <div>
              <Label htmlFor={`nome-${aluno.id}`}>Nome</Label>
              <Input
                id={`nome-${aluno.id}`}
                {...register("nome", {
                  onChange: (e) => {
                    const sanitized = e.target.value.replace(
                      /[^A-Za-zÀ-ÿ\s'-]/g,
                      "",
                    );
                    if (sanitized !== e.target.value) {
                      setValue("nome", sanitized);
                    }
                  },
                })}
              />
              {errors.nome && (
                <p className="text-destructive text-sm mt-1">{errors.nome.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inativar */}
      <Dialog
        open={inativarOpen}
        onOpenChange={(o) => {
          setInativarOpen(o);
          if (!o) resetInativarForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inativar aluno</DialogTitle>
            <p className="text-sm text-default-600 mt-1">
              <strong>{aluno.nome}</strong> deixará de contar nos cálculos a
              partir do bimestre escolhido. As notas anteriores são preservadas.
            </p>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!isPending && bimestre) onInativar();
            }}
            className="space-y-4"
          >
            <div>
              <Label className="mb-1.5 block">Inativo a partir de</Label>
              <Select value={bimestre} onValueChange={setBimestre}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o bimestre" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {bimestreNome(n)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-default-500 mt-1">
                Bimestres anteriores ao escolhido continuam contando normalmente.
              </p>
            </div>

            <div>
              <Label htmlFor={`motivo-${aluno.id}`} className="mb-1.5 block">
                Motivo (opcional)
              </Label>
              <Textarea
                id={`motivo-${aluno.id}`}
                placeholder="Ex: Transferido para outra escola"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isPending && bimestre) onInativar();
                  }
                }}
                maxLength={200}
                rows={2}
              />
              <p className="text-xs text-default-500 mt-1">
                Enter para confirmar · Shift+Enter pra quebrar linha.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInativarOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !bimestre}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Inativar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reativar */}
      <AlertDialog open={reativarOpen} onOpenChange={setReativarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reativar aluno</AlertDialogTitle>
            <AlertDialogDescription>
              Reativar <strong>{aluno.nome}</strong>? Ele volta a contar nas
              médias e a aparecer em novas atribuições. A carteira no mapa
              precisa ser reposicionada manualmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              color="default"
              variant="outline"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onReativar();
              }}
              disabled={isPending}
              color="primary"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Reativar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Excluir */}
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir <strong>{aluno.nome}</strong> permanentemente? Todas as
              notas, atribuições e participações em grupos serão apagadas. Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              color="default"
              variant="outline"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onRemove();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
