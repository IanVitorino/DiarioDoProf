"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { importarAlunos } from "@/actions/alunos";
import {
  parseFile,
  colunasPreview,
  validarNomes,
  type ParsedSheet,
} from "@/lib/import-alunos-parser";

type Step = "upload" | "mapear" | "preview";

const ACCEPT = ".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";

export function ImportarAlunosButton({ turmaId }: { turmaId: string }) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("upload");
  const [pending, startTransition] = React.useTransition();
  const [parsing, setParsing] = React.useState(false);
  const [fileName, setFileName] = React.useState<string>("");
  const [sheet, setSheet] = React.useState<ParsedSheet | null>(null);
  const [primeiraLinhaCabecalho, setPrimeiraLinhaCabecalho] =
    React.useState(true);
  const [colunaIndex, setColunaIndex] = React.useState<string>("");
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setFileName("");
    setSheet(null);
    setPrimeiraLinhaCabecalho(true);
    setColunaIndex("");
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const parsed = await parseFile(file);
      if (parsed.rows.length === 0) {
        toast.error("Arquivo vazio ou ilegível");
        return;
      }
      setFileName(file.name);
      setSheet(parsed);
      setColunaIndex("");
      setStep("mapear");
    } catch {
      toast.error("Não foi possível ler esse arquivo");
    } finally {
      setParsing(false);
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) await handleFile(f);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) await handleFile(f);
  };

  const colunas = React.useMemo(
    () => (sheet ? colunasPreview(sheet, primeiraLinhaCabecalho) : []),
    [sheet, primeiraLinhaCabecalho],
  );

  const validation = React.useMemo(() => {
    if (!sheet || colunaIndex === "") return null;
    return validarNomes(sheet, Number(colunaIndex), primeiraLinhaCabecalho);
  }, [sheet, colunaIndex, primeiraLinhaCabecalho]);

  const onConfirmImport = () => {
    if (!validation || validation.validos.length === 0) return;
    startTransition(async () => {
      try {
        const res = await importarAlunos(turmaId, {
          nomes: validation.validos,
        });
        const partes: string[] = [];
        if (res.inseridos > 0) {
          partes.push(
            `${res.inseridos} aluno${res.inseridos === 1 ? "" : "s"} importado${
              res.inseridos === 1 ? "" : "s"
            }`,
          );
        }
        if (res.duplicados > 0) {
          partes.push(
            `${res.duplicados} duplicado${res.duplicados === 1 ? "" : "s"} ignorado${
              res.duplicados === 1 ? "" : "s"
            }`,
          );
        }
        toast.success(partes.length > 0 ? partes.join(" · ") : "Nada novo importado");
        setOpen(false);
        reset();
      } catch (err) {
        toast.error((err as Error)?.message ?? "Erro ao importar");
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        Importar
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          {step === "upload" && (
            <>
              <DialogHeader>
                <DialogTitle>Importar alunos</DialogTitle>
                <p className="text-sm text-default-600 mt-1">
                  Envie uma planilha (.xlsx, .xls ou .csv). No próximo passo
                  você escolhe qual coluna tem os nomes.
                </p>
              </DialogHeader>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-12 px-6 cursor-pointer transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-default-300 hover:border-primary hover:bg-default-50/40"
                }`}
              >
                <div className="rounded-full bg-primary/10 p-3">
                  <FileSpreadsheet className="w-7 h-7 text-primary" />
                </div>
                {parsing ? (
                  <p className="text-sm text-default-600 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Lendo arquivo...
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-default-700">
                      <span className="font-medium text-primary">
                        Clique pra escolher
                      </span>{" "}
                      ou arraste um arquivo aqui
                    </p>
                    <p className="text-xs text-default-500">
                      .xlsx, .xls, .csv
                    </p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={onPickFile}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancelar
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "mapear" && sheet && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setStep("upload");
                      setSheet(null);
                      setColunaIndex("");
                    }}
                    className="h-8 w-8 -ml-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <DialogTitle>Escolha a coluna do nome</DialogTitle>
                </div>
                <p className="text-sm text-default-600 mt-1 truncate">
                  {fileName} · {sheet.rows.length} linha
                  {sheet.rows.length === 1 ? "" : "s"}
                </p>
              </DialogHeader>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={primeiraLinhaCabecalho}
                    onCheckedChange={(c) =>
                      setPrimeiraLinhaCabecalho(c === true)
                    }
                  />
                  <span className="text-sm text-default-800">
                    A primeira linha é cabeçalho
                  </span>
                </label>

                <div>
                  <Label className="mb-1.5 block">Coluna do nome</Label>
                  <Select value={colunaIndex} onValueChange={setColunaIndex}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione qual coluna tem os nomes" />
                    </SelectTrigger>
                    <SelectContent>
                      {colunas.map((c) => (
                        <SelectItem key={c.index} value={String(c.index)}>
                          {c.label}
                          {c.amostra.length > 0 && (
                            <span className="text-default-500 ml-2 text-xs">
                              · {c.amostra.join(", ")}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-default-500 mt-1">
                    Linhas com números ou caracteres especiais no nome são
                    ignoradas automaticamente.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep("preview")}
                  disabled={colunaIndex === ""}
                >
                  Avançar
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "preview" && validation && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setStep("mapear")}
                    className="h-8 w-8 -ml-2"
                    disabled={pending}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <DialogTitle>Confira antes de importar</DialogTitle>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-default-200 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Válidos
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-default-900 mt-1">
                    {validation.validos.length}
                  </div>
                </div>
                <div className="rounded-md border border-default-200 bg-default-100/40 p-3">
                  <div className="flex items-center gap-2 text-default-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Ignorados
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-default-900 mt-1">
                    {validation.invalidos.length}
                  </div>
                </div>
              </div>

              {validation.validos.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-default-700 mb-1.5">
                    Serão importados:
                  </p>
                  <div className="max-h-44 overflow-y-auto rounded-md border border-default-200 divide-y divide-default-200 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {validation.validos.map((nome, i) => (
                      <div
                        key={`${nome}-${i}`}
                        className="px-3 py-1.5 text-sm text-default-800 truncate"
                      >
                        {nome}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-default-600">
                  Nenhum nome válido encontrado nessa coluna. Volte e escolha
                  outra.
                </p>
              )}

              {validation.invalidos.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-default-600 hover:text-default-900">
                    Ver linhas ignoradas ({validation.invalidos.length})
                  </summary>
                  <div className="mt-2 max-h-32 overflow-y-auto rounded-md border border-default-200 divide-y divide-default-200 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {validation.invalidos.map((v, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 text-xs text-default-500 truncate"
                      >
                        {v}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={pending}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={onConfirmImport}
                  disabled={pending || validation.validos.length === 0}
                >
                  {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Importar {validation.validos.length}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
