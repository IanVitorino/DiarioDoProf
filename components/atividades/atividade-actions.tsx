"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaskedDatePicker } from "@/components/ui/masked-date-picker";
import { dbDateToLocalDate, dbToIsoString } from "@/lib/dates";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { updateAtividade, removeAtividade } from "@/actions/atividades";

interface Atividade {
  id: string;
  nome: string;
  valorMaximo: number;
  periodoId: string;
  data: Date | null;
}

interface PeriodoOption {
  id: string;
  nome: string;
  modo: "MEDIA" | "SOMA";
  dataInicio: Date | null;
  dataFim: Date | null;
}

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  valorMaximo: z.coerce.number().positive("Valor máximo deve ser maior que 0"),
  periodoId: z.string().min(1),
  data: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  atividade: Atividade;
  periodos: PeriodoOption[];
}

export function AtividadeActions({ atividade, periodos }: Props) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const initialValues: FormData = {
    nome: atividade.nome,
    valorMaximo: atividade.valorMaximo,
    periodoId: atividade.periodoId,
    data: dbToIsoString(atividade.data),
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  const periodoId = watch("periodoId");
  const periodoSelecionado = periodos.find((p) => p.id === periodoId);
  const modoSelecionado = periodoSelecionado?.modo ?? "MEDIA";
  const minDate = dbDateToLocalDate(periodoSelecionado?.dataInicio);
  const maxDate = dbDateToLocalDate(periodoSelecionado?.dataFim);

  const onUpdate = (data: FormData) => {
    startTransition(async () => {
      try {
        // Em modo MEDIA do bimestre destino, força valorMaximo = 10
        const payload = {
          ...data,
          valorMaximo: modoSelecionado === "MEDIA" ? 10 : data.valorMaximo,
        };
        await updateAtividade(atividade.id, payload);
        toast.success("Atividade atualizada");
        setEditOpen(false);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao atualizar");
      }
    });
  };

  const onRemove = () => {
    startTransition(async () => {
      try {
        await removeAtividade(atividade.id);
        toast.success("Atividade removida");
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
          if (!o) reset(initialValues);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar atividade</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onUpdate)} className="space-y-4">
            <div>
              <Label htmlFor={`nome-${atividade.id}`}>Nome</Label>
              <Input id={`nome-${atividade.id}`} {...register("nome")} />
              {errors.nome && (
                <p className="text-destructive text-sm mt-1">{errors.nome.message}</p>
              )}
            </div>
            <div>
              <Label>Data da atividade (opcional)</Label>
              <Controller
                control={control}
                name="data"
                render={({ field }) => (
                  <MaskedDatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    staticPosition
                    minDate={minDate}
                    maxDate={maxDate}
                  />
                )}
              />
            </div>
            {modoSelecionado === "SOMA" ? (
              <div>
                <Label htmlFor={`valorMaximo-${atividade.id}`}>Peso (valor máximo)</Label>
                <Input
                  id={`valorMaximo-${atividade.id}`}
                  type="number"
                  step="0.1"
                  {...register("valorMaximo")}
                />
                {errors.valorMaximo && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.valorMaximo.message}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-default-500">
                No modo Média do bimestre selecionado, todas as atividades valem 10.
              </p>
            )}
            <div>
              <Label>Período</Label>
              <Select
                value={periodoId}
                onValueChange={(v) => setValue("periodoId", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <AlertDialogTitle>Remover atividade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{atividade.nome}</strong>?
              Todas as notas dessa atividade serão apagadas.
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
