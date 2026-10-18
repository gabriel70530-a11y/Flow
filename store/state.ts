import { DEFAULT_PLANNER, type PlanTask, type PlannerSettings } from "@/lib/planner";
import type { ProgressMap } from "@/lib/reviews";
import type { StudySession } from "@/lib/sessions";
import { DEFAULT_GOAL, type WeeklyGoal } from "@/lib/stats";
import { DEFAULT_TIMER, type TimerState } from "@/lib/timer";
import type { TopicRecord } from "@/lib/topics";

export type Theme = "system" | "light" | "dark";

export interface OnboardingState {
  status: "pendente" | "concluido" | "pulado";
  planMode: "sugerido" | "manual";
}

export interface StudyData {
  version: 2;
  demo: boolean;
  topics: TopicRecord[];
  progress: ProgressMap;
  sessions: StudySession[];
  tasks: PlanTask[];
  goal: WeeklyGoal;
  planner: PlannerSettings;
  onboarding: OnboardingState;
  theme: Theme;
  sound: boolean;
  showStreak: boolean;
  analyticsConsent: boolean;
  timer: TimerState;
}

export function emptyData(): StudyData {
  return {
    version: 2,
    demo: false,
    topics: [],
    progress: {},
    sessions: [],
    tasks: [],
    goal: DEFAULT_GOAL,
    planner: DEFAULT_PLANNER,
    onboarding: { status: "pendente", planMode: "sugerido" },
    theme: "system",
    sound: true,
    showStreak: true,
    analyticsConsent: false,
    timer: DEFAULT_TIMER,
  };
}
