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

  it("adds focus to the plan task and concludes it when the planned time is reached", () => {
    const task: PlanTask = {
      id: "t1", topicId: "nat-1", areaId: "nat", kind: "estudo", date: today, minutes: 30,
      priority: "media", status: "planejada", origin: "gerada", focusSec: 0,
    };
    useStudyStore.setState({ tasks: [task] });
    expect(state().studyTopic("nat-1", { id: "t1", minutes: 30 })).toBe(true);
    expect(state().timer).toMatchObject({ topicId: "nat-1", taskId: "t1", focus: 30, mode: "pomodoro" });

    state().startTimer();
    expect(state().tasks[0].status).toBe("iniciada");
    advance(20 * 60);
    state().finishTimer();
    expect(state().tasks[0]).toMatchObject({ status: "iniciada", focusSec: 1200 });

    state().startTimer();
    advance(20 * 60 + 600);
    state().finishTimer();
    expect(state().tasks[0]).toMatchObject({ status: "concluida", focusSec: 1800 });
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
  it("finishes onboarding with a suggested plan inside the availability", () => {
    const settings = { ...state().planner, availability: [60, 60, 60, 60, 60, 0, 0], sessionMinutes: 30 };
    expect(state().finishOnboarding(settings, "sugerido")).toBeNull();
    expect(state().onboarding.status).toBe("concluido");
    expect(state().tasks.length).toBeGreaterThan(0);
    expect(state().tasks.filter((task) => task.date === today).reduce((sum, task) => sum + task.minutes, 0)).toBeLessThanOrEqual(60);
  });

  it("saves preferences without a plan in manual mode and rejects invalid availability", () => {
    expect(state().finishOnboarding({ ...state().planner, availability: [60, -5, 0, 0, 0, 0, 0] }, "manual")).toMatch(/16 horas/);
    expect(state().finishOnboarding({ ...state().planner, availability: [60, 60, 0, 0, 0, 0, 0] }, "manual")).toBeNull();
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

  it("validates manual tasks and unlinks the timer when a task is removed", () => {
    expect(state().addTask({ topicId: "mat-0", date: "2026-10-01", minutes: 30, priority: "media" })).toMatch(/data/);
    expect(state().addTask({ topicId: "mat-0", date: today, minutes: 30, priority: "media" })).toBeNull();
    const task = state().tasks[0];
    expect(task).toMatchObject({ origin: "manual", areaId: "mat", status: "planejada" });
    state().studyTopic("mat-0", { id: task.id, minutes: task.minutes });
    state().removeTask(task.id);
    expect(state().tasks).toEqual([]);
    expect(state().timer.taskId).toBe("");
  });

  it("moves tasks only to today or later and to another week", () => {
    state().addTask({ topicId: "mat-0", date: today, minutes: 30, priority: "alta" });
    const { id } = state().tasks[0];
    expect(state().moveTask(id, "2026-10-01")).toBe(false);
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
