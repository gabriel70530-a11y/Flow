import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import { isDateKey, toDateKey } from "@/lib/dates";
import { validateEssay, validateRepertoire, type EssayInput, type RepertoireInput } from "@/lib/essays";
import { checklistIds, type ExamDay } from "@/lib/exam";
import {
  MISTAKES_TO_SUGGEST_REVIEW,
  createMistake,
  openMistakesOnTopic,
  reviewMistake,
  validateMistake,
  type MistakeInput,
} from "@/lib/mistakes";
import { validateMockExam, type MockExamInput } from "@/lib/mock-exams";
import {
  answerDraft,
  draftSeconds,
  findOfficialExam,
  gradeExam,
  officialExamTitle,
  pauseDraft,
  resumeDraft,
  startDraft,
  type ForeignLanguage,
  type GradedExam,
  type Letter,
  type WrongAnswer,
} from "@/lib/official-exams";
import {
  applyFocusToTask,
  carryOverMissed,
  dayConflict,
  generatePlan,
  lightenDay,
  lowerPriority,
  repeatNextDay,
  rescheduleTask,
  validateStudyDays,
  validateTask,
  type PlanResult,
  type PlanTask,
  type PlannerSettings,
  type RepeatResult,
  type TaskInput,
} from "@/lib/planner";
import {
  changeStatus,
  completeNextReview,
  postponeNextReview,
  progressOf,
  rescheduleNextReview,
  scheduleManualReview,
  type Mastery,
  type ReviewFeedback,
  type TopicProgress,
  type TopicStatus,
} from "@/lib/reviews";
import {
  GENERAL_STUDY,
  NOTE_MAX,
  createSession,
  parseStudyChoice,
  type Reflection,
  type SessionState,
  type StudySession,
} from "@/lib/sessions";
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
  setTopicHidden,
  updateTopic,
  validateTopic,
  type TopicInput,
} from "@/lib/topics";
import { track, type AnalyticsEvent } from "./analytics";
import { loadData, parseBackup } from "./migrate";
import { proAccessNow } from "./pro";
import { emptyData, type OnboardingState, type StudyData, type Theme } from "./state";
import { CORRUPT_STORAGE_KEY, LEGACY_STORAGE_KEY, STORAGE_KEY } from "./storage-key";

export type { StudyData, Theme } from "./state";

type TickResult = { kind: "focus-done"; session: StudySession | null } | { kind: "break-done" } | null;

interface StudyActions {
  addTopic: (input: TopicInput) => { error: string } | { id: string };
  editTopic: (id: string, input: TopicInput) => string | null;
  setTopicHidden: (id: string, hidden: boolean) => void;
  removeTopic: (id: string) => void;

  setStatus: (topicId: string, status: TopicStatus) => TopicProgress;
  setMastery: (topicId: string, level: Mastery) => void;
  markStudied: (topicIds: string[]) => number;

  completeReview: (topicId: string, feedback?: ReviewFeedback) => TopicProgress;
  setReviewFeedback: (topicId: string, stage: number, feedback: ReviewFeedback) => void;
  postponeReview: (topicId: string) => void;
  rescheduleReview: (topicId: string, date: string) => boolean;
  scheduleReview: (topicId: string, date: string) => string | null;

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
  studyTopic: (topicId: string, taskId?: string) => boolean;
  startTimer: () => boolean;
  pauseTimer: () => void;
  finishTimer: () => StudySession | null;
  discardTimer: () => void;
  skipBreak: () => void;
  tick: () => TickResult;

  deleteSession: (sessionId: string) => void;
  setSessionReflection: (sessionId: string, reflection: Reflection) => void;
  setSessionNote: (sessionId: string, note: string) => void;
  setSessionDistracted: (sessionId: string, distracted: boolean) => void;

  addMistake: (input: MistakeInput) => { error: string } | { id: string; suggestReview: boolean };
  answerMistake: (mistakeId: string, remembered: boolean) => void;
  removeMistake: (mistakeId: string) => void;

  addMockExam: (input: MockExamInput) => string | null;
  removeMockExam: (mockId: string) => void;
  startExam: (examId: string, language: ForeignLanguage) => string | null;
  answerExam: (index: number, letter: Letter | null) => void;
  pauseExam: () => void;
  resumeExam: () => void;
  discardExam: () => void;
  finishExam: () => { error: string } | { graded: GradedExam; examId: string };
  addExamMistakes: (examId: string, wrong: readonly WrongAnswer[]) => number;

  addEssay: (input: EssayInput) => string | null;
  removeEssay: (essayId: string) => void;
  addRepertoire: (input: RepertoireInput) => string | null;
  removeRepertoire: (itemId: string) => void;

  toggleChecklistItem: (itemId: string) => void;
  resetChecklist: (day: ExamDay) => void;

  savePlanner: (settings: PlannerSettings) => string | null;
  finishOnboarding: (settings: PlannerSettings, planMode: OnboardingState["planMode"]) => string | null;
  skipOnboarding: () => void;
  regeneratePlan: () => PlanResult;
  addTask: (input: TaskInput) => string | null;
  moveTask: (taskId: string, date: string | null) => string | null;
  setTaskDone: (taskId: string, done: boolean) => void;
  answerMastery: (taskId: string, mastered: boolean) => RepeatResult | null;
  carryOver: () => PlanTask[];
  lightenToday: () => PlanTask[];
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
    const { data, corrupt } = loadData({ current, legacy: readItem(LEGACY_STORAGE_KEY) });
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
    mistakes: state.mistakes,
    mockExams: state.mockExams,
    essays: state.essays,
    repertoire: state.repertoire,
    examChecklist: state.examChecklist,
    goal: state.goal,
    planner: state.planner,
    onboarding: state.onboarding,
    theme: state.theme,
    sound: state.sound,
    showStreak: state.showStreak,
    analyticsConsent: state.analyticsConsent,
    timer: state.timer,
    examDraft: state.examDraft,
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
          if (error) return error;
          const topics = updateTopic(get().topics, id, input);
          const { areaId, subjectId } = findTopic(topics, id) ?? input;
          // As tarefas do tópico acompanham a troca de área ou matéria.
          set({ topics, tasks: get().tasks.map((task) => (task.topicId === id ? { ...task, areaId, subjectId } : task)) });
          return null;
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

        setStatus: (topicId, status) =>
          updateProgress(topicId, (current) => changeStatus(current, status, today(), proAccessNow())),

        // Para o que já foi estudado antes: marca como Concluído e agenda as revisões de 1, 7, 15 e 30 dias a partir de hoje.
        markStudied: (topicIds) => {
          const { progress, topics } = get();
          const pending = topicIds.filter(
            (topicId) => findTopic(topics, topicId) && progressOf(progress, topicId).status !== "concluido",
          );
          for (const topicId of pending) get().setStatus(topicId, "concluido");
          return pending.length;
        },

        setMastery: (topicId, level) => updateProgress(topicId, (current) => ({ ...current, mastery: level })),

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

        scheduleReview: (topicId, date) => {
          if (!findTopic(get().topics, topicId)) return "Escolha o tópico.";
          if (!isDateKey(date) || date < today()) return "Escolha hoje ou uma data futura.";
          updateProgress(topicId, (current) => scheduleManualReview(current, date, today()));
          return null;
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

        // Tarefa do cronograma abre no cronômetro: o tempo não tem limite, o estudante para quando sentir que dominou.
        studyTopic: (topicId, taskId) => {
          const { timer } = get();
          if (timer.running || !isIdle(timer)) return false;
          updateTimer({ topicId, taskId: taskId ?? "", ...(taskId ? { mode: "cronometro" as const } : {}) });
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
        setSessionDistracted: (sessionId, distracted) => updateSession(sessionId, { distracted }),

        // Dois erros em aberto no mesmo tópico sugerem marcá-lo como "Precisa revisar"; a pessoa decide.
        addMistake: (input) => {
          const error = validateMistake(input);
          if (error) return { error };
          const mistake = createMistake(input, newId("erro-"), today());
          const mistakes = [...get().mistakes, mistake];
          set({ mistakes });
          const status = input.topicId ? progressOf(get().progress, input.topicId).status : null;
          const suggestReview =
            input.topicId !== null &&
            status !== "revisar" &&
            openMistakesOnTopic(mistakes, input.topicId) >= MISTAKES_TO_SUGGEST_REVIEW;
          return { id: mistake.id, suggestReview };
        },

        answerMistake: (mistakeId, remembered) =>
          set({
            mistakes: get().mistakes.map((mistake) => (mistake.id === mistakeId ? reviewMistake(mistake, today(), remembered) : mistake)),
          }),

        removeMistake: (mistakeId) => set({ mistakes: get().mistakes.filter((mistake) => mistake.id !== mistakeId) }),

        addMockExam: (input) => {
          const error = validateMockExam(input, today());
          if (error) return error;
          set({ mockExams: [...get().mockExams, { ...input, note: input.note.trim(), id: newId("simulado-") }] });
          return null;
        },
        removeMockExam: (mockId) => set({ mockExams: get().mockExams.filter((mock) => mock.id !== mockId) }),

        startExam: (examId, language) => {
          if (!proAccessNow()) return "O simulado no app faz parte do Pro.";
          if (!findOfficialExam(examId)) return "Escolha uma prova.";
          if (get().examDraft) return "Termine ou descarte o simulado em andamento.";
          set({ examDraft: startDraft(examId, language, Date.now()) });
          return null;
        },
        answerExam: (index, letter) => {
          const draft = get().examDraft;
          if (draft) set({ examDraft: answerDraft(draft, index, letter) });
        },
        pauseExam: () => {
          const draft = get().examDraft;
          if (draft) set({ examDraft: pauseDraft(draft, Date.now()) });
        },
        resumeExam: () => {
          const draft = get().examDraft;
          if (draft) set({ examDraft: resumeDraft(draft, Date.now()) });
        },
        discardExam: () => set({ examDraft: null }),

        // Corrige pelo gabarito oficial e registra como simulado. Sem nota TRI: só acertos e ritmo.
        finishExam: () => {
          const draft = get().examDraft;
          const exam = draft && findOfficialExam(draft.examId);
          if (!draft || !exam) return { error: "Nenhum simulado em andamento." };
          const graded = gradeExam(exam, draft.answers, draft.language);
          const minutes = Math.round(draftSeconds(draft, Date.now()) / 60);
          const mock = {
            id: newId("simulado-"),
            date: today(),
            day: exam.day,
            minutes: minutes >= 1 ? Math.min(minutes, 600) : null,
            sections: graded.sections,
            note: `${officialExamTitle(exam)}, feito no Flow.`,
          };
          set({ mockExams: [...get().mockExams, mock], examDraft: null });
          return { graded, examId: exam.id };
        },

        // O motivo de cada erro só a pessoa sabe; entra como conteúdo e a questão pede para refazer e descobrir.
        addExamMistakes: (examId, wrong) => {
          const exam = findOfficialExam(examId);
          if (!exam || wrong.length === 0) return 0;
          const created = wrong.map((item, index) =>
            createMistake(
              {
                topicId: null,
                areaId: item.areaId,
                subjectId: null,
                reason: "conteudo",
                question: `Questão ${item.number}: ${item.marked ? `você marcou ${item.marked}` : "ficou em branco"}, a resposta é ${item.correct}. Refaça e descubra onde errou.`,
                lesson: "",
                source: `Enem ${exam.year}, questão ${item.number}`,
              },
              newId(`erro-${index}-`),
              today(),
            ),
          );
          set({ mistakes: [...get().mistakes, ...created] });
          return created.length;
        },

        addEssay: (input) => {
          const error = validateEssay(input, today());
          if (error) return error;
          const essay = { ...input, theme: input.theme.trim(), corrector: input.corrector.trim(), improve: input.improve.trim() };
          set({ essays: [...get().essays, { ...essay, id: newId("redacao-") }] });
          return null;
        },
        removeEssay: (essayId) => set({ essays: get().essays.filter((essay) => essay.id !== essayId) }),

        addRepertoire: (input) => {
          const error = validateRepertoire(input);
          if (error) return error;
          const item = { title: input.title.trim(), detail: input.detail.trim(), themes: input.themes.trim() };
          set({ repertoire: [...get().repertoire, { ...item, id: newId("repertorio-") }] });
          return null;
        },
        removeRepertoire: (itemId) => set({ repertoire: get().repertoire.filter((item) => item.id !== itemId) }),

        toggleChecklistItem: (itemId) => {
          const checked = get().examChecklist;
          set({ examChecklist: checked.includes(itemId) ? checked.filter((id) => id !== itemId) : [...checked, itemId] });
        },
        resetChecklist: (day) => {
          const ids = checklistIds(day);
          set({ examChecklist: get().examChecklist.filter((id) => !ids.includes(id)) });
        },

        savePlanner: (settings) => {
          const error = validateStudyDays(settings.studyDays);
          if (error) return error;
          set({ planner: settings });
          return null;
        },

        finishOnboarding: (settings, planMode) => {
          const error = get().savePlanner(settings);
          if (error) return error;
          set({ onboarding: { status: "concluido", planMode } });
          get().trackEvent("onboarding_concluido");
          if (planMode === "sugerido" && proAccessNow()) get().regeneratePlan();
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
          const choice = parseStudyChoice(input.topicId ?? GENERAL_STUDY, get().topics);
          const conflict = dayConflict(get().tasks, input.date, choice);
          if (conflict) return conflict;
          const task: PlanTask = {
            id: newId("task-"),
            ...choice,
            kind: "estudo",
            date: input.date,
            priority: input.priority,
            status: "planejada",
            origin: "manual",
            focusSec: 0,
          };
          set({ tasks: [...get().tasks, task] });
          return null;
        },

        moveTask: (taskId, date) => {
          const task = get().tasks.find((item) => item.id === taskId);
          if (!task) return "Tarefa não encontrada.";
          if (date !== null) {
            if (!isDateKey(date) || date < today()) return "Escolha hoje ou uma data futura.";
            const conflict = dayConflict(get().tasks, date, task, taskId);
            if (conflict) return conflict;
          }
          set({ tasks: rescheduleTask(get().tasks, taskId, date) });
          return null;
        },

        setTaskDone: (taskId, done) =>
          set({
            tasks: get().tasks.map((task) =>
              task.id === taskId
                ? { ...task, status: done ? "concluida" : task.focusSec > 0 ? "iniciada" : "planejada", outcome: undefined }
                : task,
            ),
          }),

        // "Dominei" fecha a tarefa e conclui o tópico (ou a revisão). "Ainda não" fecha o dia e repete a matéria no dia seguinte.
        answerMastery: (taskId, mastered) => {
          const task = get().tasks.find((item) => item.id === taskId);
          if (!task || task.status === "concluida") return null;
          const outcome = mastered ? ("dominada" as const) : ("repetir" as const);
          const tasks = get().tasks.map((item) => (item.id === taskId ? { ...item, status: "concluida" as const, outcome } : item));
          if (mastered) {
            set({ tasks });
            if (task.topicId && task.kind === "revisao") get().completeReview(task.topicId, "bem");
            else if (task.topicId) get().setStatus(task.topicId, "concluido");
            return null;
          }
          const result = repeatNextDay(tasks, task, get().planner, today(), () => newId("task-"));
          set({ tasks: result.tasks });
          return result;
        },

        carryOver: () => {
          const result = carryOverMissed(get().tasks, get().planner, today());
          if (result.moved.length) set({ tasks: result.tasks });
          return result.moved;
        },

        lightenToday: () => {
          const result = lightenDay(get().tasks, get().planner, today());
          if (result.moved.length) set({ tasks: result.tasks });
          return result.moved;
        },

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
          if (!data) return "Este arquivo não parece um backup do Flow.";
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
