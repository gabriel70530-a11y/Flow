import { DEFAULT_PLANNER, type PlanTask, type PlannerSettings } from "@/lib/planner";
import type { StudySession } from "@/lib/sessions";
import type { GoalType } from "@/lib/stats";
import { DEFAULT_TIMER, type TimerState } from "@/lib/timer";
import { defaultTopics, findTopic } from "@/lib/topics";
import { createDemoData } from "./demo-data";
import { emptyData, type StudyData } from "./state";

const GOAL_TYPES: GoalType[] = ["horas", "sessoes", "topicos"];

interface StoredRaw {
  current: string | null;
  legacy: string | null;
}

export interface LoadResult {
  data: StudyData;
  corrupt: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function without(record: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)));
}

// Versões anteriores guardavam minutos por dia; hoje só importa em quais dias a pessoa estuda.
function normalizePlanner(saved: unknown): PlannerSettings {
  if (!isRecord(saved)) return DEFAULT_PLANNER;
  const { availability, studyDays } = saved;
  const days =
    Array.isArray(studyDays) && studyDays.length === 7
      ? studyDays.map(Boolean)
      : Array.isArray(availability) && availability.length === 7
        ? availability.map((minutes) => Number(minutes) > 0)
        : DEFAULT_PLANNER.studyDays;
  return {
    ...DEFAULT_PLANNER,
    ...(without(saved, ["availability", "sessionMinutes", "studyDays"]) as Partial<PlannerSettings>),
    studyDays: days.some(Boolean) ? days : DEFAULT_PLANNER.studyDays,
  };
}

// Tarefas antigas tinham duração em minutos; o campo saiu porque o tempo de estudo não é limitado.
function normalizeTasks(saved: unknown): PlanTask[] {
  if (!Array.isArray(saved)) return [];
  return saved.filter(isRecord).map((task) => without(task, ["minutes"]) as unknown as PlanTask);
}

// Completa campos ausentes com os padrões, para dados salvos por versões anteriores da v2 continuarem abrindo.
function normalize(saved: Record<string, unknown>): StudyData {
  const base = emptyData();
  const goal = isRecord(saved.goal) ? saved.goal : {};
  const goalValue = Number(goal.value);
  return {
    ...base,
    demo: Boolean(saved.demo),
    topics: Array.isArray(saved.topics) ? (saved.topics as StudyData["topics"]) : base.topics,
    progress: isRecord(saved.progress) ? (saved.progress as StudyData["progress"]) : {},
    sessions: Array.isArray(saved.sessions) ? (saved.sessions as StudySession[]) : [],
    tasks: normalizeTasks(saved.tasks),
    goal: {
      type: GOAL_TYPES.includes(goal.type as GoalType) ? (goal.type as GoalType) : base.goal.type,
      value: Number.isFinite(goalValue) && goalValue > 0 ? goalValue : base.goal.value,
    },
    planner: normalizePlanner(saved.planner),
    onboarding: { ...base.onboarding, ...(isRecord(saved.onboarding) ? saved.onboarding : {}) },
    theme: saved.theme === "light" || saved.theme === "dark" ? saved.theme : "system",
    sound: saved.sound !== false,
    showStreak: saved.showStreak !== false,
    analyticsConsent: saved.analyticsConsent === true,
    timer: { ...DEFAULT_TIMER, ...(isRecord(saved.timer) ? (saved.timer as Partial<TimerState>) : {}) },
  };
}

// v1 é o formato do protótipo: tópicos fixos, sessões com `ts` no fim e meta em horas.
export function migrateV1(saved: Record<string, unknown>): StudyData {
  const topics = defaultTopics();
  const legacySessions = Array.isArray(saved.sessions) ? saved.sessions : [];
  const sessions: StudySession[] = legacySessions.filter(isRecord).flatMap((session) => {
    const sec = Number(session.sec);
    const end = Number(session.ts);
    const topicId = typeof session.topicId === "string" ? session.topicId : null;
    if (!Number.isFinite(sec) || sec <= 0 || !Number.isFinite(end) || typeof session.date !== "string") return [];
    return [
      {
        id: String(session.id),
        topicId,
        areaId: findTopic(topics, topicId)?.areaId ?? null,
        date: session.date,
        start: end - sec * 1000,
        end,
        sec,
        mode: session.mode === "cronometro" ? "cronometro" : "pomodoro",
        state: "concluida",
      },
    ];
  });
  const legacyTimer = isRecord(saved.timer) ? saved.timer : {};
  // A primeira versão do protótipo salvava o timer em outro formato; nesse caso só o tópico é aproveitado.
  const timer: TimerState =
    "banked" in legacyTimer
      ? { ...DEFAULT_TIMER, ...(legacyTimer as Partial<TimerState>), sessionStart: 0, taskId: "" }
      : { ...DEFAULT_TIMER, topicId: typeof legacyTimer.topicId === "string" ? legacyTimer.topicId : "" };
  const goal = Number(saved.goal);

  return normalize({
    demo: saved.demo,
    topics,
    progress: saved.progress,
    sessions,
    goal: { type: "horas", value: Number.isFinite(goal) && goal > 0 ? goal : 25 },
    theme: saved.theme,
    timer,
  });
}

export function loadData({ current, legacy }: StoredRaw, today: string): LoadResult {
  if (current !== null) {
    const saved = parseJson(current);
    if (isRecord(saved) && saved.version === 2) return { data: normalize(saved), corrupt: false };
    return { data: emptyData(), corrupt: true };
  }
  if (legacy !== null) {
    const saved = parseJson(legacy);
    if (isRecord(saved) && saved.version === 1) return { data: migrateV1(saved), corrupt: false };
    return { data: emptyData(), corrupt: false };
  }
  return { data: { ...emptyData(), demo: true, ...createDemoData(today) }, corrupt: false };
}

// Lê um backup exportado pelo app (v2) ou os dados do protótipo (v1). Devolve null se o arquivo não servir.
export function parseBackup(raw: string): StudyData | null {
  const saved = parseJson(raw);
  if (!isRecord(saved)) return null;
  if (saved.version === 2) return normalize(saved);
  if (saved.version === 1) return migrateV1(saved);
  return null;
}
