import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyData, parseSavedData, useStudyStore } from "./study-store";

const today = "2026-10-16";

describe("parseSavedData", () => {
  it("loads demo data on the first visit", () => {
    const data = parseSavedData(null, today);
    expect(data.demo).toBe(true);
    expect(data.sessions.some((session) => session.date === today)).toBe(true);
    expect(data.progress["mat-0"].status).toBe("concluido");
  });

  it("starts from scratch when the saved JSON is corrupted or unknown", () => {
    expect(parseSavedData("{oops", today)).toEqual(emptyData());
    expect(parseSavedData("null", today)).toEqual(emptyData());
    expect(parseSavedData(JSON.stringify({ version: 2 }), today)).toEqual(emptyData());
  });

  it("reads data saved by the prototype and drops the old tab field", () => {
    const saved = { ...emptyData(), goal: 30, theme: "dark", tab: "timer" };
    const data = parseSavedData(JSON.stringify(saved), today);
    expect(data).toEqual({ ...emptyData(), goal: 30, theme: "dark" });
    expect(data).not.toHaveProperty("tab");
  });

  it("replaces the timer saved in the prototype's first format", () => {
    const saved = { ...emptyData(), timer: { topicId: "mat-2", seconds: 300, running: true } };
    expect(parseSavedData(JSON.stringify(saved), today).timer).toEqual({ ...emptyData().timer, topicId: "mat-2" });
  });
});

describe("study store", () => {
  const start = new Date(2026, 9, 16, 10, 0, 0);
  const advance = (seconds: number) => vi.setSystemTime(start.getTime() + seconds * 1000);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(start);
    useStudyStore.setState(emptyData());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not start without a topic", () => {
    expect(useStudyStore.getState().startTimer()).toBe(false);
    expect(useStudyStore.getState().timer.running).toBe(false);
  });

  it("records the elapsed time on finish and moves a new topic to in progress", () => {
    const store = useStudyStore.getState();
    store.setTimerTopic("mat-2");
    store.startTimer();
    advance(600);
    store.pauseTimer();
    advance(900);
    expect(store.finishTimer()).toBe(600);

    const { sessions, progress, timer } = useStudyStore.getState();
    expect(sessions).toMatchObject([{ topicId: "mat-2", date: today, sec: 600, mode: "pomodoro" }]);
    expect(progress["mat-2"].status).toBe("and");
    expect(timer).toMatchObject({ running: false, banked: 0, phase: "focus", topicId: "mat-2" });
  });

  it("does not record sessions shorter than one minute", () => {
    const store = useStudyStore.getState();
    store.setTimerTopic("mat-2");
    store.startTimer();
    advance(59);
    expect(store.finishTimer()).toBeNull();
    expect(useStudyStore.getState().sessions).toEqual([]);
  });

  it("records the focus block and starts the break when focus ends", () => {
    const store = useStudyStore.getState();
    store.setTimerTopic("lin-0");
    store.startTimer();
    advance(25 * 60 - 1);
    expect(store.tick()).toBeNull();

    advance(25 * 60 + 3);
    expect(store.tick()).toBe("focus-done");
    expect(useStudyStore.getState().sessions).toMatchObject([{ topicId: "lin-0", sec: 25 * 60 }]);
    expect(useStudyStore.getState().timer).toMatchObject({ phase: "break", running: true, banked: 0 });

    advance(30 * 60 + 3);
    expect(store.tick()).toBe("break-done");
    expect(useStudyStore.getState().timer).toMatchObject({ phase: "focus", running: false });
    expect(useStudyStore.getState().sessions).toHaveLength(1);
  });

  it("locks mode, durations and topic while a session is in progress", () => {
    const store = useStudyStore.getState();
    store.setTimerTopic("mat-2");
    store.startTimer();
    store.setTimerMode("cronometro");
    store.setFocusMinutes(50);
    store.setTimerTopic("lin-0");
    expect(store.studyTopic("lin-0")).toBe(false);
    expect(useStudyStore.getState().timer).toMatchObject({ mode: "pomodoro", focus: 25, topicId: "mat-2" });
  });

  it("clamps the weekly goal and durations", () => {
    const store = useStudyStore.getState();
    store.setGoal(500);
    store.setFocusMinutes(0);
    store.setBreakMinutes(90);
    expect(useStudyStore.getState().goal).toBe(100);
    expect(useStudyStore.getState().timer).toMatchObject({ focus: 25, brk: 60 });
  });

  it("toggles mastery off when the same level is picked again", () => {
    const store = useStudyStore.getState();
    store.toggleMastery("nat-1", 3);
    expect(useStudyStore.getState().progress["nat-1"].mastery).toBe(3);
    store.toggleMastery("nat-1", 3);
    expect(useStudyStore.getState().progress["nat-1"].mastery).toBe(0);
  });

  it("keeps the theme when resetting the data", () => {
    useStudyStore.setState({ ...parseSavedData(null, today), theme: "dark" });
    useStudyStore.getState().resetData();
    const state = useStudyStore.getState();
    expect(state).toMatchObject({ demo: false, sessions: [], progress: {}, theme: "dark" });
  });
});
