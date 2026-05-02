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
import { Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { createAluno } from "@/actions/alunos";

const NOME_REGEX = /^[A-Za-zÀ-ÿ\s'-]+$/;

const schema = z.object({
  nome: z
    .string()
    .min(1, "Nome é obrigatório")
    .regex(NOME_REGEX, "Nome só pode conter letras"),
});

type FormData = z.infer<typeof schema>;

export function NovoAlunoButton({ turmaId }: { turmaId: string }) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "" },
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        await createAluno(turmaId, data);
        toast.success("Aluno adicionado");
        reset();
        setOpen(false);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao adicionar aluno");
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
          Adicionar aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo aluno</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Ex: Maria Silva"
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
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
