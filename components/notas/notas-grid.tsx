"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { setNota } from "@/actions/notas";

interface Aluno {
  id: string;
  nome: string;
}

interface Atividade {
  id: string;
  nome: string;
  valorMaximo: number;
  tipoAtribuicao?: "TODOS" | "SELECIONADOS";
  alunosAtribuidos?: string[];
}

interface Nota {
  id: string;
  valor: number;
  alunoId: string;
  atividadeId: string;
}

type Modo = "MEDIA" | "SOMA";

interface Props {
  alunos: Aluno[];
  atividades: Atividade[];
  notas: Nota[];
  modoCalculo: Modo;
}

const cellKey = (alunoId: string, atividadeId: string) =>
  `${alunoId}_${atividadeId}`;

const VALID_INPUT = /^$|^\d+([.,]\d?)?$/;

function parseNota(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const num = parseFloat(trimmed.replace(",", "."));
  if (Number.isNaN(num)) return null;
  return Math.round(num * 10) / 10;
}

function effectiveCap(modo: Modo, atividade: Atividade): number {
  return modo === "MEDIA" ? 10 : atividade.valorMaximo;
}

function alunoFaz(atividade: Atividade, alunoId: string): boolean {
  if (!atividade.tipoAtribuicao || atividade.tipoAtribuicao === "TODOS") {
    return true;
  }
  return (atividade.alunosAtribuidos ?? []).includes(alunoId);
}

export function NotasGrid({ alunos, atividades, notas, modoCalculo }: Props) {
  const initialValues = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of notas) {
      map[cellKey(n.alunoId, n.atividadeId)] = String(n.valor);
    }
    return map;
  }, [notas]);

  const [values, setValues] = React.useState<Record<string, string>>(initialValues);
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  if (atividades.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-default-700 mb-2 text-lg font-medium">
          Sem atividades neste bimestre
        </p>
        <p className="text-sm text-default-500">
          Crie atividades na aba <strong>Atividades</strong> da turma.
        </p>
      </Card>
    );
  }

  const handleChange = (key: string, raw: string, cap: number) => {
    if (!VALID_INPUT.test(raw)) return;
    if (raw !== "") {
      const parsed = parseNota(raw);
      if (parsed !== null && parsed > cap) return;
    }
    setValues((v) => ({ ...v, [key]: raw }));
  };

  const handleBlur = async (
    alunoId: string,
    atividadeId: string,
    cap: number
  ) => {
    const key = cellKey(alunoId, atividadeId);
    const raw = values[key] ?? "";
    const initial = initialValues[key] ?? "";
    if (raw === initial) return;

    const parsed = parseNota(raw);
    if (parsed !== null && (parsed < 0 || parsed > cap)) {
      toast.error(`Nota deve estar entre 0 e ${cap}`);
      setValues((v) => ({ ...v, [key]: initial }));
      return;
    }

    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await setNota(alunoId, atividadeId, parsed);
      setValues((v) => ({ ...v, [key]: parsed === null ? "" : String(parsed) }));
    } catch (err) {
      toast.error((err as Error)?.message ?? "Erro ao salvar nota");
      setValues((v) => ({ ...v, [key]: initial }));
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  // MEDIA: simple average (cap efetivo = 10) → final 0–10
  // SOMA: sum, capped at 10 for display
  const calcularResultado = (alunoId: string): string => {
    const ativsDoAluno = atividades.filter((a) => alunoFaz(a, alunoId));
    if (ativsDoAluno.length === 0) return "—";

    if (modoCalculo === "SOMA") {
      let sum = 0;
      for (const a of ativsDoAluno) {
        const raw = values[cellKey(alunoId, a.id)] ?? "";
        sum += parseNota(raw) ?? 0;
      }
      return Math.min(sum, 10).toFixed(1);
    }

    // MEDIA
    let totalValor = 0;
    for (const a of ativsDoAluno) {
      const raw = values[cellKey(alunoId, a.id)] ?? "";
      const num = parseNota(raw) ?? 0;
      totalValor += num;
    }
    return (totalValor / ativsDoAluno.length).toFixed(1);
  };

  const colunaFinalLabel = modoCalculo === "SOMA" ? "Total" : "Média";

  return (
    <>
      {/* Desktop: tabela completa */}
      <Card className="p-0 overflow-x-auto hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Nº</TableHead>
              <TableHead className="min-w-[180px]">Aluno</TableHead>
              {atividades.map((a) => {
                const cap = effectiveCap(modoCalculo, a);
                return (
                  <TableHead key={a.id} className="text-center min-w-[120px]">
                    <div className="flex flex-col items-center leading-tight">
                      <span>{a.nome}</span>
                      <span className="text-xs text-default-500 font-normal">
                        Nota máxima: {cap}
                      </span>
                    </div>
                  </TableHead>
                );
              })}
              <TableHead className="text-center w-24 bg-default-50 dark:bg-default-100/50">
                {colunaFinalLabel}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.map((aluno, i) => (
              <TableRow key={aluno.id}>
                <TableCell className="text-default-600">{i + 1}</TableCell>
                <TableCell className="font-medium">{aluno.nome}</TableCell>
                {atividades.map((a) => {
                  const key = cellKey(aluno.id, a.id);
                  const isSaving = !!saving[key];
                  const cap = effectiveCap(modoCalculo, a);
                  const naoAtribuido = !alunoFaz(a, aluno.id);
                  return (
                    <TableCell key={a.id} className="p-2">
                      <div
                        className="relative"
                        title={
                          naoAtribuido
                            ? "Esta atividade não foi atribuída ao aluno"
                            : undefined
                        }
                      >
                        <Input
                          value={values[key] ?? ""}
                          onChange={(e) =>
                            handleChange(key, e.target.value, cap)
                          }
                          onBlur={() =>
                            !naoAtribuido && handleBlur(aluno.id, a.id, cap)
                          }
                          type="text"
                          inputMode="decimal"
                          placeholder={naoAtribuido ? "—" : "—"}
                          className={
                            naoAtribuido
                              ? "text-center bg-default-100 text-default-400 cursor-not-allowed"
                              : "text-center"
                          }
                          disabled={isSaving || naoAtribuido}
                          readOnly={naoAtribuido}
                        />
                        {isSaving && (
                          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-default-400" />
                        )}
                      </div>
                    </TableCell>
                  );
                })}
                <TableCell className="text-center font-semibold bg-default-50 dark:bg-default-100/50">
                  {calcularResultado(aluno.id)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile: uma atividade por vez */}
      <div className="md:hidden">
        <NotasGridMobile
          alunos={alunos}
          atividades={atividades}
          modoCalculo={modoCalculo}
          values={values}
          saving={saving}
          handleChange={handleChange}
          handleBlur={handleBlur}
          calcularResultado={calcularResultado}
          colunaFinalLabel={colunaFinalLabel}
        />
      </div>
    </>
  );
}

interface MobileProps {
  alunos: Aluno[];
  atividades: Atividade[];
  modoCalculo: Modo;
  values: Record<string, string>;
  saving: Record<string, boolean>;
  handleChange: (key: string, raw: string, cap: number) => void;
  handleBlur: (alunoId: string, atividadeId: string, cap: number) => void;
  calcularResultado: (alunoId: string) => string;
  colunaFinalLabel: string;
}

function NotasGridMobile({
  alunos,
  atividades,
  modoCalculo,
  values,
  saving,
  handleChange,
  handleBlur,
  calcularResultado,
  colunaFinalLabel,
}: MobileProps) {
  const [atividadeId, setAtividadeId] = React.useState<string>(
    atividades[0]?.id ?? "",
  );

  // Garante que se a lista de atividades muda, o id selecionado continue válido
  React.useEffect(() => {
    if (!atividades.some((a) => a.id === atividadeId)) {
      setAtividadeId(atividades[0]?.id ?? "");
    }
  }, [atividades, atividadeId]);

  const atividade = atividades.find((a) => a.id === atividadeId) ?? null;
  const cap = atividade ? effectiveCap(modoCalculo, atividade) : 0;
  const lancadas = atividade
    ? alunos.filter((al) => {
        if (!alunoFaz(atividade, al.id)) return false;
        const raw = values[cellKey(al.id, atividade.id)] ?? "";
        return raw !== "";
      }).length
    : 0;
  const totalAtribuidos = atividade
    ? alunos.filter((al) => alunoFaz(atividade, al.id)).length
    : 0;

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 space-y-3 border-b border-default-200">
        <div>
          <Label className="mb-1.5 block">Atividade</Label>
          <Select value={atividadeId} onValueChange={setAtividadeId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma atividade" />
            </SelectTrigger>
            <SelectContent>
              {atividades.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {atividade && (
          <div className="flex items-center justify-between text-xs text-default-600">
            <span>
              Nota máxima:{" "}
              <span className="font-semibold text-default-900">{cap}</span>
            </span>
            <span>
              {lancadas} / {totalAtribuidos} lançadas
            </span>
          </div>
        )}
      </div>

      {atividade == null ? (
        <p className="p-6 text-sm text-default-500 text-center">
          Selecione uma atividade pra começar.
        </p>
      ) : (
        <div className="divide-y divide-default-200">
          {alunos.map((aluno, i) => {
            const key = cellKey(aluno.id, atividade.id);
            const isSaving = !!saving[key];
            const naoAtribuido = !alunoFaz(atividade, aluno.id);
            const resultado = calcularResultado(aluno.id);
            return (
              <div
                key={aluno.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="text-sm text-default-500 w-6 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-default-900 truncate">
                    {aluno.nome}
                  </div>
                  <div className="text-[11px] text-default-500 mt-0.5">
                    {colunaFinalLabel}:{" "}
                    <span className="font-semibold text-default-700">
                      {resultado}
                    </span>
                  </div>
                </div>
                <div className="relative w-20 shrink-0">
                  <Input
                    value={values[key] ?? ""}
                    onChange={(e) => handleChange(key, e.target.value, cap)}
                    onBlur={() =>
                      !naoAtribuido && handleBlur(aluno.id, atividade.id, cap)
                    }
                    type="text"
                    inputMode="decimal"
                    placeholder="—"
                    className={
                      naoAtribuido
                        ? "text-center bg-default-100 text-default-400 cursor-not-allowed h-9"
                        : "text-center h-9"
                    }
                    disabled={isSaving || naoAtribuido}
                    readOnly={naoAtribuido}
                    title={
                      naoAtribuido
                        ? "Atividade não atribuída a este aluno"
                        : undefined
                    }
                  />
                  {isSaving && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-default-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
