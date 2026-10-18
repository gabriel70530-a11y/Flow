import { addDays } from "./dates";
import { REVIEW_DAYS } from "./reviews";
import type { StudyChoice } from "./sessions";

export type MistakeReason = "conteudo" | "interpretacao" | "atencao" | "chute";

// Caderno de erros: cada questão errada (ou acertada no chute) volta em 1, 7, 15 e 30 dias até a pessoa lembrar sem ajuda.
export interface Mistake extends StudyChoice {
  id: string;
  reason: MistakeReason;
  question: string;
  lesson: string;
  source: string;
  createdAt: string;
  // Quantas revisões seguidas a pessoa já acertou (0 a 4). Com 4, o erro sai da fila (due null).
  stage: number;
  due: string | null;
  history: { date: string; remembered: boolean }[];
}

export interface MistakeInput extends StudyChoice {
  reason: MistakeReason;
  question: string;
  lesson: string;
  source: string;
}

export const MISTAKE_REASONS: Record<MistakeReason, { label: string; tip: string }> = {
  conteudo: { label: "Não sabia o conteúdo", tip: "Revise a teoria do tópico e refaça uma questão parecida." },
  interpretacao: { label: "Não entendi o comando", tip: "Antes de responder, marque no enunciado o que a questão pede." },
  atencao: { label: "Pressa ou distração", tip: "Você sabia: confira a conta e releia as alternativas antes de marcar." },
  chute: { label: "Chutei", tip: "Acertos no chute também merecem revisão: estude o porquê da resposta." },
};

export const MISTAKE_QUESTION_MAX = 300;
export const MISTAKE_LESSON_MAX = 500;
export const MISTAKE_SOURCE_MAX = 80;

export function validateMistake(input: MistakeInput): string | null {
  if (!input.question.trim()) return "Descreva a questão ou o que você errou.";
  if (input.question.length > MISTAKE_QUESTION_MAX) return `Use no máximo ${MISTAKE_QUESTION_MAX} caracteres na questão.`;
  if (input.lesson.length > MISTAKE_LESSON_MAX) return `Use no máximo ${MISTAKE_LESSON_MAX} caracteres no que você aprendeu.`;
  if (input.source.length > MISTAKE_SOURCE_MAX) return `Use no máximo ${MISTAKE_SOURCE_MAX} caracteres na origem.`;
  return null;
}

export function createMistake(input: MistakeInput, id: string, today: string): Mistake {
  return {
    id,
    topicId: input.topicId,
    areaId: input.areaId,
    subjectId: input.subjectId,
    reason: input.reason,
    question: input.question.trim(),
    lesson: input.lesson.trim(),
    source: input.source.trim(),
    createdAt: today,
    stage: 0,
    due: addDays(today, REVIEW_DAYS[0]),
    history: [],
  };
}

// Lembrou: avança uma etapa. Não lembrou: recomeça amanhã, porque o erro ainda não foi superado.
export function reviewMistake(mistake: Mistake, today: string, remembered: boolean): Mistake {
  const stage = remembered ? mistake.stage + 1 : 0;
  const due = stage >= REVIEW_DAYS.length ? null : addDays(today, REVIEW_DAYS[stage]);
  return { ...mistake, stage, due, history: [...mistake.history, { date: today, remembered }] };
}

export function dueMistakes(mistakes: readonly Mistake[], today: string): Mistake[] {
  return mistakes
    .filter((mistake) => mistake.due !== null && mistake.due <= today)
    .sort((first, second) => (first.due ?? "").localeCompare(second.due ?? ""));
}

export function openMistakes(mistakes: readonly Mistake[]): Mistake[] {
  return mistakes.filter((mistake) => mistake.due !== null);
}

// Dois erros em aberto no mesmo tópico sugerem marcá-lo como "Precisa revisar".
export const MISTAKES_TO_SUGGEST_REVIEW = 2;

export function openMistakesOnTopic(mistakes: readonly Mistake[], topicId: string): number {
  return openMistakes(mistakes).filter((mistake) => mistake.topicId === topicId).length;
}

// O motivo mais frequente entre os erros registrados; só aparece com pelo menos 3 erros, para não tirar conclusão de pouco.
export function mainReason(mistakes: readonly Mistake[]): { reason: MistakeReason; count: number } | null {
  if (mistakes.length < 3) return null;
  const counts = new Map<MistakeReason, number>();
  for (const mistake of mistakes) counts.set(mistake.reason, (counts.get(mistake.reason) ?? 0) + 1);
  const [reason, count] = [...counts.entries()].sort((first, second) => second[1] - first[1])[0];
  return { reason, count };
}
