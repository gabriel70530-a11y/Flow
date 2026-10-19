import { DEFAULT_PLANNER, type PlanTask, type PlannerSettings } from "@/lib/planner";
import type { StudySession } from "@/lib/sessions";
import type { GoalType } from "@/lib/stats";
import { MOCK_DAY_AREAS } from "@/lib/mock-exams";
import { LETTERS, QUESTIONS_PER_DAY, findOfficialExam, type ExamDraft, type ExamScope } from "@/lib/official-exams";
import { DEFAULT_TIMER, type TimerState } from "@/lib/timer";
import { normalizeTimesTable } from "@/lib/times-table";
import { legacySubject, legacyTopics } from "@/lib/legacy-topics";
import { subjectsOf, type AreaId } from "@/lib/syllabus";
import { findTopic, type TopicRecord } from "@/lib/topics";
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

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function normalizeExamDraft(value: unknown): ExamDraft | null {
  if (!isRecord(value) || typeof value.examId !== "string" || !findOfficialExam(value.examId)) return null;
  const answers = Array.isArray(value.answers) ? value.answers : [];
  if (answers.length !== QUESTIONS_PER_DAY) return null;
  const exam = findOfficialExam(value.examId);
  const scope = value.scope === "dia" || (exam && MOCK_DAY_AREAS[exam.day].includes(value.scope as AreaId)) ? (value.scope as ExamScope) : "dia";
  const current = Number(value.current);
  return {
    examId: value.examId,
    language: value.language === "espanhol" ? "espanhol" : "ingles",
    // Rascunhos de antes das questões no app eram todos no cartão-resposta.
    format: value.format === "app" && exam?.questionsUrl ? "app" : "pdf",
    scope,
    answers: answers.map((answer) => (LETTERS.includes(answer) ? answer : null)),
    current: Number.isInteger(current) && current >= 0 && current < QUESTIONS_PER_DAY ? current : 0,
    flagged: Array.isArray(value.flagged)
      ? value.flagged.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < QUESTIONS_PER_DAY)
      : [],
    banked: Number.isFinite(value.banked) ? Number(value.banked) : 0,
    startedAt: Number.isFinite(value.startedAt) ? Number(value.startedAt) : null,
  };
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
    // A data da prova deixou de ser escolhida: é sempre a do Enem.
    targetDate: DEFAULT_PLANNER.targetDate,
    lightDays:
      Array.isArray(saved.lightDays) && saved.lightDays.length === 7 ? saved.lightDays.map(Boolean) : DEFAULT_PLANNER.lightDays,
  };
}

// Tarefas antigas tinham duração em minutos; o campo saiu porque o tempo de estudo não é limitado.
function normalizeTasks(saved: unknown): PlanTask[] {
  if (!Array.isArray(saved)) return [];
  return saved.filter(isRecord).map((task) => without(task, ["minutes"]) as unknown as PlanTask);
}

function usedTopicIds(data: StudyData): Set<string> {
  const ids = new Set<string>();
  for (const [id, topic] of Object.entries(data.progress)) {
    if (topic.status !== "nao" || topic.mastery > 0 || topic.reviews.length > 0) ids.add(id);
  }
  for (const item of [...data.sessions, ...data.tasks]) if (item.topicId) ids.add(item.topicId);
  if (data.timer.topicId) ids.add(data.timer.topicId);
  return ids;
}

/*
 * O app não traz mais tópicos prontos, só as cinco áreas. Os tópicos que vinham prontos (origin "padrao")
 * e nunca foram usados saem; os que têm progresso, sessões, tarefas ou estão no timer ficam, para não
 * perder histórico. Dados sem lista de tópicos (v1 e começo da v2) reconstroem só os usados.
 */
function keepUsedTopics(data: StudyData, savedTopics: unknown): StudyData {
  const used = usedTopicIds(data);
  const topics = Array.isArray(savedTopics)
    ? savedTopics
        .filter(isRecord)
        .filter((topic) => topic.origin !== "padrao" || used.has(String(topic.id)))
        .map((topic) => withSubject(without(topic, ["origin"]) as unknown as TopicRecord))
    : legacyTopics().filter((topic) => used.has(topic.id));
  return { ...data, topics };
}

// Tópicos salvos antes das matérias de Natureza e Humanas: os antigos ganham a matéria original; os demais ficam sem.
function withSubject(topic: TopicRecord): TopicRecord {
  const subjects = subjectsOf(topic.areaId).map((subject) => subject.id);
  const subjectId = [topic.subjectId, legacySubject(topic.id)].find((id) => id && subjects.includes(id)) ?? null;
  return { ...topic, subjectId };
}

// Tarefas e sessões guardam a matéria do tópico para o cronograma manter um assunto por dia.
function linkSubjects(data: StudyData): StudyData {
  const subjectOf = (topicId: string | null) => findTopic(data.topics, topicId)?.subjectId ?? null;
  return {
    ...data,
    tasks: data.tasks.map((task) => (task.topicId && task.subjectId === undefined ? { ...task, subjectId: subjectOf(task.topicId) } : task)),
    sessions: data.sessions.map((session) =>
      session.topicId && session.subjectId === undefined ? { ...session, subjectId: subjectOf(session.topicId) } : session,
    ),
  };
}

// Completa campos ausentes com os padrões, para dados salvos por versões anteriores da v2 continuarem abrindo.
function normalize(saved: Record<string, unknown>): StudyData {
  return linkSubjects(keepUsedTopics(fillDefaults(saved), saved.topics));
}

function fillDefaults(saved: Record<string, unknown>): StudyData {
  const base = emptyData();
  const goal = isRecord(saved.goal) ? saved.goal : {};
  const goalValue = Number(goal.value);
  return {
    ...base,
    demo: Boolean(saved.demo),
    progress: isRecord(saved.progress) ? (saved.progress as StudyData["progress"]) : {},
    sessions: Array.isArray(saved.sessions) ? (saved.sessions as StudySession[]) : [],
    tasks: normalizeTasks(saved.tasks),
    mistakes: records(saved.mistakes) as unknown as StudyData["mistakes"],
    mockExams: records(saved.mockExams) as unknown as StudyData["mockExams"],
    essays: records(saved.essays) as unknown as StudyData["essays"],
    repertoire: records(saved.repertoire) as unknown as StudyData["repertoire"],
    questionBlocks: records(saved.questionBlocks) as unknown as StudyData["questionBlocks"],
    flashcards: records(saved.flashcards) as unknown as StudyData["flashcards"],
    timesTable: normalizeTimesTable(saved.timesTable),
    examChecklist: Array.isArray(saved.examChecklist) ? saved.examChecklist.filter((id) => typeof id === "string") : [],
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
    examDraft: normalizeExamDraft(saved.examDraft),
  };
}

// v1 é o formato do protótipo: tópicos fixos, sessões com `ts` no fim e meta em horas.
export function migrateV1(saved: Record<string, unknown>): StudyData {
  const topics = legacyTopics();
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
    progress: saved.progress,
    sessions,
    goal: { type: "horas", value: Number.isFinite(goal) && goal > 0 ? goal : 25 },
    theme: saved.theme,
    timer,
  });
}

export function loadData({ current, legacy }: StoredRaw): LoadResult {
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
  return { data: emptyData(), corrupt: false };
}

// Lê um backup exportado pelo app (v2) ou os dados do protótipo (v1). Devolve null se o arquivo não servir.
export function parseBackup(raw: string): StudyData | null {
  const saved = parseJson(raw);
  if (!isRecord(saved)) return null;
  if (saved.version === 2) return normalize(saved);
  if (saved.version === 1) return migrateV1(saved);
  return null;
}
