import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLANNER,
  applyFocusToTask,
  freeMinutes,
  generatePlan,
  lowerPriority,
  missedTasks,
  plannedMinutes,
  rescheduleTask,
  splitTask,
  suggestDay,
  validateAvailability,
  validateTask,
  type PlanContext,
  type PlanTask,
  type PlannerSettings,
} from "./planner";
import { EMPTY_PROGRESS, changeStatus, type ProgressMap } from "./reviews";
import { defaultTopics, setTopicHidden, updateTopic } from "./topics";

// 2026-10-16 é sexta-feira.
const today = "2026-10-16";
const settings: PlannerSettings = { ...DEFAULT_PLANNER, availability: [120, 120, 120, 120, 100, 60, 0], sessionMinutes: 50 };

function idGenerator() {
  let count = 0;
  return () => `new-${++count}`;
}

function context(overrides: Partial<PlanContext> = {}): PlanContext {
  return { today, topics: defaultTopics(), progress: {}, tasks: [], settings, newId: idGenerator(), ...overrides };
}

function task(overrides: Partial<PlanTask>): PlanTask {
  return {
    id: "x",
    topicId: "mat-0",
    areaId: "mat",
    kind: "estudo",
    date: today,
    minutes: 50,
    priority: "media",
    status: "planejada",
    origin: "gerada",
    focusSec: 0,
    ...overrides,
  };
}

describe("generatePlan", () => {
  it("never plans more minutes than each day allows and never shrinks sessions", () => {
    const { tasks } = generatePlan(context());
    for (const date of ["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"]) {
      const minutes = plannedMinutes(tasks, date);
      expect(minutes).toBeLessThanOrEqual(freeMinutes([], settings, date) + 0);
      expect(tasks.filter((item) => item.date === date).every((item) => item.minutes === 50)).toBe(true);
    }
    // Sexta 100 min = 2 sessões; sábado 60 = 1; domingo descanso = 0.
    expect(tasks.filter((item) => item.date === "2026-10-16")).toHaveLength(2);
    expect(tasks.filter((item) => item.date === "2026-10-17")).toHaveLength(1);
    expect(tasks.filter((item) => item.date === "2026-10-18")).toHaveLength(0);
  });

  it("schedules a topic at most once and leaves hidden and concluded topics out", () => {
    const topics = setTopicHidden(defaultTopics(), "mat-0", true);
    const progress: ProgressMap = { "mat-1": changeStatus(EMPTY_PROGRESS, "concluido", "2026-09-01") };
    const { tasks } = generatePlan(context({ topics, progress }));
    const studyIds = tasks.filter((item) => item.kind === "estudo").map((item) => item.topicId);
    expect(new Set(studyIds).size).toBe(studyIds.length);
    expect(tasks.map((item) => item.topicId)).not.toContain("mat-0");
    expect(tasks.filter((item) => item.kind === "estudo").map((item) => item.topicId)).not.toContain("mat-1");
  });

  it("puts overdue and due reviews first, on the first day with room", () => {
    const progress: ProgressMap = {
      "hum-1": changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-01"),
      "lin-0": changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-17"),
    };
    const { added } = generatePlan(context({ progress }));
    const reviews = added.filter((item) => item.kind === "revisao");
    expect(reviews.map((item) => [item.topicId, item.date, item.minutes])).toEqual([
      ["hum-1", today, 25],
      ["lin-0", "2026-10-19", 25],
    ]);
    // Sábado (60 min) ainda cabe uma sessão de 50 depois que a revisão de domingo foi para segunda.
    expect(plannedMinutes(added, today)).toBeLessThanOrEqual(100);
  });

  it("prefers topics that need review, are in progress or have high priority", () => {
    const topics = updateTopic(defaultTopics(), "red-6", { name: "Repertório sociocultural", areaId: "red", description: "", priority: "alta" });
    const progress: ProgressMap = { "nat-9": { status: "revisar", mastery: 1, reviews: [] } };
    const { added } = generatePlan(context({ topics, progress }));
    expect(added.slice(0, 2).map((item) => item.topicId).sort()).toEqual(["nat-9", "red-6"]);
  });

  it("spreads areas in the balanced strategy and focuses on priority areas otherwise", () => {
    const balanced = generatePlan(context()).added;
    expect(new Set(balanced.slice(0, 5).map((item) => item.areaId)).size).toBe(5);

    const focused = generatePlan(context({ settings: { ...settings, strategy: "prioridades", difficultAreas: ["nat"] } })).added;
    expect(focused.filter((item) => item.areaId === "nat").length).toBeGreaterThan(
      balanced.filter((item) => item.areaId === "nat").length,
    );
  });

  it("keeps done, started, manual and past tasks and only replaces future generated plans", () => {
    const tasks = [
      task({ id: "done", status: "concluida", topicId: "mat-0" }),
      task({ id: "started", status: "iniciada", topicId: "mat-1" }),
      task({ id: "manual", origin: "manual", topicId: "mat-2", date: "2026-10-19" }),
      task({ id: "past", date: "2026-10-14", topicId: "mat-3" }),
      task({ id: "old-plan", date: "2026-10-20", topicId: "mat-4" }),
    ];
    const result = generatePlan(context({ tasks }));
    const ids = result.tasks.map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining(["done", "started", "manual", "past"]));
    expect(ids).not.toContain("old-plan");
    expect(result.removed.map((item) => item.id)).toEqual(["old-plan"]);
    // Tópicos com tarefa ativa não ganham uma segunda tarefa.
    expect(result.added.map((item) => item.topicId)).not.toContain("mat-1");
    expect(result.added.map((item) => item.topicId)).not.toContain("mat-2");
    // Hoje já tem 100 min ocupados pelas tarefas mantidas: nada novo entra hoje.
    expect(result.added.filter((item) => item.date === today)).toEqual([]);
  });

  it("is stable: regenerating twice gives the same plan without duplicates", () => {
    const first = generatePlan(context());
    const second = generatePlan(context({ tasks: first.tasks }));
    expect(second.tasks.map((item) => [item.topicId, item.date])).toEqual(first.tasks.map((item) => [item.topicId, item.date]));
    expect(second.removed).toHaveLength(first.added.length);
  });

  it("reports important topics that did not fit", () => {
    const tight = { ...settings, availability: [0, 0, 0, 0, 0, 0, 0] };
    const progress: ProgressMap = { "mat-3": { status: "and", mastery: 2, reviews: [] }, "lin-3": { status: "and", mastery: 2, reviews: [] } };
    const result = generatePlan(context({ settings: tight, progress }));
    expect(result.added).toHaveLength(0);
    expect(result.leftovers.map((item) => item.topicId)).toEqual(["mat-3", "lin-3"]);
  });
});

describe("missed tasks and rearranging", () => {
  const tasks = [
    task({ id: "missed", date: "2026-10-14" }),
    task({ id: "half", date: "2026-10-15", status: "iniciada", focusSec: 600 }),
    task({ id: "done", date: "2026-10-15", status: "concluida" }),
    task({ id: "today", date: today, minutes: 100 }),
  ];

  it("lists past tasks that were not done", () => {
    expect(missedTasks(tasks, today).map((item) => item.id)).toEqual(["missed", "half"]);
  });

  it("suggests the first day with room instead of piling onto tomorrow", () => {
    // Hoje está cheio (100 de 100); sábado tem 60 livres.
    expect(suggestDay(tasks, settings, today, 50, "missed")).toBe("2026-10-17");
    expect(suggestDay(tasks, settings, today, 90, "missed")).toBe("2026-10-19");
    expect(suggestDay(tasks, { ...settings, availability: [0, 0, 0, 0, 0, 0, 0] }, today, 50)).toBeNull();
  });

  it("moves a task to a date or to another week", () => {
    expect(rescheduleTask(tasks, "missed", "2026-10-20").find((item) => item.id === "missed")).toMatchObject({
      date: "2026-10-20",
      status: "planejada",
    });
    const later = rescheduleTask(tasks, "missed", null).find((item) => item.id === "missed");
    expect(later).toMatchObject({ date: null, status: "adiada" });
    expect(rescheduleTask([later!], "missed", "2026-10-21")[0].status).toBe("planejada");
  });

  it("splits a task in two smaller sessions that fit the free time", () => {
    const result = splitTask(tasks, "today", settings, today, idGenerator());
    const parts = result.filter((item) => item.id.startsWith("new-"));
    expect(result.find((item) => item.id === "today")).toBeUndefined();
    expect(parts.map((item) => [item.minutes, item.date, item.origin])).toEqual([
      [50, today, "manual"],
      [50, today, "manual"],
    ]);
  });

  it("places the second half on another day when today is full", () => {
    const busy = [...tasks, task({ id: "other", date: today, minutes: 30, topicId: "lin-0" })];
    const parts = splitTask(busy, "half", settings, today, idGenerator()).filter((item) => item.id.startsWith("new-"));
    expect(parts.map((item) => [item.minutes, item.date, item.focusSec])).toEqual([
      [25, "2026-10-17", 600],
      [25, "2026-10-17", 0],
    ]);
  });

  it("does not split tasks that would become too short", () => {
    expect(splitTask([task({ id: "short", minutes: 15 })], "short", settings, today, idGenerator())).toEqual([
      task({ id: "short", minutes: 15 }),
    ]);
  });

  it("lowers priority one step at a time", () => {
    expect(lowerPriority("alta")).toBe("media");
    expect(lowerPriority("media")).toBe("baixa");
    expect(lowerPriority("baixa")).toBe("baixa");
  });
});

describe("validation and focus", () => {
  it("validates manual tasks and availability", () => {
    expect(validateTask({ topicId: null, date: "2026-10-15", minutes: 50, priority: "media" }, today)).toMatch(/data/);
    expect(validateTask({ topicId: null, date: today, minutes: 5, priority: "media" }, today)).toMatch(/10 a 240/);
    expect(validateTask({ topicId: "mat-0", date: today, minutes: 45, priority: "alta" }, today)).toBeNull();
    expect(validateAvailability([60, 60, 60, 60, 60, 0, 0])).toBeNull();
    expect(validateAvailability([60, -1, 60, 60, 60, 0, 0])).toMatch(/16 horas/);
    expect(validateAvailability([60])).toMatch(/7 dias/);
  });

  it("adds focus to the task and concludes it at the planned time", () => {
    const started = applyFocusToTask([task({ id: "a" })], "a", 1200);
    expect(started[0]).toMatchObject({ status: "iniciada", focusSec: 1200 });
    expect(applyFocusToTask(started, "a", 1800)[0]).toMatchObject({ status: "concluida", focusSec: 3000 });
  });
});
