import { addDays } from "./dates";
import type { TopicRecord } from "./topics";

export type TopicStatus = "nao" | "and" | "concluido" | "revisar";
export type Mastery = 0 | 1 | 2 | 3 | 4 | 5;
export type ReviewFeedback = "bem" | "parcial" | "dificil";

export interface Reschedule {
  from: string;
  to: string;
  at: string;
}

export interface Review {
  // 1 a 4 nas revisões automáticas do Pro; as agendadas à mão continuam a contagem do tópico.
  stage: number;
  due: string;
  done?: string;
  feedback?: ReviewFeedback;
  reschedules?: Reschedule[];
  // Agendada pela própria pessoa (plano gratuito), fora da sequência de 1, 7, 15 e 30 dias.
  manual?: boolean;
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
  revisar: "Precisa revisar",
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

export const FEEDBACK_LABELS: Record<ReviewFeedback, string> = {
  bem: "Lembrei bem",
  parcial: "Lembrei parcialmente",
  dificil: "Tive dificuldade",
};

export const EMPTY_PROGRESS: TopicProgress = { status: "nao", mastery: 0, reviews: [] };

export function progressOf(progress: ProgressMap, topicId: string): TopicProgress {
  return progress[topicId] ?? EMPTY_PROGRESS;
}

export function scheduleReviews(from: string, firstStage: number): Review[] {
  return REVIEW_DAYS.slice(firstStage - 1).map((days, index) => ({
    stage: firstStage + index,
    due: addDays(from, days),
  }));
}

// autoReviews é o Pro: no gratuito, concluir não agenda nada e a pessoa escolhe as datas.
export function changeStatus(current: TopicProgress, status: TopicStatus, today: string, autoReviews = true): TopicProgress {
  if (current.status === status) return current;
  const done = current.reviews.filter((review) => review.done);
  if (status !== "concluido") {
    return { ...current, status, completedAt: undefined, reviews: done };
  }
  if (!autoReviews) return { ...current, status, completedAt: today, reviews: done };
  // Ao reconcluir, as revisões já feitas ficam e só as etapas restantes são reagendadas a partir de hoje.
  return {
    ...current,
    status,
    completedAt: today,
    reviews: [...done, ...scheduleReviews(today, done.length + 1)],
  };
}

export function reviewLabel(review: Review): string {
  if (review.manual) return `Revisão ${review.stage} · agendada por você`;
  const days = REVIEW_DAYS[review.stage - 1];
  return days ? `Revisão ${review.stage} de 4 · ${days} ${days === 1 ? "dia" : "dias"}` : `Revisão ${review.stage}`;
}

// Um tópico tem no máximo uma revisão pendente: agendar de novo só muda a data dela.
export function scheduleManualReview(progress: TopicProgress, date: string, today: string): TopicProgress {
  if (date < today) return progress;
  if (nextReview(progress)) return rescheduleNextReview(progress, date, today);
  return { ...progress, reviews: [...progress.reviews, { stage: progress.reviews.length + 1, due: date, manual: true }] };
}

export function nextReview(progress: TopicProgress): Review | undefined {
  return progress.reviews.find((review) => !review.done);
}

function updateNextReview(progress: TopicProgress, change: (review: Review) => Review): TopicProgress {
  const next = nextReview(progress);
  return { ...progress, reviews: progress.reviews.map((review) => (review === next ? change(review) : review)) };
}

export function completeNextReview(progress: TopicProgress, today: string, feedback?: ReviewFeedback): TopicProgress {
  return updateNextReview(progress, (review) => ({ ...review, done: today, ...(feedback ? { feedback } : {}) }));
}

// Muda só a revisão pendente; as etapas seguintes mantêm as datas e o histórico guarda a mudança.
export function rescheduleNextReview(progress: TopicProgress, to: string, today: string): TopicProgress {
  if (to < today) return progress;
  return updateNextReview(progress, (review) =>
    review.due === to
      ? review
      : { ...review, due: to, reschedules: [...(review.reschedules ?? []), { from: review.due, to, at: today }] },
  );
}

// Adiar uma revisão atrasada ou de hoje leva para amanhã; uma futura anda um dia.
export function postponeNextReview(progress: TopicProgress, today: string): TopicProgress {
  const next = nextReview(progress);
  if (!next) return progress;
  const base = next.due < today ? today : next.due;
  return rescheduleNextReview(progress, addDays(base, 1), today);
}

export function pendingReviews(progress: ProgressMap, topics: readonly TopicRecord[]): PendingReview[] {
  return topics
    .filter((topic) => !topic.hidden)
    .flatMap(({ id }) => {
      const review = progress[id] && nextReview(progress[id]);
      return review ? [{ topicId: id, review }] : [];
    })
    .sort((first, second) => first.review.due.localeCompare(second.review.due));
}

export function groupReviews(pending: PendingReview[], today: string) {
  const weekAhead = addDays(today, 7);
  return {
    late: pending.filter(({ review }) => review.due < today),
    today: pending.filter(({ review }) => review.due === today),
    upcoming: pending.filter(({ review }) => review.due > today && review.due <= weekAhead),
    later: pending.filter(({ review }) => review.due > weekAhead),
  };
}
