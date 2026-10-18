import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlanTask } from "@/lib/planner";
import { GENERAL_STUDY } from "@/lib/sessions";
import { legacyTopics } from "@/lib/legacy-topics";
import { findTopic } from "@/lib/topics";
import { emptyData } from "./state";
import { useStudyStore } from "./study-store";

const today = "2026-10-16";
const start = new Date(2026, 9, 16, 10, 0, 0);
const advance = (seconds: number) => vi.setSystemTime(start.getTime() + seconds * 1000);
const state = () => useStudyStore.getState();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(start);
  useStudyStore.setState({ ...emptyData(), topics: legacyTopics() });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("timer and sessions", () => {
  it("does not start without choosing what to study", () => {
    expect(state().startTimer()).toBe(false);
    expect(state().timer.running).toBe(false);
  });

  it("records focus time without pauses and never duplicates on repeated finish", () => {
    state().setTimerTopic("mat-2");
    state().startTimer();
    advance(600);
    state().pauseTimer();
    advance(900);
    state().startTimer();
    advance(1200);

    expect(state().finishTimer()?.sec).toBe(900);
    expect(state().finishTimer()).toBeNull();
    expect(state().sessions).toHaveLength(1);
    expect(state().sessions[0]).toMatchObject({
      topicId: "mat-2",
      areaId: "mat",
      date: today,
      sec: 900,
      start: start.getTime(),
      end: start.getTime() + 1_200_000,
      state: "interrompida",
    });
    expect(state().progress["mat-2"].status).toBe("and");
  });

  it("records general study without area and finishes the stopwatch as concluded", () => {
    state().setTimerMode("cronometro");
    state().setTimerTopic(GENERAL_STUDY);
    state().startTimer();
    advance(300);
    expect(state().finishTimer()).toMatchObject({ topicId: null, areaId: null, state: "concluida", mode: "cronometro" });
  });

  it("discards without recording", () => {
    state().setTimerTopic("mat-2");
    state().startTimer();
    advance(600);
    state().discardTimer();
    expect(state().sessions).toEqual([]);
    expect(state().timer.running).toBe(false);
  });

  it("offers the break after a focus block and the next block after the break", () => {
    state().setTimerTopic("lin-0");
    state().startTimer();
    advance(25 * 60 - 1);
    expect(state().tick()).toBeNull();

    advance(25 * 60 + 3);
    expect(state().tick()).toMatchObject({ kind: "focus-done", session: { topicId: "lin-0", sec: 1500, state: "concluida" } });
    expect(state().timer).toMatchObject({ phase: "break", running: false });
    expect(state().tick()).toBeNull();

    state().startTimer();
    advance(35 * 60);
    expect(state().tick()).toEqual({ kind: "break-done" });
    expect(state().timer).toMatchObject({ phase: "focus", running: false });
    expect(state().sessions).toHaveLength(1);
  });

  it("locks mode, durations and topic while a session is in progress", () => {
    state().setTimerTopic("mat-2");
    state().startTimer();
    state().setTimerMode("cronometro");
    state().setFocusMinutes(50);
    state().setTimerTopic("lin-0");
    expect(state().studyTopic("lin-0")).toBe(false);
    expect(state().timer).toMatchObject({ mode: "pomodoro", focus: 25, topicId: "mat-2" });
  });

  it("opens a plan task in the stopwatch with no time limit and only closes it by mastery", () => {
    const task: PlanTask = {
      id: "t1", topicId: "nat-1", areaId: "nat", kind: "estudo", date: today,
      priority: "media", status: "planejada", origin: "gerada", focusSec: 0,
    };
    useStudyStore.setState({ tasks: [task] });
    expect(state().studyTopic("nat-1", "t1")).toBe(true);
    expect(state().timer).toMatchObject({ topicId: "nat-1", taskId: "t1", mode: "cronometro" });

    state().startTimer();
    expect(state().tasks[0].status).toBe("iniciada");
    advance(2 * 60 * 60);
    state().finishTimer();
    expect(state().tasks[0]).toMatchObject({ status: "iniciada", focusSec: 7200 });

    const result = state().answerMastery("t1", false);
    expect(state().tasks[0].status).toBe("concluida");
    expect(result?.repeat).toMatchObject({ topicId: "nat-1", date: "2026-10-17", origin: "repeticao", status: "planejada" });
    expect(state().progress["nat-1"].status).toBe("and");

    expect(state().answerMastery(result!.repeat.id, true)).toBeNull();
    expect(state().progress["nat-1"].status).toBe("concluido");
    expect(state().progress["nat-1"].reviews).toHaveLength(4);
    expect(state().answerMastery("t1", true)).toBeNull();
  });

  it("completes the review when a review task is mastered", () => {
    state().setStatus("lin-0", "concluido");
    const task: PlanTask = {
      id: "r1", topicId: "lin-0", areaId: "lin", kind: "revisao", date: today,
      priority: "media", status: "planejada", origin: "gerada", focusSec: 0,
    };
    useStudyStore.setState({ tasks: [task] });
    state().answerMastery("r1", true);
    expect(state().progress["lin-0"].reviews[0]).toMatchObject({ done: today, feedback: "bem" });
  });

  it("stores reflection and a trimmed note on the session", () => {
    state().setTimerTopic("mat-2");
    state().startTimer();
    advance(600);
    const session = state().finishTimer()!;
    state().setSessionReflection(session.id, "dificuldade");
    state().setSessionNote(session.id, "  revisar regra de três  ");
    expect(state().sessions[0]).toMatchObject({ reflection: "dificuldade", note: "revisar regra de três" });
    expect(state().progress["mat-2"].status).toBe("and");
  });
});

describe("topics", () => {
  it("creates, validates and edits custom topics", () => {
    expect(state().addTopic({ name: " ", areaId: "mat", subjectId: null, description: "", priority: "media" })).toEqual({
      error: "Dê um nome ao tópico.",
    });
    const result = state().addTopic({ name: "Matrizes", areaId: "mat", subjectId: null, description: "", priority: "alta" });
    if (!("id" in result)) throw new Error(result.error);
    expect(result.id).toMatch(/^custom-/);
    expect(state().editTopic(result.id, { name: "Probabilidade", areaId: "mat", subjectId: null, description: "", priority: "alta" })).toMatch(/Já existe/);
    expect(state().topics).toHaveLength(45);
  });

  it("keeps sessions when hiding or deleting a topic", () => {
    const result = state().addTopic({ name: "Matrizes", areaId: "mat", subjectId: null, description: "", priority: "alta" });
    if (!("id" in result)) throw new Error(result.error);
    state().setTimerTopic(result.id);
    state().startTimer();
    advance(600);
    state().finishTimer();

    state().setTopicHidden(result.id, true);
    expect(state().sessions).toHaveLength(1);
    state().removeTopic(result.id);
    expect(findTopic(state().topics, result.id)).toBeUndefined();
    expect(state().progress[result.id]).toBeUndefined();
    expect(state().sessions[0]).toMatchObject({ topicId: result.id, areaId: "mat" });
  });

  it("deletes any topic", () => {
    state().removeTopic("mat-0");
    expect(findTopic(state().topics, "mat-0")).toBeUndefined();
  });
});

describe("reviews and settings", () => {
  it("rejects rescheduling to the past", () => {
    state().setStatus("mat-0", "concluido");
    expect(state().rescheduleReview("mat-0", "2026-10-01")).toBe(false);
    expect(state().rescheduleReview("mat-0", "2026-10-20")).toBe(true);
    expect(state().progress["mat-0"].reviews[0].due).toBe("2026-10-20");
  });

  it("clamps the weekly goal per type and the durations", () => {
    state().setGoal({ type: "horas", value: 500 });
    expect(state().goal).toEqual({ type: "horas", value: 100 });
    state().setGoal({ type: "topicos", value: 0 });
    expect(state().goal).toEqual({ type: "topicos", value: 5 });
    state().setFocusMinutes(0);
    state().setBreakMinutes(90);
    expect(state().timer).toMatchObject({ focus: 25, brk: 60 });
  });

  it("sets and clears the mastery level", () => {
    state().setMastery("nat-1", 3);
    expect(state().progress["nat-1"].mastery).toBe(3);
    state().setMastery("nat-1", 0);
    expect(state().progress["nat-1"].mastery).toBe(0);
  });

  it("keeps interface preferences when resetting the data", () => {
    useStudyStore.setState({ demo: true, theme: "dark", sound: false, showStreak: false });
    state().resetData();
    expect(state()).toMatchObject({ demo: false, sessions: [], progress: {}, theme: "dark", sound: false, showStreak: false });
    expect(state().topics).toEqual([]);
  });
});

describe("plan", () => {
  it("finishes onboarding with at most two topics on each chosen day", () => {
    const settings = { ...state().planner, studyDays: [true, true, true, true, true, false, false] };
    expect(state().finishOnboarding(settings, "sugerido")).toBeNull();
    expect(state().onboarding.status).toBe("concluido");
    expect(state().tasks.filter((task) => task.date === today)).toHaveLength(2);
    expect(state().tasks.filter((task) => task.date === "2026-10-17")).toHaveLength(0);
  });

  it("saves preferences without a plan in manual mode and needs at least one study day", () => {
    const none = { ...state().planner, studyDays: Array(7).fill(false) };
    const monday = { ...state().planner, studyDays: [true, false, false, false, false, false, false] };
    expect(state().finishOnboarding(none, "manual")).toMatch(/pelo menos um dia/);
    expect(state().finishOnboarding(monday, "manual")).toBeNull();
    expect(state().tasks).toEqual([]);
  });

  it("keeps completed tasks when regenerating", () => {
    state().regeneratePlan();
    const first = state().tasks[0];
    state().setTaskDone(first.id, true);
    state().regeneratePlan();
    expect(state().tasks.find((task) => task.id === first.id)?.status).toBe("concluida");
    expect(new Set(state().tasks.map((task) => `${task.kind}:${task.topicId}`)).size).toBe(state().tasks.length);
  });

  it("carries topics that were not studied to the next study day", () => {
    const missed: PlanTask = {
      id: "m1", topicId: "mat-3", areaId: "mat", kind: "estudo", date: "2026-10-15",
      priority: "media", status: "planejada", origin: "gerada", focusSec: 0,
    };
    useStudyStore.setState({ tasks: [missed] });
    expect(state().carryOver().map((task) => task.date)).toEqual([today]);
    expect(state().tasks[0]).toMatchObject({ date: today, origin: "transferida" });
    expect(state().carryOver()).toEqual([]);
  });

  it("validates manual tasks, keeps two per day and unlinks the timer when a task is removed", () => {
    expect(state().addTask({ topicId: "mat-0", date: "2026-10-01", priority: "media" })).toMatch(/data/);
    expect(state().addTask({ topicId: "mat-0", date: today, priority: "media" })).toBeNull();
    expect(state().addTask({ topicId: "mat-1", date: today, priority: "media" })).toBeNull();
    expect(state().addTask({ topicId: "mat-2", date: today, priority: "media" })).toMatch(/2 matérias/);
    expect(state().addTask({ topicId: "lin-0", date: "2026-10-17", priority: "media" })).toBeNull();
    expect(state().addTask({ topicId: "mat-2", date: "2026-10-17", priority: "media" })).toMatch(/dia é de Linguagens/);
    expect(state().addTask({ topicId: "area:lin", date: "2026-10-17", priority: "media" })).toBeNull();
    const task = state().tasks[0];
    expect(task).toMatchObject({ origin: "manual", areaId: "mat", status: "planejada" });
    state().studyTopic("mat-0", task.id);
    state().removeTask(task.id);
    expect(state().tasks).toHaveLength(3);
    expect(state().tasks.at(-1)).toMatchObject({ topicId: null, areaId: "lin" });
    expect(state().timer.taskId).toBe("");
  });

  it("moves tasks only to today or later, never to a full day, and to another week", () => {
    state().addTask({ topicId: "mat-0", date: today, priority: "alta" });
    state().addTask({ topicId: "mat-1", date: "2026-10-17", priority: "media" });
    state().addTask({ topicId: "mat-2", date: "2026-10-17", priority: "media" });
    const { id } = state().tasks[0];
    expect(state().moveTask(id, "2026-10-01")).toMatch(/data futura/);
    expect(state().moveTask(id, "2026-10-17")).toMatch(/2 matérias/);
    expect(state().moveTask(id, null)).toBeNull();
    expect(state().tasks[0]).toMatchObject({ date: null, status: "adiada" });
    state().lowerTaskPriority(id);
    expect(state().tasks[0].priority).toBe("media");
  });
});

describe("backup", () => {
  it("exports and imports the data without the running timer", () => {
    state().setTimerTopic("mat-2");
    state().startTimer();
    advance(600);
    state().finishTimer();
    state().startTimer();
    const backup = state().exportBackup();
    expect(JSON.parse(backup)).not.toHaveProperty("addTopic");

    useStudyStore.setState({ ...emptyData(), topics: legacyTopics() });
    expect(state().importBackup("nope")).toMatch(/não parece/);
    expect(state().importBackup(backup)).toBeNull();
    expect(state().sessions).toHaveLength(1);
    expect(state().timer.running).toBe(false);
    expect(state().demo).toBe(false);
  });
});

describe("mastery outcome", () => {
  it("records whether the topic was mastered or will be repeated", () => {
    const base: PlanTask = {
      id: "a", topicId: "mat-3", areaId: "mat", kind: "estudo", date: today,
      priority: "media", status: "planejada", origin: "gerada", focusSec: 0,
    };
    useStudyStore.setState({ tasks: [base, { ...base, id: "b", topicId: "lin-3" }] });
    const repeat = state().answerMastery("a", false)?.repeat;
    state().answerMastery("b", true);
    expect(state().tasks.find((task) => task.id === "a")).toMatchObject({ status: "concluida", outcome: "repetir" });
    expect(state().tasks.find((task) => task.id === "b")).toMatchObject({ status: "concluida", outcome: "dominada" });
    expect(repeat).not.toHaveProperty("outcome");
    state().setTaskDone("a", false);
    expect(state().tasks.find((task) => task.id === "a")?.outcome).toBeUndefined();
  });
});

describe("final stretch tools", () => {
  const mistake = { topicId: "mat-0", areaId: "mat" as const, subjectId: null, reason: "conteudo" as const, question: "Questão 150", lesson: "", source: "" };

  it("records mistakes, suggests reviewing the topic on the second one and moves them through reviews", () => {
    expect(state().addMistake({ ...mistake, question: " " })).toEqual({ error: "Descreva a questão ou o que você errou." });
    expect(state().addMistake(mistake)).toMatchObject({ suggestReview: false });
    const second = state().addMistake(mistake);
    expect(second).toMatchObject({ suggestReview: true });
    state().setStatus("mat-0", "revisar");
    expect(state().addMistake(mistake)).toMatchObject({ suggestReview: false });
    const id = state().mistakes[0].id;
    state().answerMistake(id, true);
    expect(state().mistakes[0]).toMatchObject({ stage: 1, due: "2026-10-23" });
    state().removeMistake(id);
    expect(state().mistakes).toHaveLength(2);
  });

  it("lightens today by moving the second topic to the next study day", () => {
    state().addTask({ topicId: "mat-0", date: today, priority: "media" });
    state().addTask({ topicId: "mat-1", date: today, priority: "media" });
    const moved = state().lightenToday();
    expect(moved).toHaveLength(1);
    expect(state().tasks.filter((task) => task.date === today)).toHaveLength(1);
    expect(state().lightenToday()).toEqual([]);
  });

  it("validates mock exams, essays and repertoire", () => {
    expect(state().addMockExam({ date: today, day: 2, minutes: null, sections: [], note: "" })).toMatch(/pelo menos uma/);
    expect(state().addMockExam({ date: today, day: 2, minutes: 290, sections: [{ areaId: "mat", correct: 30, total: 45 }], note: "" })).toBeNull();
    expect(state().addEssay({ date: today, theme: " Tema ", scores: [160, 160, 120, 160, 120], corrector: "", improve: "" })).toBeNull();
    expect(state().essays[0].theme).toBe("Tema");
    expect(state().addRepertoire({ title: "", detail: "", themes: "" })).toMatch(/repertório/);
    expect(state().mockExams).toHaveLength(1);
  });

  it("checks exam checklist items per day and sets the exam date", () => {
    state().toggleChecklistItem("d1-caneta");
    state().toggleChecklistItem("d2-caneta");
    state().resetChecklist(1);
    expect(state().examChecklist).toEqual(["d2-caneta"]);
    state().setTargetDate("2026-11-08");
    expect(state().planner.targetDate).toBe("2026-11-08");
  });
});
