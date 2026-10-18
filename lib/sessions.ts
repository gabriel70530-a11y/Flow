import { toDateKey } from "./dates";
import { AREAS, findArea, type AreaId } from "./syllabus";
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
// Estudar uma área inteira sem escolher tópico ("area:mat"): a sessão fica com a área e sem tópico.
const AREA_STUDY_PREFIX = "area:";

export function areaStudyValue(areaId: AreaId): string {
  return `${AREA_STUDY_PREFIX}${areaId}`;
}

// Nome do que foi estudado: o tópico, a área inteira ou estudo geral.
export function studyTitle(topicId: string | null, areaId: AreaId | null, topics: readonly TopicRecord[]): string {
  if (topicId) return findTopic(topics, topicId)?.name ?? "Tópico excluído";
  return areaId ? `${findArea(areaId).name} (geral)` : "Estudo geral";
}

// Traduz o que foi escolhido no seletor (tópico, área inteira ou estudo geral) para tópico e área.
export function parseStudyChoice(
  value: string,
  topics: readonly TopicRecord[],
): { topicId: string | null; areaId: AreaId | null } {
  if (value === GENERAL_STUDY) return { topicId: null, areaId: null };
  if (value.startsWith(AREA_STUDY_PREFIX)) {
    const area = AREAS.find((item) => item.id === value.slice(AREA_STUDY_PREFIX.length));
    return { topicId: null, areaId: area?.id ?? null };
  }
  return { topicId: value, areaId: findTopic(topics, value)?.areaId ?? null };
}
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
  const choice = parseStudyChoice(topicId, topics);
  return {
    id,
    ...choice,
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
