import { toDateKey } from "./dates";
import { AREAS, SUBJECTS, focusName, type AreaId, type SubjectId } from "./syllabus";
import { findTopic, type TopicRecord } from "./topics";
import type { TimerMode } from "./timer";

export type SessionState = "concluida" | "interrompida";
export type Reflection = "bem" | "parcial" | "revisar" | "dificuldade";

export interface StudySession {
  id: string;
  topicId: string | null;
  areaId: AreaId | null;
  subjectId?: SubjectId | null;
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
// Estudar uma área ou matéria inteira sem escolher tópico ("area:mat", "materia:qui"): a sessão fica sem tópico.
const AREA_STUDY_PREFIX = "area:";
const SUBJECT_STUDY_PREFIX = "materia:";

export interface StudyChoice {
  topicId: string | null;
  areaId: AreaId | null;
  subjectId: SubjectId | null;
}

export function areaStudyValue(areaId: AreaId): string {
  return `${AREA_STUDY_PREFIX}${areaId}`;
}

export function subjectStudyValue(subjectId: SubjectId): string {
  return `${SUBJECT_STUDY_PREFIX}${subjectId}`;
}

// Valor do seletor para retomar o que uma tarefa ou sessão estudou.
export function studyValue({ topicId, areaId, subjectId }: Partial<StudyChoice>): string {
  if (topicId) return topicId;
  if (subjectId) return subjectStudyValue(subjectId);
  return areaId ? areaStudyValue(areaId) : GENERAL_STUDY;
}

// Nome do que foi estudado: o tópico, a matéria ou área inteira, ou estudo geral.
export function studyTitle(
  topicId: string | null,
  areaId: AreaId | null,
  topics: readonly TopicRecord[],
  subjectId?: SubjectId | null,
): string {
  if (topicId) return findTopic(topics, topicId)?.name ?? "Tópico excluído";
  return areaId ? `${focusName(areaId, subjectId)} (geral)` : "Estudo geral";
}

// Traduz o que foi escolhido no seletor (tópico, matéria, área inteira ou estudo geral) para tópico, área e matéria.
export function parseStudyChoice(value: string, topics: readonly TopicRecord[]): StudyChoice {
  if (value === GENERAL_STUDY) return { topicId: null, areaId: null, subjectId: null };
  if (value.startsWith(AREA_STUDY_PREFIX)) {
    const area = AREAS.find((item) => item.id === value.slice(AREA_STUDY_PREFIX.length));
    return { topicId: null, areaId: area?.id ?? null, subjectId: null };
  }
  if (value.startsWith(SUBJECT_STUDY_PREFIX)) {
    const subject = SUBJECTS.find((item) => item.id === value.slice(SUBJECT_STUDY_PREFIX.length));
    return { topicId: null, areaId: subject?.areaId ?? null, subjectId: subject?.id ?? null };
  }
  const topic = findTopic(topics, value);
  return { topicId: value, areaId: topic?.areaId ?? null, subjectId: topic?.subjectId ?? null };
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
