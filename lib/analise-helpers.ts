// Funções puras de cálculo usadas pelo dashboard de Análise.

export interface AtividadeMin {
  id: string;
  valorMaximo: number;
  periodoId: string;
  /**
   * "TODOS"        → todos os alunos da turma fazem.
   * "SELECIONADOS" → apenas os alunos em `alunosAtribuidos` fazem.
   */
  tipoAtribuicao?: "TODOS" | "SELECIONADOS";
  alunosAtribuidos?: string[];
}

export interface NotaMin {
  alunoId: string;
  atividadeId: string;
  valor: number;
}

export interface PeriodoMin {
  id: string;
  ordem: number;
  modoCalculo: "MEDIA" | "SOMA";
}

/** True se a atividade conta para o aluno (default: TODOS). */
export function alunoFazAtividade(atividade: AtividadeMin, alunoId: string) {
  if (!atividade.tipoAtribuicao || atividade.tipoAtribuicao === "TODOS") {
    return true;
  }
  return (atividade.alunosAtribuidos ?? []).includes(alunoId);
}

/**
 * Média de um aluno num bimestre específico (sempre 0-10).
 * Retorna `null` se o aluno não tem nenhuma atividade atribuída no bimestre.
 * Vazio (sem nota lançada) conta como 0.
 *
 * - Modo MEDIA: average simples das notas (cap efetivo 10 por célula).
 * - Modo SOMA: soma das notas, com teto em 10.
 */
export function mediaBimestre(
  alunoId: string,
  periodo: PeriodoMin,
  atividades: AtividadeMin[],
  notas: NotaMin[]
): number | null {
  const ativsDoAluno = atividades.filter(
    (a) => a.periodoId === periodo.id && alunoFazAtividade(a, alunoId),
  );
  if (ativsDoAluno.length === 0) return null;

  if (periodo.modoCalculo === "SOMA") {
    let sum = 0;
    for (const a of ativsDoAluno) {
      const nota = notas.find(
        (n) => n.alunoId === alunoId && n.atividadeId === a.id
      );
      sum += nota?.valor ?? 0;
    }
    return Math.min(sum, 10);
  }

  // MEDIA: average simples
  let totalValor = 0;
  for (const a of ativsDoAluno) {
    const nota = notas.find(
      (n) => n.alunoId === alunoId && n.atividadeId === a.id
    );
    totalValor += nota?.valor ?? 0;
  }
  return totalValor / ativsDoAluno.length;
}

/**
 * Média anual: média das médias dos bimestres que têm atividades atribuídas ao aluno.
 * Retorna `null` se nenhum bimestre tem atividades pra ele.
 */
export function mediaAnual(
  alunoId: string,
  periodos: PeriodoMin[],
  atividades: AtividadeMin[],
  notas: NotaMin[]
): number | null {
  const medias: number[] = [];
  for (const p of periodos) {
    const m = mediaBimestre(alunoId, p, atividades, notas);
    if (m !== null) medias.push(m);
  }
  if (medias.length === 0) return null;
  return medias.reduce((s, m) => s + m, 0) / medias.length;
}
