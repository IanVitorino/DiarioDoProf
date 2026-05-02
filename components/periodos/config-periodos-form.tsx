"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { updatePeriodosVigencia } from "@/actions/periodos";
import { bimestreNome } from "@/lib/turma-format";
import { dbToIsoString } from "@/lib/dates";
import { MaskedDatePicker } from "@/components/ui/masked-date-picker";

interface Periodo {
  id: string;
  ordem: number;
  dataInicio: Date | null;
  dataFim: Date | null;
}

interface FormBimestre {
  dataInicio: string;
  dataFim: string;
}

interface FormData {
  bimestres: FormBimestre[];
}

interface Props {
  turmaId: string;
  periodos: Periodo[];
}

export function ConfigPeriodosForm({ turmaId, periodos }: Props) {
  const [isPending, startTransition] = React.useTransition();

  const { handleSubmit, control } = useForm<FormData>({
    defaultValues: {
      bimestres: periodos.map((p) => ({
        dataInicio: dbToIsoString(p.dataInicio),
        dataFim: dbToIsoString(p.dataFim),
      })),
    },
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      bimestres: periodos.map((p, i) => ({
        id: p.id,
        dataInicio: data.bimestres[i]?.dataInicio || "",
        dataFim: data.bimestres[i]?.dataFim || "",
      })),
    };
    startTransition(async () => {
      try {
        await updatePeriodosVigencia(turmaId, payload);
        toast.success("Vigências salvas");
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao salvar");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-default-600">
        Configure as datas de início e fim de cada bimestre. Campos em branco indicam vigência ainda não definida.
      </p>

      {periodos.map((p, idx) => (
        <Card key={p.id} className="p-5">
          <h3 className="font-semibold text-default-900 mb-4">
            {bimestreNome(p.ordem)}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`inicio-${p.id}`}>Início</Label>
              <Controller
                control={control}
                name={`bimestres.${idx}.dataInicio`}
                render={({ field }) => (
                  <MaskedDatePicker
                    id={`inicio-${p.id}`}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <Label htmlFor={`fim-${p.id}`}>Fim</Label>
              <Controller
                control={control}
                name={`bimestres.${idx}.dataFim`}
                render={({ field }) => (
                  <MaskedDatePicker
                    id={`fim-${p.id}`}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>
    </form>
  );
}
