import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import { toDateKey } from "@/lib/dates";
import {
  changeStatus,
  completeNextReview,
  progressOf,
  type Mastery,
  type ProgressMap,
  type TopicProgress,
  type TopicStatus,
} from "@/lib/reviews";
import type { StudySession } from "@/lib/stats";
import {
  DEFAULT_TIMER,
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
import { createDemoData } from "./demo-data";
import { STORAGE_KEY } from "./storage-key";

export type Theme = "system" | "light" | "dark";

export interface StudyData {
  version: 1;
  demo: boolean;
  progress: ProgressMap;
  sessions: StudySession[];
  goal: number;
  theme: Theme;
  timer: TimerState;
}

type TickResult = "focus-done" | "break-done" | null;

interface StudyActions {
  setStatus: (topicId: string, status: TopicStatus) => TopicProgress;
  toggleMastery: (topicId: string, level: Mastery) => void;
  completeReview: (topicId: string) => TopicProgress;
  setGoal: (hours: number) => void;
  setTheme: (theme: Theme) => void;
  setTimerMode: (mode: TimerMode) => void;
  setTimerTopic: (topicId: string) => void;
  setFocusMinutes: (minutes: number) => void;
  setBreakMinutes: (minutes: number) => void;
  studyTopic: (topicId: string) => boolean;
  startTimer: () => boolean;
  pauseTimer: () => void;
  finishTimer: () => number | null;
  skipBreak: () => void;
  tick: () => TickResult;
  deleteSession: (sessionId: string) => void;
  resetData: () => void;
}

type StudyStore = StudyData & StudyActions;

export function emptyData(): StudyData {
  return { version: 1, demo: false, progress: {}, sessions: [], goal: 25, theme: "system", timer: DEFAULT_TIMER };
}

export function parseSavedData(raw: string | null, today: string): StudyData {
  if (raw === null) return { ...emptyData(), demo: true, ...createDemoData(today) };
  try {
    const saved = JSON.parse(raw);
    if (saved?.version !== 1) return emptyData();
    // A primeira versão do protótipo salvava o timer em outro formato.
    const timer: TimerState =
      saved.timer && "banked" in saved.timer
        ? { ...DEFAULT_TIMER, ...saved.timer }
        : { ...DEFAULT_TIMER, topicId: saved.timer?.topicId ?? "" };
    return {
      version: 1,
      demo: Boolean(saved.demo),
      progress: saved.progress ?? {},
      sessions: saved.sessions ?? [],
      goal: saved.goal ?? 25,
      theme: saved.theme ?? "system",
      timer,
    };
  } catch {
    return emptyData();
  }
}

// Grava o estado cru, sem o envelope do persist, para manter o formato do protótipo.
// Se o localStorage falhar (modo privado, cota), a app segue só em memória.
const rawStorage: PersistStorage<StudyData> = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    let raw: string | null;
    try {
      raw = localStorage.getItem(name);
    } catch {
      return { state: emptyData(), version: 1 };
    }
    return { state: parseSavedData(raw, toDateKey(new Date())), version: 1 };
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value.state));
    } catch {}
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
}

function withSession(data: StudyData, seconds: number, now: number): Pick<StudyData, "sessions" | "progress"> {
  const { topicId, mode } = data.timer;
  const session: StudySession = {
    id: newId(),
    topicId,
    date: toDateKey(new Date(now)),
    sec: Math.round(seconds),
    mode,
    ts: now,
  };
  const current = progressOf(data.progress, topicId);
  const progress =
    current.status === "nao" ? { ...data.progress, [topicId]: { ...current, status: "and" as const } } : data.progress;
  return { sessions: [...data.sessions, session], progress };
}

export const useStudyStore = create<StudyStore>()(
  persist(
    (set, get) => {
      const updateTimer = (changes: Partial<TimerState>) => set({ timer: { ...get().timer, ...changes } });
      const updateIdleTimer = (changes: Partial<TimerState>) => {
        if (isIdle(get().timer)) updateTimer(changes);
      };

      return {
        ...emptyData(),

        setStatus: (topicId, status) => {
          const updated = changeStatus(progressOf(get().progress, topicId), status, toDateKey(new Date()));
          set({ progress: { ...get().progress, [topicId]: updated } });
          return updated;
        },

        toggleMastery: (topicId, level) => {
          const current = progressOf(get().progress, topicId);
          const mastery = current.mastery === level ? 0 : level;
          set({ progress: { ...get().progress, [topicId]: { ...current, mastery } } });
        },

        completeReview: (topicId) => {
          const updated = completeNextReview(progressOf(get().progress, topicId), toDateKey(new Date()));
          set({ progress: { ...get().progress, [topicId]: updated } });
          return updated;
        },

        setGoal: (hours) => set({ goal: clamp(hours, 1, 100, get().goal) }),
        setTheme: (theme) => set({ theme }),

        setTimerMode: (mode) => updateIdleTimer({ mode }),
        setTimerTopic: (topicId) => {
          if (!get().timer.running) updateTimer({ topicId });
        },
        setFocusMinutes: (minutes) => updateIdleTimer({ focus: clamp(minutes, 1, 120, 25) }),
        setBreakMinutes: (minutes) => updateIdleTimer({ brk: clamp(minutes, 1, 60, 5) }),

        studyTopic: (topicId) => {
          if (get().timer.running) return false;
          updateTimer({ topicId });
          return true;
        },

        startTimer: () => {
          const { timer } = get();
          if (!timer.topicId) return false;
          set({ timer: startTimer(timer, Date.now()) });
          return true;
        },

        pauseTimer: () => set({ timer: pauseTimer(get().timer, Date.now()) }),

        finishTimer: () => {
          const data = get();
          const now = Date.now();
          const seconds = elapsed(data.timer, now);
          const recorded = seconds >= 60 && Boolean(data.timer.topicId);
          set({ ...(recorded ? withSession(data, seconds, now) : {}), timer: resetTimer(data.timer) });
          return recorded ? seconds : null;
        },

        skipBreak: () => set({ timer: resetTimer(get().timer) }),

        tick: () => {
          const data = get();
          const now = Date.now();
          if (!isPhaseOver(data.timer, now)) return null;
          if (data.timer.phase === "break") {
            set({ timer: nextPhase(data.timer, now) });
            return "break-done";
          }
          set({ ...withSession(data, phaseSeconds(data.timer), now), timer: nextPhase(data.timer, now) });
          return "focus-done";
        },

        deleteSession: (sessionId) =>
          set({ sessions: get().sessions.filter((session) => session.id !== sessionId) }),

        resetData: () => set({ ...emptyData(), theme: get().theme }),
      };
    },
    {
      name: STORAGE_KEY,
      version: 1,
      storage: rawStorage,
      partialize: ({ version, demo, progress, sessions, goal, theme, timer }) => ({
        version,
        demo,
        progress,
        sessions,
        goal,
        theme,
        timer,
      }),
    },
  ),
);

export function useHydrated(): boolean {
  return useSyncExternalStore(
    useStudyStore.persist.onFinishHydration,
    useStudyStore.persist.hasHydrated,
    () => false,
  );
}
