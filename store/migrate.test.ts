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
  it("starts empty on the first visit, without demo data", () => {
    expect(loadData({ current: null, legacy: null })).toEqual({ data: emptyData(), corrupt: false });
  });

  it("migrates prototype data from v1 without losing sessions, progress or settings", () => {
    const { data } = loadData({ current: null, legacy: JSON.stringify(prototypeData) });
    expect(data.version).toBe(2);
    expect(data).not.toHaveProperty("tab");
    expect(data.goal).toEqual({ type: "horas", value: 30 });
    expect(data.theme).toBe("dark");
    expect(data.progress["mat-3"].status).toBe("and");
    expect(data.sessions).toEqual([
      { id: "a1", topicId: "mat-3", areaId: "mat", subjectId: null, date: "2026-10-15", start: 1_000_000 - 1_500_000, end: 1_000_000, sec: 1500, mode: "pomodoro", state: "concluida" },
      { id: "a2", topicId: "lin-0", areaId: "lin", subjectId: null, date: "2026-10-16", start: 2_000_000 - 600_000, end: 2_000_000, sec: 600, mode: "cronometro", state: "concluida" },
    ]);
    expect(data.timer).toMatchObject({ focus: 50, brk: 10, banked: 120, topicId: "mat-3", sessionStart: 0, taskId: "" });
    expect(data.topics.map((topic) => [topic.id, topic.name])).toEqual([
      ["mat-3", "Probabilidade"],
      ["lin-0", "Interpretação de texto"],
    ]);
  });

  it("drops old default topics nobody used and keeps the ones with history or created by the student", () => {
    const topic = (id: string, origin: string) => ({ id, areaId: "mat", name: id, description: "", priority: "media", hidden: false, origin });
    const current = JSON.stringify({
      ...emptyData(),
      topics: [topic("mat-0", "padrao"), topic("mat-1", "padrao"), topic("custom-1", "personalizado")],
      progress: { "mat-1": { status: "and", mastery: 1, reviews: [] } },
    });
    const { data } = loadData({ current, legacy: null });
    expect(data.topics.map((kept) => kept.id)).toEqual(["mat-1", "custom-1"]);
    expect(data.topics.every((kept) => kept.subjectId === null)).toBe(true);
    expect(data.topics.every((kept) => !("origin" in kept))).toBe(true);
  });

  it("keeps only the topic of the timer saved in the prototype's first format", () => {
    const legacy = JSON.stringify({ ...prototypeData, timer: { topicId: "mat-2", seconds: 30, running: true } });
    expect(loadData({ current: null, legacy }).data.timer).toEqual({ ...emptyData().timer, topicId: "mat-2" });
  });

  it("prefers v2 data when both versions exist", () => {
    const current = JSON.stringify({ ...emptyData(), goal: { type: "sessoes", value: 12 } });
    expect(loadData({ current, legacy: JSON.stringify(prototypeData) }).data.goal).toEqual({ type: "sessoes", value: 12 });
  });

  it("fills fields missing from older v2 data", () => {
    const { topics, mistakes, mockExams, essays, repertoire, examChecklist, ...partial } = emptyData();
    const current = JSON.stringify({ ...partial, planner: { strategy: "prioridades" } });
    const { data } = loadData({ current, legacy: null });
    expect(data.topics).toEqual(topics);
    expect(data.planner.strategy).toBe("prioridades");
    expect(data.planner.studyDays).toHaveLength(7);
    expect(data.planner.lightDays).toEqual(Array(7).fill(false));
    expect(data.planner.targetDate).toBe("2026-11-08");
    expect({ mistakes, mockExams, essays, repertoire, examChecklist }).toEqual({
      mistakes: data.mistakes,
      mockExams: data.mockExams,
      essays: data.essays,
      repertoire: data.repertoire,
      examChecklist: data.examChecklist,
    });
  });

  it("gives old science and humanities topics their subject, also on their tasks", () => {
    const topic = { id: "nat-3", areaId: "nat", name: "Estequiometria", description: "", priority: "media", hidden: false, origin: "padrao" };
    const oldTask = {
      id: "t", topicId: "nat-3", areaId: "nat", kind: "estudo", date: today,
      priority: "media", status: "planejada", origin: "gerada", focusSec: 0,
    };
    const current = JSON.stringify({ ...emptyData(), topics: [topic], tasks: [oldTask] });
    const { data } = loadData({ current, legacy: null });
    expect(data.topics[0].subjectId).toBe("qui");
    expect(data.tasks[0].subjectId).toBe("qui");
  });

  it("turns old minutes per day into study days and drops task durations", () => {
    const oldTask = {
      id: "t", topicId: "mat-0", areaId: "mat", kind: "estudo", date: today, minutes: 50,
      priority: "media", status: "planejada", origin: "gerada", focusSec: 0,
    };
    const current = JSON.stringify({
      ...emptyData(),
      planner: { availability: [60, 0, 90, 0, 0, 30, 0], sessionMinutes: 50, strategy: "equilibrada" },
      tasks: [oldTask],
    });
    const { data } = loadData({ current, legacy: null });
    expect(data.planner.studyDays).toEqual([true, false, true, false, false, true, false]);
    expect(data.planner).not.toHaveProperty("availability");
    expect(data.planner).not.toHaveProperty("sessionMinutes");
    expect(data.tasks[0]).not.toHaveProperty("minutes");
  });

  it("starts from scratch and flags corrupted v2 data", () => {
    for (const current of ["{oops", "null", JSON.stringify({ version: 9 })]) {
      expect(loadData({ current, legacy: null })).toEqual({ data: emptyData(), corrupt: true });
    }
  });

  it("starts from scratch when the old v1 data is unreadable", () => {
    expect(loadData({ current: null, legacy: "{oops" })).toEqual({ data: emptyData(), corrupt: false });
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
