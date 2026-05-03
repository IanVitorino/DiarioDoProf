"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
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
import { ArrowRight, CalendarX2, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { createAtividade } from "@/actions/atividades";
import { dbDateToLocalDate } from "@/lib/dates";
import { MaskedDatePicker } from "@/components/ui/masked-date-picker";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  valorMaximo: z.coerce.number().positive("Valor máximo deve ser maior que 0"),
  data: z.string().optional(),
  tipo: z.enum(["INDIVIDUAL", "GRUPO"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  periodoId: string;
  periodoNome: string;
  modo: "MEDIA" | "SOMA";
  dataInicio: Date | null;
  dataFim: Date | null;
  turmaId: string;
}

export function NovaAtividadeButton({
  periodoId,
  periodoNome,
  modo,
  dataInicio,
  dataFim,
  turmaId,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const hasVigencia = dataInicio !== null && dataFim !== null;

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", valorMaximo: 10, data: "", tipo: "INDIVIDUAL" },
  });

  const tipo = watch("tipo");

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        const payload = {
          ...data,
          valorMaximo: modo === "MEDIA" ? 10 : data.valorMaximo,
          periodoId,
        };
        await createAtividade(payload);
        toast.success("Atividade criada");
        reset();
        setOpen(false);
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao criar atividade");
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
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Nova atividade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!hasVigencia ? (
          <VigenciaWarning
            periodoNome={periodoNome}
            turmaId={turmaId}
            onCancel={() => setOpen(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Nova atividade · {periodoNome}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  {...register("nome")}
                  placeholder="Ex: Prova mensal"
                />
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
                      minDate={dbDateToLocalDate(dataInicio)}
                      maxDate={dbDateToLocalDate(dataFim)}
                    />
                  )}
                />
              </div>

              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={tipo}
                  onValueChange={(v: "INDIVIDUAL" | "GRUPO") =>
                    setValue("tipo", v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="GRUPO">Em grupo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {modo === "SOMA" ? (
                <div>
                  <Label htmlFor="valorMaximo">Peso (valor máximo)</Label>
                  <Input
                    id="valorMaximo"
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
                  No modo Média, todas as atividades valem 10.
                </p>
              )}

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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function VigenciaWarning({
  periodoNome,
  turmaId,
  onCancel,
}: {
  periodoNome: string;
  turmaId: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center pt-4 pb-2">
      <div className="rounded-full bg-amber-100 dark:bg-amber-500/15 p-4 mb-4">
        <CalendarX2 className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>
      <DialogTitle className="text-lg font-semibold mb-2">
        Configure a vigência primeiro
      </DialogTitle>
      <p className="text-sm text-default-600 mb-6 max-w-xs leading-relaxed">
        Para criar atividades no{" "}
        <span className="font-semibold text-default-900">{periodoNome}</span>,
        defina antes as datas de início e fim na aba Períodos.
      </p>
      <div className="flex gap-2 w-full">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button asChild className="flex-1">
          <Link href={`/turmas/${turmaId}/periodos`}>
            Configurar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
