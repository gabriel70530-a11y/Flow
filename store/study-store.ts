import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import { isDateKey, toDateKey } from "@/lib/dates";
import {
  applyFocusToTask,
  generatePlan,
  lowerPriority,
  rescheduleTask,
  splitTask,
  validateAvailability,
  validateTask,
  type PlanResult,
  type PlanTask,
  type PlannerSettings,
  type TaskInput,
} from "@/lib/planner";
import {
  changeStatus,
  completeNextReview,
  postponeNextReview,
  progressOf,
  rescheduleNextReview,
  type Mastery,
  type ReviewFeedback,
  type TopicProgress,
  type TopicStatus,
} from "@/lib/reviews";
import { NOTE_MAX, createSession, type Reflection, type SessionState, type StudySession } from "@/lib/sessions";
import { GOAL_LIMITS, type WeeklyGoal } from "@/lib/stats";
import {
  elapsed,
  isIdle,
  isPhaseOver,
  nextPhase,
  pauseTimer,
  phaseSeconds,
  resetTimer,
  startTimer,
  type TimerMode,
  type TimerState,
} from "@/lib/timer";
import {
  createTopic,
  deleteTopic,
  findTopic,
  restoreDefaults,
  setTopicHidden,
  updateTopic,
  validateTopic,
  type TopicInput,
} from "@/lib/topics";
import { track, type AnalyticsEvent } from "./analytics";
import { loadData, parseBackup } from "./migrate";
import { emptyData, type OnboardingState, type StudyData, type Theme } from "./state";
import { CORRUPT_STORAGE_KEY, LEGACY_STORAGE_KEY, STORAGE_KEY } from "./storage-key";

export type { StudyData, Theme } from "./state";

type TickResult = { kind: "focus-done"; session: StudySession | null } | { kind: "break-done" } | null;

interface StudyActions {
  addTopic: (input: TopicInput) => { error: string } | { id: string };
  editTopic: (id: string, input: TopicInput) => string | null;
  setTopicHidden: (id: string, hidden: boolean) => void;
  removeTopic: (id: string) => void;
  restoreDefaultTopics: () => void;

  setStatus: (topicId: string, status: TopicStatus) => TopicProgress;
  toggleMastery: (topicId: string, level: Mastery) => void;

  completeReview: (topicId: string, feedback?: ReviewFeedback) => TopicProgress;
  setReviewFeedback: (topicId: string, stage: number, feedback: ReviewFeedback) => void;
  postponeReview: (topicId: string) => void;
  rescheduleReview: (topicId: string, date: string) => boolean;

  setGoal: (goal: WeeklyGoal) => void;
  setTheme: (theme: Theme) => void;
  setSound: (sound: boolean) => void;
  setShowStreak: (showStreak: boolean) => void;
  setAnalyticsConsent: (consent: boolean) => void;
  trackEvent: (event: AnalyticsEvent) => void;

  setTimerMode: (mode: TimerMode) => void;
  setTimerTopic: (topicId: string) => void;
  setFocusMinutes: (minutes: number) => void;
  setBreakMinutes: (minutes: number) => void;
  studyTopic: (topicId: string, task?: { id: string; minutes: number }) => boolean;
  startTimer: () => boolean;
  pauseTimer: () => void;
  finishTimer: () => StudySession | null;
  discardTimer: () => void;
  skipBreak: () => void;
  tick: () => TickResult;

  deleteSession: (sessionId: string) => void;
  setSessionReflection: (sessionId: string, reflection: Reflection) => void;
  setSessionNote: (sessionId: string, note: string) => void;

  savePlanner: (settings: PlannerSettings) => string | null;
  finishOnboarding: (settings: PlannerSettings, planMode: OnboardingState["planMode"]) => string | null;
  skipOnboarding: () => void;
  regeneratePlan: () => PlanResult;
  addTask: (input: TaskInput) => string | null;
  moveTask: (taskId: string, date: string | null) => boolean;
  setTaskDone: (taskId: string, done: boolean) => void;
  splitPlanTask: (taskId: string) => void;
  lowerTaskPriority: (taskId: string) => void;
  removeTask: (taskId: string) => void;

  resetData: () => void;
  exportBackup: () => string;
  importBackup: (raw: string) => string | null;
}

type StudyStore = StudyData & StudyActions;

// Avisa a interface quando o navegador recusa a gravação (cota cheia, modo privado, armazenamento bloqueado).
export const useSaveStatus = create<{ failed: boolean }>(() => ({ failed: false }));

function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

// Grava o estado cru, sem o envelope do persist. Lê a v2 e, se ela não existir, migra da v1 do protótipo.
const rawStorage: PersistStorage<StudyData> = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    const current = readItem(name);
    const { data, corrupt } = loadData({ current, legacy: readItem(LEGACY_STORAGE_KEY) }, toDateKey(new Date()));
    if (corrupt && current !== null) writeItem(CORRUPT_STORAGE_KEY, current);
    return { state: data, version: 2 };
  },
  setItem: (name, value) => {
    useSaveStatus.setState({ failed: !writeItem(name, JSON.stringify(value.state)) });
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

function newId(prefix = ""): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
}

// Grava a sessão, passa "Não iniciado" para "Em andamento" e soma o foco na tarefa ativa do cronograma.
function recordSession(data: StudyData, seconds: number, state: SessionState, now: number) {
  const { timer } = data;
  const session = createSession({
    id: newId(),
    topicId: timer.topicId,
    topics: data.topics,
    mode: timer.mode,
    state,
    seconds,
    start: timer.sessionStart,
    end: now,
    taskId: timer.taskId || undefined,
  });
  if (!session) return { session: null, changes: {} };
  const current = session.topicId ? progressOf(data.progress, session.topicId) : null;
  const progress =
    session.topicId && current?.status === "nao"
      ? { ...data.progress, [session.topicId]: { ...current, status: "and" as const } }
      : data.progress;
  const tasks = session.taskId ? applyFocusToTask(data.tasks, session.taskId, session.sec) : data.tasks;
  return { session, changes: { sessions: [...data.sessions, session], progress, tasks } };
}

function toStudyData(state: StudyData): StudyData {
  return {
    version: state.version,
    demo: state.demo,
    topics: state.topics,
    progress: state.progress,
    sessions: state.sessions,
    tasks: state.tasks,
    goal: state.goal,
    planner: state.planner,
    onboarding: state.onboarding,
    theme: state.theme,
    sound: state.sound,
    showStreak: state.showStreak,
    analyticsConsent: state.analyticsConsent,
    timer: state.timer,
  };
}

export const useStudyStore = create<StudyStore>()(
  persist(
    (set, get) => {
      const updateTimer = (changes: Partial<TimerState>) => set({ timer: { ...get().timer, ...changes } });
      const updateIdleTimer = (changes: Partial<TimerState>) => {
        if (isIdle(get().timer)) updateTimer(changes);
      };
      const updateProgress = (topicId: string, change: (progress: TopicProgress) => TopicProgress) => {
        const updated = change(progressOf(get().progress, topicId));
        set({ progress: { ...get().progress, [topicId]: updated } });
        return updated;
      };
      const updateSession = (sessionId: string, changes: Partial<StudySession>) =>
        set({ sessions: get().sessions.map((session) => (session.id === sessionId ? { ...session, ...changes } : session)) });
      const today = () => toDateKey(new Date());

      return {
        ...emptyData(),

        addTopic: (input) => {
          const error = validateTopic(input, get().topics);
          if (error) return { error };
          const id = newId("custom-");
          set({ topics: createTopic(get().topics, input, id) });
          return { id };
        },

        editTopic: (id, input) => {
          const error = validateTopic(input, get().topics, id);
          if (!error) set({ topics: updateTopic(get().topics, id, input) });
          return error;
        },

        setTopicHidden: (id, hidden) => set({ topics: setTopicHidden(get().topics, id, hidden) }),

        // Sessões ficam no histórico; somem o progresso e as tarefas ainda não feitas do tópico.
        removeTopic: (id) => {
          const { topics, progress, tasks } = get();
          const remaining = deleteTopic(topics, id);
          if (remaining.length === topics.length) return;
          set({
            topics: remaining,
            progress: Object.fromEntries(Object.entries(progress).filter(([topicId]) => topicId !== id)),
            tasks: tasks.filter((task) => task.topicId !== id || task.status === "concluida"),
          });
        },

        restoreDefaultTopics: () => set({ topics: restoreDefaults(get().topics) }),

        setStatus: (topicId, status) => updateProgress(topicId, (current) => changeStatus(current, status, today())),

        toggleMastery: (topicId, level) =>
          updateProgress(topicId, (current) => ({ ...current, mastery: current.mastery === level ? 0 : level })),

        completeReview: (topicId, feedback) => {
          get().trackEvent("revisao_concluida");
          return updateProgress(topicId, (current) => completeNextReview(current, today(), feedback));
        },

        setReviewFeedback: (topicId, stage, feedback) =>
          updateProgress(topicId, (current) => ({
            ...current,
            reviews: current.reviews.map((review) => (review.stage === stage && review.done ? { ...review, feedback } : review)),
          })),

        postponeReview: (topicId) => updateProgress(topicId, (current) => postponeNextReview(current, today())),

        rescheduleReview: (topicId, date) => {
          if (!isDateKey(date) || date < today()) return false;
          updateProgress(topicId, (current) => rescheduleNextReview(current, date, today()));
          return true;
        },

        setGoal: ({ type, value }) =>
          set({ goal: { type, value: clamp(value, 1, GOAL_LIMITS[type].max, GOAL_LIMITS[type].fallback) } }),
        setTheme: (theme) => set({ theme }),
        setSound: (sound) => set({ sound }),
        setShowStreak: (showStreak) => set({ showStreak }),
        setAnalyticsConsent: (analyticsConsent) => set({ analyticsConsent }),
        trackEvent: (event) => track(event, get().analyticsConsent),

        setTimerMode: (mode) => updateIdleTimer({ mode }),
        setTimerTopic: (topicId) => {
          if (!get().timer.running) updateTimer({ topicId, taskId: "" });
        },
        setFocusMinutes: (minutes) => updateIdleTimer({ focus: clamp(minutes, 1, 120, 25) }),
        setBreakMinutes: (minutes) => updateIdleTimer({ brk: clamp(minutes, 1, 60, 5) }),

        // Abrir o timer a partir de uma tarefa usa a duração dela como bloco de foco do Pomodoro.
        studyTopic: (topicId, task) => {
          const { timer } = get();
          if (timer.running || !isIdle(timer)) return false;
          updateTimer({
            topicId,
            taskId: task?.id ?? "",
            ...(task ? { mode: "pomodoro" as const, focus: clamp(task.minutes, 1, 120, timer.focus) } : {}),
          });
          return true;
        },

        startTimer: () => {
          const { timer, tasks } = get();
          if (!timer.topicId) return false;
          const startingTask = timer.phase === "focus" && timer.taskId;
          set({
            timer: startTimer(timer, Date.now()),
            ...(startingTask
              ? { tasks: tasks.map((task) => (task.id === timer.taskId && task.status === "planejada" ? { ...task, status: "iniciada" as const } : task)) }
              : {}),
          });
          return true;
        },

        pauseTimer: () => set({ timer: pauseTimer(get().timer, Date.now()) }),

        // Zera o timer no mesmo `set` que grava: um segundo clique encontra o timer vazio e não duplica a sessão.
        finishTimer: () => {
          const data = get();
          if (data.timer.phase !== "focus") return null;
          const now = Date.now();
          const state: SessionState = data.timer.mode === "pomodoro" ? "interrompida" : "concluida";
          const { session, changes } = recordSession(data, elapsed(data.timer, now), state, now);
          set({ ...changes, timer: resetTimer(data.timer) });
          if (session) get().trackEvent("sessao_registrada");
          return session;
        },

        discardTimer: () => set({ timer: resetTimer(get().timer) }),

        skipBreak: () => set({ timer: resetTimer(get().timer) }),

        tick: () => {
          const data = get();
          const now = Date.now();
          if (!isPhaseOver(data.timer, now)) return null;
          if (data.timer.phase === "break") {
            set({ timer: nextPhase(data.timer) });
            return { kind: "break-done" };
          }
          const { session, changes } = recordSession(data, phaseSeconds(data.timer), "concluida", now);
          set({ ...changes, timer: nextPhase(data.timer) });
          if (session) get().trackEvent("sessao_registrada");
          return { kind: "focus-done", session };
        },

        deleteSession: (sessionId) => set({ sessions: get().sessions.filter((session) => session.id !== sessionId) }),
        setSessionReflection: (sessionId, reflection) => updateSession(sessionId, { reflection }),
        setSessionNote: (sessionId, note) => updateSession(sessionId, { note: note.trim().slice(0, NOTE_MAX) || undefined }),

        savePlanner: (settings) => {
          const error = validateAvailability(settings.availability);
          if (error) return error;
          set({ planner: { ...settings, sessionMinutes: clamp(settings.sessionMinutes, 15, 120, 50) } });
          return null;
        },

        finishOnboarding: (settings, planMode) => {
          const error = get().savePlanner(settings);
          if (error) return error;
          set({ onboarding: { status: "concluido", planMode } });
          get().trackEvent("onboarding_concluido");
          if (planMode === "sugerido") get().regeneratePlan();
          return null;
        },

        skipOnboarding: () => {
          set({ onboarding: { ...get().onboarding, status: "pulado" } });
          get().trackEvent("onboarding_pulado");
        },

        regeneratePlan: () => {
          const { topics, progress, tasks, planner } = get();
          const result = generatePlan({ today: today(), topics, progress, tasks, settings: planner, newId: () => newId("task-") });
          set({ tasks: result.tasks });
          get().trackEvent("plano_gerado");
          return result;
        },

        addTask: (input) => {
          const error = validateTask(input, today());
          if (error) return error;
          const topic = findTopic(get().topics, input.topicId);
          const task: PlanTask = {
            id: newId("task-"),
            topicId: topic?.id ?? null,
            areaId: topic?.areaId ?? null,
            kind: "estudo",
            date: input.date,
            minutes: input.minutes,
            priority: input.priority,
            status: "planejada",
            origin: "manual",
            focusSec: 0,
          };
          set({ tasks: [...get().tasks, task] });
          return null;
        },

        moveTask: (taskId, date) => {
          if (date !== null && (!isDateKey(date) || date < today())) return false;
          set({ tasks: rescheduleTask(get().tasks, taskId, date) });
          return true;
        },

        setTaskDone: (taskId, done) =>
          set({
            tasks: get().tasks.map((task) =>
              task.id === taskId ? { ...task, status: done ? "concluida" : task.focusSec > 0 ? "iniciada" : "planejada" } : task,
            ),
          }),

        splitPlanTask: (taskId) =>
          set({ tasks: splitTask(get().tasks, taskId, get().planner, today(), () => newId("task-")) }),

        lowerTaskPriority: (taskId) =>
          set({
            tasks: get().tasks.map((task) => (task.id === taskId ? { ...task, priority: lowerPriority(task.priority) } : task)),
          }),

        removeTask: (taskId) => {
          const { tasks, timer } = get();
          set({
            tasks: tasks.filter((task) => task.id !== taskId),
            ...(timer.taskId === taskId ? { timer: { ...timer, taskId: "" } } : {}),
          });
        },

        exportBackup: () => JSON.stringify(toStudyData(get()), null, 2),

        importBackup: (raw) => {
          const data = parseBackup(raw);
          if (!data) return "Este arquivo não parece um backup do ENEM Flow.";
          set({ ...data, demo: false, timer: resetTimer(data.timer) });
          return null;
        },

        resetData: () =>
          set({
            ...emptyData(),
            theme: get().theme,
            sound: get().sound,
            showStreak: get().showStreak,
            analyticsConsent: get().analyticsConsent,
          }),
      };
    },
    {
      name: STORAGE_KEY,
      version: 2,
      storage: rawStorage,
      partialize: (state) => toStudyData(state),
    },
  ),
);

// Regrava o estado atual; usado pelo aviso de falha ao salvar.
export function retrySave() {
  useStudyStore.setState({});
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    useStudyStore.persist.onFinishHydration,
    useStudyStore.persist.hasHydrated,
    () => false,
  );
}
