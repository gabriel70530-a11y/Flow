import { describe, expect, it } from "vitest";
import { loadData, parseBackup } from "./migrate";
import { emptyData } from "./state";

const today = "2026-10-16";

const prototypeData = {
  version: 1,
  demo: false,
  tab: "timer",
  goal: 30,
  theme: "dark",
  progress: { "mat-3": { status: "and", mastery: 2, reviews: [] } },
  sessions: [
    { id: "a1", topicId: "mat-3", date: "2026-10-15", sec: 1500, mode: "pomodoro", ts: 1_000_000 },
    { id: "a2", topicId: "lin-0", date: "2026-10-16", sec: 600, mode: "cronometro", ts: 2_000_000 },
    { id: "bad", topicId: "lin-0", date: "2026-10-16", sec: "x", mode: "pomodoro", ts: 3 },
  ],
  timer: { mode: "pomodoro", focus: 50, brk: 10, phase: "focus", running: false, startedAt: 0, banked: 120, topicId: "mat-3" },
};

describe("loadData", () => {
  it("loads demo data on the first visit", () => {
    const { data, corrupt } = loadData({ current: null, legacy: null }, today);
    expect(corrupt).toBe(false);
    expect(data.demo).toBe(true);
    expect(data.topics).toHaveLength(44);
    expect(data.sessions.every((session) => session.state === "concluida" && session.areaId)).toBe(true);
  });

  it("migrates prototype data from v1 without losing sessions, progress or settings", () => {
    const { data } = loadData({ current: null, legacy: JSON.stringify(prototypeData) }, today);
    expect(data.version).toBe(2);
    expect(data).not.toHaveProperty("tab");
    expect(data.goal).toEqual({ type: "horas", value: 30 });
    expect(data.theme).toBe("dark");
    expect(data.progress["mat-3"].status).toBe("and");
    expect(data.sessions).toEqual([
      { id: "a1", topicId: "mat-3", areaId: "mat", date: "2026-10-15", start: 1_000_000 - 1_500_000, end: 1_000_000, sec: 1500, mode: "pomodoro", state: "concluida" },
      { id: "a2", topicId: "lin-0", areaId: "lin", date: "2026-10-16", start: 2_000_000 - 600_000, end: 2_000_000, sec: 600, mode: "cronometro", state: "concluida" },
    ]);
    expect(data.timer).toMatchObject({ focus: 50, brk: 10, banked: 120, topicId: "mat-3", sessionStart: 0, taskId: "" });
  });

  it("keeps only the topic of the timer saved in the prototype's first format", () => {
    const legacy = JSON.stringify({ ...prototypeData, timer: { topicId: "mat-2", seconds: 30, running: true } });
    expect(loadData({ current: null, legacy }, today).data.timer).toEqual({ ...emptyData().timer, topicId: "mat-2" });
  });

  it("prefers v2 data when both versions exist", () => {
    const current = JSON.stringify({ ...emptyData(), goal: { type: "sessoes", value: 12 } });
    expect(loadData({ current, legacy: JSON.stringify(prototypeData) }, today).data.goal).toEqual({ type: "sessoes", value: 12 });
  });

  it("fills fields missing from older v2 data", () => {
    const { topics, ...partial } = emptyData();
    const current = JSON.stringify({ ...partial, planner: { sessionMinutes: 30 } });
    const { data } = loadData({ current, legacy: null }, today);
    expect(data.topics).toEqual(topics);
    expect(data.planner.sessionMinutes).toBe(30);
    expect(data.planner.availability).toHaveLength(7);
  });

  it("starts from scratch and flags corrupted v2 data", () => {
    for (const current of ["{oops", "null", JSON.stringify({ version: 9 })]) {
      expect(loadData({ current, legacy: null }, today)).toEqual({ data: emptyData(), corrupt: true });
    }
  });

  it("starts from scratch when the old v1 data is unreadable", () => {
    expect(loadData({ current: null, legacy: "{oops" }, today)).toEqual({ data: emptyData(), corrupt: false });
  });
});

describe("parseBackup", () => {
  it("reads v2 backups and v1 prototype data, and refuses anything else", () => {
    expect(parseBackup(JSON.stringify({ ...emptyData(), goal: { type: "sessoes", value: 8 } }))?.goal).toEqual({ type: "sessoes", value: 8 });
    expect(parseBackup(JSON.stringify(prototypeData))?.sessions).toHaveLength(2);
    expect(parseBackup("{oops")).toBeNull();
    expect(parseBackup(JSON.stringify({ hello: "world" }))).toBeNull();
    expect(parseBackup("[]")).toBeNull();
  });
});
