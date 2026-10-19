import { addDays } from "./dates";
import type { AreaId, SubjectId } from "./syllabus";

export const CARD_FRONT_MAX = 300;
export const CARD_BACK_MAX = 600;

export type CardGrade = "errei" | "dificil" | "bom" | "facil";

export const CARD_GRADES: { value: CardGrade; label: string }[] = [
  { value: "errei", label: "Errei" },
  { value: "dificil", label: "Difícil" },
  { value: "bom", label: "Bom" },
  { value: "facil", label: "Fácil" },
];

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  areaId: AreaId | null;
  subjectId: SubjectId | null;
  topicId: string | null;
  created: string;
  due: string;
  // Dias até a próxima vez; 0 enquanto o cartão ainda está sendo aprendido.
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
}

export interface CardInput {
  front: string;
  back: string;
  areaId: AreaId | null;
  subjectId: SubjectId | null;
  topicId: string | null;
}

const START_EASE = 2.5;
const MIN_EASE = 1.3;

export function validateCard(input: CardInput): string | null {
  if (!input.front.trim()) return "Escreva a pergunta ou o termo da frente.";
  if (!input.back.trim()) return "Escreva a resposta do verso.";
  if (input.front.trim().length > CARD_FRONT_MAX) return `A frente pode ter até ${CARD_FRONT_MAX} caracteres.`;
  if (input.back.trim().length > CARD_BACK_MAX) return `O verso pode ter até ${CARD_BACK_MAX} caracteres.`;
  return null;
}

export function createCard(input: CardInput, id: string, today: string): Flashcard {
  return {
    id,
    front: input.front.trim(),
    back: input.back.trim(),
    areaId: input.areaId,
    subjectId: input.subjectId,
    topicId: input.topicId,
    created: today,
    due: today,
    interval: 0,
    ease: START_EASE,
    reps: 0,
    lapses: 0,
  };
}

export function editCard(card: Flashcard, input: CardInput): Flashcard {
  return { ...card, ...input, front: input.front.trim(), back: input.back.trim() };
}

// Próximo intervalo em dias, no estilo do Anki (SM-2): cada acerto multiplica o intervalo pela facilidade do cartão.
// "Errei" volta para hoje e recomeça; nunca some nada da fila.
function nextInterval(card: Flashcard, grade: CardGrade): number {
  if (grade === "errei") return 0;
  if (card.reps === 0) return grade === "facil" ? 4 : 1;
  if (grade === "dificil") return Math.max(1, Math.round(card.interval * 1.2));
  const base = card.reps === 1 && grade === "bom" ? 3 : card.interval * card.ease;
  return Math.max(card.interval + 1, Math.round(grade === "facil" ? base * 1.3 : base));
}

export function previewInterval(card: Flashcard, grade: CardGrade): number {
  return nextInterval(card, grade);
}

export function reviewCard(card: Flashcard, grade: CardGrade, today: string): Flashcard {
  const interval = nextInterval(card, grade);
  const easeChange = { errei: -0.2, dificil: -0.15, bom: 0, facil: 0.15 }[grade];
  return {
    ...card,
    interval,
    due: addDays(today, interval),
    ease: Math.max(MIN_EASE, Math.round((card.ease + easeChange) * 100) / 100),
    reps: grade === "errei" ? 0 : card.reps + 1,
    lapses: grade === "errei" ? card.lapses + 1 : card.lapses,
  };
}

export function intervalLabel(days: number): string {
  if (days === 0) return "hoje";
  if (days < 30) return `${days} d`;
  if (days < 365) return `${Math.round(days / 30)} m`;
  return `${Math.round((days / 365) * 10) / 10} a`.replace(".", ",");
}

export function dueCards(cards: readonly Flashcard[], today: string): Flashcard[] {
  return cards.filter((card) => card.due <= today).sort((first, second) => first.due.localeCompare(second.due));
}

// Novo: nunca respondido. Aprendendo: intervalo curto. Maduro: 21 dias ou mais, como no Anki.
export function cardCounts(cards: readonly Flashcard[]): { total: number; fresh: number; learning: number; mature: number } {
  return {
    total: cards.length,
    fresh: cards.filter((card) => card.reps === 0 && card.lapses === 0).length,
    learning: cards.filter((card) => (card.reps > 0 || card.lapses > 0) && card.interval < 21).length,
    mature: cards.filter((card) => card.interval >= 21).length,
  };
}
