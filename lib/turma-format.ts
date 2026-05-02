export const NIVEL_LABEL: Record<string, string> = {
  FUNDAMENTAL: "Fundamental",
  FUNDAMENTAL_I: "Fundamental I",
  FUNDAMENTAL_II: "Fundamental II",
  MEDIO: "Médio",
};

export const TURNO_LABEL: Record<string, string> = {
  MATUTINO: "Matutino",
  VESPERTINO: "Vespertino",
  NOTURNO: "Noturno",
};

export const TURNOS = ["MATUTINO", "VESPERTINO", "NOTURNO"] as const;

export function bimestreNome(ordem: number) {
  return `${ordem}º Bimestre`;
}

export const BIMESTRES_FIXOS = [1, 2, 3, 4] as const;
