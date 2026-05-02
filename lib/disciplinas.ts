// Disciplinas oferecidas no Brasil — Fundamental I até Ensino Médio.
// Baseado na BNCC + componentes comuns das redes estaduais
// (incluindo itinerários do Novo Ensino Médio).

export interface DisciplinaGrupo {
  area: string;
  disciplinas: string[];
}

export const DISCIPLINAS_POR_AREA: DisciplinaGrupo[] = [
  {
    area: "Linguagens",
    disciplinas: [
      "Português",
      "Inglês",
      "Espanhol",
      "Francês",
      "Libras",
      "Arte",
      "Educação Física",
      "Literatura",
      "Redação",
    ],
  },
  {
    area: "Matemática",
    disciplinas: ["Matemática"],
  },
  {
    area: "Ciências da Natureza",
    disciplinas: ["Ciências", "Biologia", "Química", "Física"],
  },
  {
    area: "Ciências Humanas",
    disciplinas: [
      "História",
      "Geografia",
      "Filosofia",
      "Sociologia",
      "Ensino Religioso",
    ],
  },
  {
    area: "Tecnologia",
    disciplinas: ["Informática", "Tecnologia", "Robótica", "Computação"],
  },
  {
    area: "Itinerários e eletivas",
    disciplinas: [
      "Projeto de Vida",
      "Empreendedorismo",
      "Educação Financeira",
      "Pensamento Computacional",
      "Mundo do Trabalho",
      "Cultura Afro-brasileira",
      "Cultura Indígena",
      "Estudos Regionais",
    ],
  },
];

// Lista plana — usada para validação e ordenação alfabética se necessário.
export const DISCIPLINAS_LISTA: string[] = DISCIPLINAS_POR_AREA.flatMap(
  (g) => g.disciplinas,
);
