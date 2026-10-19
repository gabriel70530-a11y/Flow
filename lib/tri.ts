import { MOCK_DAY_AREAS } from "./mock-exams";
import {
  QUESTIONS_PER_DAY,
  areaOfQuestion,
  correctAnswer,
  scopeIndices,
  type ExamScope,
  type ForeignLanguage,
  type Letter,
  type OfficialExam,
} from "./official-exams";
import type { AreaId } from "./syllabus";
import { TRI_ITEMS, type TriItem } from "./tri-items";

// Escala do Enem (fixa desde 2009) que leva o θ de cada área à nota. Conferida com os microdados de 2022 e 2023:
// a mesma conta reproduz a nota oficial dos candidatos com diferença de até 0,1 ponto.
const SCALE: Record<Exclude<AreaId, "red">, { intercept: number; slope: number }> = {
  lin: { intercept: 499.975, slope: 108.088 },
  hum: { intercept: 501.489, slope: 112.312 },
  nat: { intercept: 501.142, slope: 113.109 },
  mat: { intercept: 500.016, slope: 129.649 },
};

// Modelo logístico de 3 parâmetros (D = 1) com θ estimado pela média a posteriori (EAP), priori normal padrão.
const GRID = Array.from({ length: 161 }, (_, index) => -4 + index * 0.05);
const PRIOR = GRID.map((theta) => Math.exp((-theta * theta) / 2));

export interface TriResponse {
  item: TriItem;
  correct: boolean;
}

export function estimateTheta(responses: readonly TriResponse[]): number {
  const posterior = [...PRIOR];
  for (const { item, correct } of responses) {
    const [a, b, c] = item;
    GRID.forEach((theta, index) => {
      const chance = c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
      posterior[index] *= correct ? chance : 1 - chance;
    });
  }
  const total = posterior.reduce((sum, weight) => sum + weight, 0);
  return posterior.reduce((sum, weight, index) => sum + GRID[index] * weight, 0) / total;
}

export function hasTriItems(exam: OfficialExam): boolean {
  return exam.id in TRI_ITEMS;
}

function itemAt(exam: OfficialExam, index: number, language: ForeignLanguage): TriItem | null {
  const items = TRI_ITEMS[exam.id];
  if (!items) return null;
  const foreign = items.foreign?.[language][index];
  if (exam.day === 1 && index < 5 && items.foreign) return foreign ?? null;
  const areaId = areaOfQuestion(exam.day, index);
  return items.areas[areaId]?.[index % (QUESTIONS_PER_DAY / 2)] ?? null;
}

// Nota estimada de cada área feita por completo (45 questões). Em branco conta como erro, como no Enem; os itens que
// o Inep tirou do cálculo ficam de fora. É uma estimativa: a nota oficial sai só pelo Inep.
export function estimateExamScores(
  exam: OfficialExam,
  answers: readonly (Letter | null)[],
  language: ForeignLanguage,
  scope: ExamScope = "dia",
): Partial<Record<AreaId, number>> {
  if (!hasTriItems(exam)) return {};
  const scores: Partial<Record<AreaId, number>> = {};
  for (const areaId of MOCK_DAY_AREAS[exam.day]) {
    if (scope !== "dia" && scope !== areaId) continue;
    const responses: TriResponse[] = [];
    for (const index of scopeIndices(exam.day, areaId)) {
      const item = itemAt(exam, index, language);
      if (item) responses.push({ item, correct: answers[index] === correctAnswer(exam, index, language) });
    }
    const { intercept, slope } = SCALE[areaId as Exclude<AreaId, "red">];
    scores[areaId] = Math.round((intercept + slope * estimateTheta(responses)) * 10) / 10;
  }
  return scores;
}
