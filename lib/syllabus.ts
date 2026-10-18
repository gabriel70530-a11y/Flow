export type AreaId = "mat" | "lin" | "nat" | "hum" | "red";

export interface Area {
  id: AreaId;
  name: string;
}

// O app só traz as cinco áreas do ENEM. Os tópicos de cada uma o estudante cria do jeito dele.
export const AREAS: readonly Area[] = [
  { id: "mat", name: "Matemática" },
  { id: "lin", name: "Linguagens" },
  { id: "nat", name: "Ciências da Natureza" },
  { id: "hum", name: "Ciências Humanas" },
  { id: "red", name: "Redação" },
];

export function findArea(id: AreaId): Area {
  return AREAS.find((area) => area.id === id) ?? AREAS[0];
}
