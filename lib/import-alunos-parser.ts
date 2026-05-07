import * as XLSX from "xlsx";

const NOME_VALIDO = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'-]*$/;

export interface ParsedSheet {
  /** Cabeçalhos de cada coluna (índice = posição). Quando primeira linha é cabeçalho, vem o valor dela; senão é "Coluna 1", "Coluna 2"... */
  headers: string[];
  /** Linhas como arrays de strings (cells), sem o cabeçalho. */
  rows: string[][];
}

export async function parseFile(file: File): Promise<ParsedSheet> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [] };
  }
  const sheet = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  const matrix = (aoa as unknown[][]).map((row) =>
    row.map((cell) => (cell == null ? "" : String(cell).trim())),
  );

  const ncols = matrix.reduce((m, r) => Math.max(m, r.length), 0);
  const normalized = matrix.map((r) => {
    const padded = [...r];
    while (padded.length < ncols) padded.push("");
    return padded;
  });

  const headers = Array.from({ length: ncols }, (_, i) => `Coluna ${i + 1}`);
  return { headers, rows: normalized };
}

export interface ColunaPreview {
  index: number;
  /** Nome inferido (cabeçalho da primeira linha, se for o caso) ou "Coluna N". */
  label: string;
  /** Pequena amostra dos primeiros valores não-vazios da coluna. */
  amostra: string[];
}

/** Gera previews de cada coluna pra UI escolher qual é o nome. */
export function colunasPreview(
  sheet: ParsedSheet,
  primeiraLinhaCabecalho: boolean,
): ColunaPreview[] {
  const dataStart = primeiraLinhaCabecalho ? 1 : 0;
  return sheet.headers.map((_, i) => {
    const label =
      primeiraLinhaCabecalho && sheet.rows[0]?.[i]
        ? sheet.rows[0][i]
        : `Coluna ${i + 1}`;
    const amostra = sheet.rows
      .slice(dataStart)
      .map((r) => r[i])
      .filter((v) => v && v.trim() !== "")
      .slice(0, 3);
    return { index: i, label, amostra };
  });
}

export interface ValidationResult {
  validos: string[];
  invalidos: string[];
}

/** Aplica filtro: só letras, acentos, espaços, hífens e apóstrofos. */
export function validarNomes(
  sheet: ParsedSheet,
  colunaIndex: number,
  primeiraLinhaCabecalho: boolean,
): ValidationResult {
  const dataStart = primeiraLinhaCabecalho ? 1 : 0;
  const validos: string[] = [];
  const invalidos: string[] = [];

  for (let i = dataStart; i < sheet.rows.length; i++) {
    const raw = sheet.rows[i][colunaIndex] ?? "";
    const trimmed = raw.trim().replace(/\s+/g, " ");
    if (trimmed === "") continue;

    if (NOME_VALIDO.test(trimmed)) {
      validos.push(trimmed);
    } else {
      invalidos.push(trimmed);
    }
  }
  return { validos, invalidos };
}
