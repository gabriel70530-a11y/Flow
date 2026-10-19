import type { Essay, RepertoireItem } from "@/lib/essays";
import type { Flashcard } from "@/lib/flashcards";
import type { Mistake } from "@/lib/mistakes";
import type { MockExam } from "@/lib/mock-exams";
import type { ExamDraft } from "@/lib/official-exams";
import { DEFAULT_PLANNER, type PlanTask, type PlannerSettings } from "@/lib/planner";
import type { QuestionBlock } from "@/lib/question-blocks";
import { DEFAULT_REMINDER, type ReminderSettings } from "@/lib/reminders";
import type { ProgressMap } from "@/lib/reviews";
import type { StudySession } from "@/lib/sessions";
import { DEFAULT_GOAL, type WeeklyGoal } from "@/lib/stats";
import { DEFAULT_TIMER, type TimerState } from "@/lib/timer";
import type { TimesTableStats } from "@/lib/times-table";
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
  mistakes: Mistake[];
  mockExams: MockExam[];
  essays: Essay[];
  repertoire: RepertoireItem[];
  questionBlocks: QuestionBlock[];
  flashcards: Flashcard[];
  // Itens já conferidos no checklist do dia da prova.
  examChecklist: string[];
  // Contas da tabuada: acertos, erros e acertos rápidos seguidos.
  timesTable: TimesTableStats;
  goal: WeeklyGoal;
  planner: PlannerSettings;
  onboarding: OnboardingState;
  theme: Theme;
  sound: boolean;
  showStreak: boolean;
  // Guia de boas-vindas já visto (sincroniza: não aparece de novo em outro aparelho).
  guideSeen: boolean;
  // Horário de estudo para os lembretes (sincroniza); ligar os avisos é de cada aparelho.
  reminder: ReminderSettings;
  remindersOn: boolean;
  analyticsConsent: boolean;
  timer: TimerState;
  // Simulado oficial em andamento neste aparelho (não sincroniza, como o timer).
  examDraft: ExamDraft | null;
}

export function emptyData(): StudyData {
  return {
    version: 2,
    demo: false,
    topics: [],
    progress: {},
    sessions: [],
    tasks: [],
    mistakes: [],
    mockExams: [],
    essays: [],
    repertoire: [],
    questionBlocks: [],
    flashcards: [],
    examChecklist: [],
    timesTable: {},
    goal: DEFAULT_GOAL,
    planner: DEFAULT_PLANNER,
    onboarding: { status: "pendente", planMode: "sugerido" },
    theme: "system",
    sound: true,
    showStreak: true,
    guideSeen: false,
    reminder: DEFAULT_REMINDER,
    remindersOn: false,
    analyticsConsent: false,
    timer: DEFAULT_TIMER,
    examDraft: null,
  };
}
