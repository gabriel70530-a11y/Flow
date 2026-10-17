import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlanTask } from "@/lib/planner";
import { GENERAL_STUDY } from "@/lib/sessions";
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
  useStudyStore.setState(emptyData());
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
    expect(state().addTopic({ name: " ", areaId: "mat", description: "", priority: "media" })).toEqual({
      error: "Dê um nome ao tópico.",
    });
    const result = state().addTopic({ name: "Matrizes", areaId: "mat", description: "", priority: "alta" });
    if (!("id" in result)) throw new Error(result.error);
    expect(result.id).toMatch(/^custom-/);
    expect(state().editTopic(result.id, { name: "Probabilidade", areaId: "mat", description: "", priority: "alta" })).toMatch(/Já existe/);
    expect(state().topics).toHaveLength(45);
  });

  it("keeps sessions when hiding or deleting a topic", () => {
    const result = state().addTopic({ name: "Matrizes", areaId: "mat", description: "", priority: "alta" });
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

  it("never deletes default topics", () => {
    state().removeTopic("mat-0");
    expect(state().topics).toHaveLength(44);
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

  it("toggles mastery off when the same level is picked again", () => {
    state().toggleMastery("nat-1", 3);
    expect(state().progress["nat-1"].mastery).toBe(3);
    state().toggleMastery("nat-1", 3);
    expect(state().progress["nat-1"].mastery).toBe(0);
  });

  it("keeps interface preferences when resetting the data", () => {
    useStudyStore.setState({ demo: true, theme: "dark", sound: false, showStreak: false });
    state().resetData();
    expect(state()).toMatchObject({ demo: false, sessions: [], progress: {}, theme: "dark", sound: false, showStreak: false });
    expect(state().topics).toHaveLength(44);
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
    const task = state().tasks[0];
    expect(task).toMatchObject({ origin: "manual", areaId: "mat", status: "planejada" });
    state().studyTopic("mat-0", task.id);
    state().removeTask(task.id);
    expect(state().tasks).toHaveLength(1);
    expect(state().timer.taskId).toBe("");
  });

  it("moves tasks only to today or later, never to a full day, and to another week", () => {
    state().addTask({ topicId: "mat-0", date: today, priority: "alta" });
    state().addTask({ topicId: "mat-1", date: "2026-10-17", priority: "media" });
    state().addTask({ topicId: "mat-2", date: "2026-10-17", priority: "media" });
    const { id } = state().tasks[0];
    expect(state().moveTask(id, "2026-10-01")).toBe(false);
    expect(state().moveTask(id, "2026-10-17")).toBe(false);
    expect(state().moveTask(id, null)).toBe(true);
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

    useStudyStore.setState(emptyData());
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
