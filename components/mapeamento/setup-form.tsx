"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Grid3x3, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { criarMapeamento } from "@/actions/mapeamento";

interface Props {
  turmaId: string;
  totalAlunos: number;
}

export function SetupForm({ turmaId, totalAlunos }: Props) {
  const [linhas, setLinhas] = React.useState("");
  const [colunas, setColunas] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const numLinhas = Number(linhas);
  const numColunas = Number(colunas);
  const area =
    Number.isFinite(numLinhas) && Number.isFinite(numColunas) && linhas !== "" && colunas !== ""
      ? numLinhas * numColunas
      : 0;
  const insuficiente = area > 0 && area < totalAlunos;

  const sanitize = (v: string) =>
    v.replace(/[^1-9]/g, "").slice(0, 1);

  const handleSubmit = () => {
    if (linhas === "" || colunas === "") {
      toast.error("Preencha as linhas e colunas");
      return;
    }
    if (insuficiente) {
      toast.error(
        `Não é possível: ${area} carteiras < ${totalAlunos} alunos`,
      );
      return;
    }

    startTransition(async () => {
      try {
        await criarMapeamento(turmaId, {
          linhas: numLinhas,
          colunas: numColunas,
        });
        toast.success("Mapeamento criado");
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao criar");
      }
    });
  };

  return (
    <Card className="p-8 max-w-xl mx-auto">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Grid3x3 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-default-900 mb-1">
          Configure o mapeamento da sala
        </h2>
        <p className="text-sm text-default-600 max-w-md">
          Defina as dimensões do grid de carteiras (linhas × colunas) que
          representam a disposição física da sala. Depois você posiciona cada
          aluno em uma carteira.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <Label htmlFor="linhas">Linhas</Label>
          <Input
            id="linhas"
            type="text"
            inputMode="numeric"
            maxLength={1}
            placeholder="Ex: 5"
            value={linhas}
            onChange={(e) => setLinhas(sanitize(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="colunas">Colunas</Label>
          <Input
            id="colunas"
            type="text"
            inputMode="numeric"
            maxLength={1}
            placeholder="Ex: 6"
            value={colunas}
            onChange={(e) => setColunas(sanitize(e.target.value))}
          />
        </div>
      </div>

      {area > 0 && (
        <div
          className={`text-sm mb-4 p-3 rounded-md border ${
            insuficiente
              ? "border-destructive/40 bg-destructive/5 text-destructive"
              : "border-default-200 bg-default-50/40 text-default-700"
          }`}
        >
          {insuficiente ? (
            <>
              ⚠ Esse grid tem <strong>{area} carteiras</strong> mas a turma tem{" "}
              <strong>{totalAlunos} alunos</strong>. Aumente as dimensões.
            </>
          ) : (
            <>
              Esse grid terá <strong>{area} carteiras</strong> para os{" "}
              <strong>{totalAlunos} alunos</strong> da turma.
              {area > totalAlunos && (
                <span className="text-default-500">
                  {" "}
                  ({area - totalAlunos} sobrarão vazias.)
                </span>
              )}
            </>
          )}
        </div>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={pending || insuficiente || !linhas || !colunas}
        className="w-full"
      >
        {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Criar mapeamento
      </Button>

      <p className="text-xs text-default-500 mt-4 text-center">
        Você pode mudar as dimensões depois. Os valores aceitos são de 1 a 9
        para cada lado.
      </p>
    </Card>
  );
}
