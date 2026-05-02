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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Loader2, Pencil, Trash } from "lucide-react";
import toast from "react-hot-toast";
import { updateAluno, removeAluno } from "@/actions/alunos";

interface Aluno {
  id: string;
  nome: string;
}

const NOME_REGEX = /^[A-Za-zÀ-ÿ\s'-]+$/;

const schema = z.object({
  nome: z
    .string()
    .min(1, "Nome é obrigatório")
    .regex(NOME_REGEX, "Nome só pode conter letras"),
});

type FormData = z.infer<typeof schema>;

export function AlunoActions({ aluno }: { aluno: Aluno }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: aluno.nome,
    },
  });

  const onUpdate = (data: FormData) => {
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
        toast.success("Aluno removido");
        setRemoveOpen(false);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao remover");
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
          <DropdownMenuItem
            onSelect={() => setRemoveOpen(true)}
            className="text-destructive"
          >
            <Trash className="w-4 h-4 mr-2" />
            Remover
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover aluno</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{aluno.nome}</strong>?
              Todas as notas vinculadas serão apagadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onRemove();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
