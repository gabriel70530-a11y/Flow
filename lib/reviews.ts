import { addDays } from "./dates";
import { TOPICS } from "./syllabus";

export type TopicStatus = "nao" | "and" | "concluido";
export type Mastery = 0 | 1 | 2 | 3 | 4 | 5;
export type ReviewStage = 1 | 2 | 3 | 4;

export interface Review {
  stage: ReviewStage;
  due: string;
  done?: string;
}

export interface TopicProgress {
  status: TopicStatus;
  mastery: Mastery;
  completedAt?: string;
  reviews: Review[];
}

export type ProgressMap = Record<string, TopicProgress>;

export interface PendingReview {
  topicId: string;
  review: Review;
}

export const REVIEW_DAYS = [1, 7, 15, 30] as const;

export const STATUS_LABELS: Record<TopicStatus, string> = {
  nao: "Não iniciado",
  and: "Em andamento",
  concluido: "Concluído",
};

export const MASTERY_LABELS: Record<Mastery, string> = {
  0: "Sem avaliação",
  1: "Muito fraco",
  2: "Fraco",
  3: "Razoável",
  4: "Bom",
  5: "Domina",
};

export const EMPTY_PROGRESS: TopicProgress = { status: "nao", mastery: 0, reviews: [] };

export function progressOf(progress: ProgressMap, topicId: string): TopicProgress {
  return progress[topicId] ?? EMPTY_PROGRESS;
}

export function scheduleReviews(from: string, firstStage: number): Review[] {
  return REVIEW_DAYS.slice(firstStage - 1).map((days, index) => ({
    stage: (firstStage + index) as ReviewStage,
    due: addDays(from, days),
  }));
}

export function changeStatus(current: TopicProgress, status: TopicStatus, today: string): TopicProgress {
  if (current.status === status) return current;
  const done = current.reviews.filter((review) => review.done);
  if (status !== "concluido") {
    return { ...current, status, completedAt: undefined, reviews: done };
  }
  // Ao reconcluir, as revisões já feitas ficam e só as etapas restantes são reagendadas a partir de hoje.
  return {
    ...current,
    status,
    completedAt: today,
    reviews: [...done, ...scheduleReviews(today, done.length + 1)],
  };
}

export function nextReview(progress: TopicProgress): Review | undefined {
  return progress.reviews.find((review) => !review.done);
}

export function completeNextReview(progress: TopicProgress, today: string): TopicProgress {
  const next = nextReview(progress);
  return {
    ...progress,
    reviews: progress.reviews.map((review) => (review === next ? { ...review, done: today } : review)),
  };
}

export function pendingReviews(progress: ProgressMap): PendingReview[] {
  return TOPICS.flatMap(({ id }) => {
    const review = progress[id] && nextReview(progress[id]);
    return review ? [{ topicId: id, review }] : [];
  }).sort((first, second) => first.review.due.localeCompare(second.review.due));
}

export function groupReviews(pending: PendingReview[], today: string) {
  const weekAhead = addDays(today, 7);
  return {
    late: pending.filter(({ review }) => review.due < today),
    today: pending.filter(({ review }) => review.due === today),
    upcoming: pending.filter(({ review }) => review.due > today && review.due <= weekAhead),
  };
}
