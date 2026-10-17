import { toDateKey } from "./dates";
import type { AreaId } from "./syllabus";
import { findTopic, type TopicRecord } from "./topics";
import type { TimerMode } from "./timer";

export type SessionState = "concluida" | "interrompida";
export type Reflection = "bem" | "parcial" | "revisar" | "dificuldade";

export interface StudySession {
  id: string;
  topicId: string | null;
  areaId: AreaId | null;
  date: string;
  start: number;
  end: number;
  sec: number;
  mode: TimerMode;
  state: SessionState;
  reflection?: Reflection;
  note?: string;
  taskId?: string;
}

// Valor do seletor do timer para estudar sem tópico; a sessão fica sem área.
export const GENERAL_STUDY = "geral";
export const MIN_SESSION_SECONDS = 60;
export const NOTE_MAX = 300;

export const REFLECTION_LABELS: Record<Reflection, string> = {
  bem: "Entendi bem",
  parcial: "Entendi parcialmente",
  revisar: "Preciso revisar",
  dificuldade: "Tive dificuldade",
};

export const SESSION_STATE_LABELS: Record<SessionState, string> = {
  concluida: "Concluída",
  interrompida: "Interrompida",
};

interface NewSession {
  id: string;
  topicId: string;
  topics: readonly TopicRecord[];
  mode: TimerMode;
  state: SessionState;
  seconds: number;
  start: number;
  end: number;
  taskId?: string;
}

export function createSession({ id, topicId, topics, mode, state, seconds, start, end, taskId }: NewSession): StudySession | null {
  const sec = Math.round(seconds);
  if (!Number.isFinite(sec) || sec < MIN_SESSION_SECONDS || !topicId) return null;
  const general = topicId === GENERAL_STUDY;
  const topic = general ? undefined : findTopic(topics, topicId);
  return {
    id,
    topicId: general ? null : topicId,
    areaId: topic?.areaId ?? null,
    date: toDateKey(new Date(end)),
    start: Math.min(start || end - sec * 1000, end - sec * 1000),
    end,
    sec,
    mode,
    state,
    ...(taskId ? { taskId } : {}),
  };
}

export function needsReinforcement(reflection: Reflection | undefined): boolean {
  return reflection === "revisar" || reflection === "dificuldade";
}
