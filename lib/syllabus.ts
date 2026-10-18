export type AreaId = "mat" | "lin" | "nat" | "hum" | "red";
export type SubjectId = "qui" | "fis" | "bio" | "geo" | "his" | "fil" | "soc";

export interface Area {
  id: AreaId;
  name: string;
  // Nome curto para filtros e listas apertadas.
  shortName: string;
}

export interface Subject {
  id: SubjectId;
  areaId: AreaId;
  name: string;
}

// O app só traz as cinco áreas do ENEM. Os tópicos de cada uma o estudante cria do jeito dele.
export const AREAS: readonly Area[] = [
  { id: "mat", name: "Matemática", shortName: "Matemática" },
  { id: "lin", name: "Linguagens", shortName: "Linguagens" },
  { id: "nat", name: "Ciências da Natureza", shortName: "Natureza" },
  { id: "hum", name: "Ciências Humanas", shortName: "Humanas" },
  { id: "red", name: "Redação", shortName: "Redação" },
];

// Natureza e Humanas se dividem em matérias; todo tópico dessas áreas pertence a uma delas.
export const SUBJECTS: readonly Subject[] = [
  { id: "qui", areaId: "nat", name: "Química" },
  { id: "fis", areaId: "nat", name: "Física" },
  { id: "bio", areaId: "nat", name: "Biologia" },
  { id: "geo", areaId: "hum", name: "Geografia" },
  { id: "his", areaId: "hum", name: "História" },
  { id: "fil", areaId: "hum", name: "Filosofia" },
  { id: "soc", areaId: "hum", name: "Sociologia" },
];

export function findArea(id: AreaId): Area {
  return AREAS.find((area) => area.id === id) ?? AREAS[0];
}

export function findSubject(id: SubjectId | null | undefined): Subject | undefined {
  return id ? SUBJECTS.find((subject) => subject.id === id) : undefined;
}

export function subjectsOf(areaId: AreaId): Subject[] {
  return SUBJECTS.filter((subject) => subject.areaId === areaId);
}

// Nome da matéria quando houver; senão, o da área.
export function focusName(areaId: AreaId, subjectId?: SubjectId | null): string {
  return findSubject(subjectId)?.name ?? findArea(areaId).name;
}
