import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLANNER,
  MAX_TOPICS_PER_DAY,
  applyFocusToTask,
  carryOverMissed,
  dayConflict,
  generatePlan,
  lowerPriority,
  missedTasks,
  repeatNextDay,
  rescheduleTask,
  suggestDay,
  topicsOn,
  validateStudyDays,
  validateTask,
  type PlanContext,
  type PlanTask,
  type PlannerSettings,
} from "./planner";
import { EMPTY_PROGRESS, changeStatus, type ProgressMap } from "./reviews";
import type { AreaId } from "./syllabus";
import { legacyTopics } from "./legacy-topics";
import { setTopicHidden, updateTopic } from "./topics";

// 2026-10-16 é sexta-feira. Estuda de segunda a sábado; domingo é livre.
const today = "2026-10-16";
const settings: PlannerSettings = { ...DEFAULT_PLANNER, studyDays: [true, true, true, true, true, true, false] };
const week = ["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"];

function idGenerator() {
  let count = 0;
  return () => `new-${++count}`;
}

function context(overrides: Partial<PlanContext> = {}): PlanContext {
  return { today, topics: legacyTopics(), progress: {}, tasks: [], settings, newId: idGenerator(), ...overrides };
}

function task(overrides: Partial<PlanTask>): PlanTask {
  const topicId = overrides.topicId ?? "mat-0";
  return {
    id: "x",
    topicId,
    areaId: topicId ? (topicId.split("-")[0] as AreaId) : null,
    kind: "estudo",
    date: today,
    priority: "media",
    status: "planejada",
    origin: "gerada",
    focusSec: 0,
    ...overrides,
  };
}

function areasOn(tasks: readonly PlanTask[], date: string): Set<AreaId | null> {
  return new Set(tasks.filter((item) => item.date === date && item.status !== "adiada").map((item) => item.areaId));
}

function expectOneAreaPerDay(tasks: readonly PlanTask[]) {
  for (const date of week) {
    expect(topicsOn(tasks, date)).toBeLessThanOrEqual(MAX_TOPICS_PER_DAY);
    expect(areasOn(tasks, date).size).toBeLessThanOrEqual(1);
  }
}

describe("generatePlan", () => {
  it("puts up to two topics of the same area on each study day and none on rest days", () => {
    const { tasks } = generatePlan(context());
    expectOneAreaPerDay(tasks);
    expect(topicsOn(tasks, "2026-10-18")).toBe(0);
    expect(topicsOn(tasks, today)).toBe(MAX_TOPICS_PER_DAY);
  });

  it("schedules a topic at most once and leaves hidden and concluded topics out", () => {
    const topics = setTopicHidden(legacyTopics(), "mat-0", true);
    const progress: ProgressMap = { "mat-1": changeStatus(EMPTY_PROGRESS, "concluido", "2026-09-01") };
    const { tasks } = generatePlan(context({ topics, progress }));
    const studyIds = tasks.filter((item) => item.kind === "estudo").map((item) => item.topicId);
    expect(new Set(studyIds).size).toBe(studyIds.length);
    expect(tasks.map((item) => item.topicId)).not.toContain("mat-0");
    expect(studyIds).not.toContain("mat-1");
  });

  it("puts due reviews first and keeps the rest of their day in the same area", () => {
    const progress: ProgressMap = {
      "hum-1": changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-01"),
      "lin-0": changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-17"),
    };
    const { tasks, added } = generatePlan(context({ progress }));
    const reviews = added.filter((item) => item.kind === "revisao");
    // A revisão de lin-0 vence no domingo, dia livre: vai para segunda.
    expect(reviews.map((item) => [item.topicId, item.date])).toEqual([
      ["hum-1", today],
      ["lin-0", "2026-10-19"],
    ]);
    expect(areasOn(tasks, today)).toEqual(new Set(["hum"]));
    expect(areasOn(tasks, "2026-10-19")).toEqual(new Set(["lin"]));
  });

  it("prefers topics that need review, are in progress or have high priority", () => {
    const topics = updateTopic(legacyTopics(), "lin-5", { name: "Escolas literárias", areaId: "lin", description: "", priority: "alta" });
    const progress: ProgressMap = { "nat-9": { status: "revisar", mastery: 1, reviews: [] } };
    const { added } = generatePlan(context({ topics, progress }));
    expect(added[0]).toMatchObject({ topicId: "nat-9", date: today });
    expect(added.find((item) => item.topicId === "lin-5")?.date).toBe("2026-10-17");
  });

  it("rotates areas across days in the balanced strategy and focuses on priority areas otherwise", () => {
    const balanced = generatePlan(context()).added;
    const firstDays = [today, "2026-10-17", "2026-10-19", "2026-10-20", "2026-10-21"];
    expect(new Set(firstDays.map((date) => [...areasOn(balanced, date)][0])).size).toBe(5);

    const focused = generatePlan(context({ settings: { ...settings, strategy: "prioridades", difficultAreas: ["nat"] } })).added;
    expect(focused.filter((item) => item.areaId === "nat").length).toBeGreaterThan(
      balanced.filter((item) => item.areaId === "nat").length,
    );
  });

  it("keeps done, started, manual, repeated, carried and past tasks and only replaces future generated plans", () => {
    const tasks = [
      task({ id: "done", status: "concluida", topicId: "mat-0" }),
      task({ id: "started", status: "iniciada", topicId: "mat-1" }),
      task({ id: "manual", origin: "manual", topicId: "lin-2", date: "2026-10-19" }),
      task({ id: "repeat", origin: "repeticao", topicId: "nat-5", date: "2026-10-20" }),
      task({ id: "carried", origin: "transferida", topicId: "nat-6", date: "2026-10-20" }),
      task({ id: "past", date: "2026-10-14", topicId: "mat-3" }),
      task({ id: "old-plan", date: "2026-10-21", topicId: "mat-4" }),
    ];
    const result = generatePlan(context({ tasks }));
    const ids = result.tasks.map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining(["done", "started", "manual", "repeat", "carried", "past"]));
    expect(ids).not.toContain("old-plan");
    expect(result.removed.map((item) => item.id)).toEqual(["old-plan"]);
    expect(result.added.filter((item) => item.date === today || item.date === "2026-10-20")).toEqual([]);
    // Segunda já tem uma matéria manual de Linguagens: a segunda vaga é de Linguagens.
    expect(areasOn(result.tasks, "2026-10-19")).toEqual(new Set(["lin"]));
    expectOneAreaPerDay(result.tasks);
  });

  it("is stable: regenerating twice gives the same plan without duplicates", () => {
    const first = generatePlan(context());
    const second = generatePlan(context({ tasks: first.tasks }));
    expect(second.tasks.map((item) => [item.topicId, item.date])).toEqual(first.tasks.map((item) => [item.topicId, item.date]));
  });

  it("reports important topics that did not fit in the week", () => {
    const onlySunday = { ...settings, studyDays: [false, false, false, false, false, false, true] };
    const progress: ProgressMap = {
      "mat-3": { status: "and", mastery: 2, reviews: [] },
      "lin-3": { status: "and", mastery: 2, reviews: [] },
      "nat-3": { status: "and", mastery: 2, reviews: [] },
    };
    const result = generatePlan(context({ settings: onlySunday, progress }));
    expect(result.added.map((item) => item.areaId)).toEqual(["mat", "mat"]);
    expect(result.leftovers.map((item) => item.topicId)).toEqual(["lin-3", "nat-3"]);
  });
});

describe("repeatNextDay", () => {
  it("brings a topic that was not mastered back tomorrow", () => {
    const original = task({ id: "a", status: "concluida" });
    const { repeat, displaced, tasks } = repeatNextDay([original], original, settings, today, idGenerator());
    expect(repeat).toMatchObject({ topicId: "mat-0", date: "2026-10-17", origin: "repeticao", status: "planejada", focusSec: 0 });
    expect(displaced).toEqual([]);
    expect(tasks).toHaveLength(2);
  });

  it("skips rest days", () => {
    const saturday = task({ id: "a", date: "2026-10-17", status: "concluida" });
    expect(repeatNextDay([saturday], saturday, settings, "2026-10-17", idGenerator()).repeat.date).toBe("2026-10-19");
  });

  it("takes a spot on a full day of the same area, bumping a study task before a review", () => {
    const original = task({ id: "a", status: "concluida" });
    const tomorrow = [
      task({ id: "study", date: "2026-10-17", topicId: "mat-4" }),
      task({ id: "review", date: "2026-10-17", topicId: "mat-5", kind: "revisao" }),
    ];
    const result = repeatNextDay([original, ...tomorrow], original, settings, today, idGenerator());
    expect(result.repeat.date).toBe("2026-10-17");
    expect(result.displaced.map((item) => item.id)).toEqual(["study"]);
    expect(result.tasks.find((item) => item.id === "study")).toMatchObject({ date: "2026-10-19", origin: "transferida" });
    expectOneAreaPerDay(result.tasks);
  });

  it("turns tomorrow into a day of its area when tomorrow only has untouched generated tasks", () => {
    const original = task({ id: "a", status: "concluida" });
    const tomorrow = [task({ id: "b", date: "2026-10-17", topicId: "lin-0" }), task({ id: "c", date: "2026-10-17", topicId: "lin-1" })];
    const result = repeatNextDay([original, ...tomorrow], original, settings, today, idGenerator());
    expect(result.repeat.date).toBe("2026-10-17");
    expect(result.displaced.map((item) => item.id)).toEqual(["b", "c"]);
    expect(areasOn(result.tasks, "2026-10-17")).toEqual(new Set(["mat"]));
    expect(result.tasks.filter((item) => item.areaId === "lin").every((item) => item.date === "2026-10-19")).toBe(true);
    expectOneAreaPerDay(result.tasks);
  });

  it("never pushes out manual or started tasks of another area and moves on to the next day", () => {
    const original = task({ id: "a", status: "concluida" });
    const tomorrow = [task({ id: "b", date: "2026-10-17", origin: "manual", topicId: "lin-0" })];
    expect(repeatNextDay([original, ...tomorrow], original, settings, today, idGenerator()).repeat.date).toBe("2026-10-19");
  });
});

describe("carryOverMissed", () => {
  it("moves topics not studied on past days to the next study day of the same area", () => {
    const tasks = [
      task({ id: "a", date: "2026-10-14", topicId: "mat-3" }),
      task({ id: "b", date: "2026-10-15", status: "iniciada", focusSec: 600, topicId: "mat-4" }),
      task({ id: "done", date: "2026-10-15", status: "concluida", topicId: "nat-3" }),
    ];
    expect(missedTasks(tasks, today).map((item) => item.id)).toEqual(["a", "b"]);
    const { tasks: result, moved } = carryOverMissed(tasks, settings, today);
    expect(moved.map((item) => [item.id, item.date, item.origin])).toEqual([
      ["a", today, "transferida"],
      ["b", today, "transferida"],
    ]);
    expect(result.find((item) => item.id === "b")?.focusSec).toBe(600);
    expect(result.find((item) => item.id === "done")?.date).toBe("2026-10-15");
    expect(missedTasks(result, today)).toEqual([]);
  });

  it("never mixes areas or overloads a day", () => {
    const tasks = [
      task({ id: "m1", date: "2026-10-15", topicId: "mat-1" }),
      task({ id: "l1", date: "2026-10-15", topicId: "lin-1" }),
      task({ id: "m2", date: "2026-10-15", topicId: "mat-2" }),
      task({ id: "today", date: today, origin: "manual", topicId: "nat-0" }),
    ];
    const { tasks: result } = carryOverMissed(tasks, settings, today);
    expectOneAreaPerDay(result);
    expect(areasOn(result, today)).toEqual(new Set(["nat"]));
    expect(result.find((item) => item.id === "m1")?.date).toBe("2026-10-17");
    expect(result.find((item) => item.id === "m2")?.date).toBe("2026-10-17");
    expect(result.find((item) => item.id === "l1")?.date).toBe("2026-10-19");
  });

  it("does nothing when there is nothing to move", () => {
    const tasks = [task({ id: "a" })];
    expect(carryOverMissed(tasks, settings, today)).toEqual({ tasks, moved: [] });
  });
});

describe("moving and validating", () => {
  const tasks = [task({ id: "a" }), task({ id: "b", topicId: "mat-1" })];

  it("suggests the first study day of the same area (or empty) with fewer than two topics", () => {
    expect(suggestDay(tasks, settings, today, "mat")).toBe("2026-10-17");
    expect(suggestDay(tasks, settings, today, "mat", "a")).toBe(today);
    expect(suggestDay([task({ id: "c", topicId: "lin-0" })], settings, today, "mat")).toBe("2026-10-17");
    expect(suggestDay(tasks, { ...settings, studyDays: Array(7).fill(false) }, today, "mat")).toBeNull();
  });

  it("explains why a topic does not fit a day", () => {
    const single = [task({ id: "a" })];
    expect(dayConflict(single, today, "mat")).toBeNull();
    expect(dayConflict(single, today, "lin")).toMatch(/Esse dia é de Matemática/);
    expect(dayConflict(single, today, null)).toBeNull();
    expect(dayConflict(tasks, today, "mat")).toMatch(/já tem 2 matérias/);
    expect(dayConflict(tasks, today, "mat", "a")).toBeNull();
  });

  it("moves a task to a date or to another week", () => {
    expect(rescheduleTask(tasks, "a", "2026-10-20")[0]).toMatchObject({ date: "2026-10-20", status: "planejada" });
    const later = rescheduleTask(tasks, "a", null)[0];
    expect(later).toMatchObject({ date: null, status: "adiada" });
    expect(rescheduleTask([later], "a", "2026-10-21")[0].status).toBe("planejada");
  });

  it("lowers priority one step at a time", () => {
    expect(lowerPriority("alta")).toBe("media");
    expect(lowerPriority("media")).toBe("baixa");
    expect(lowerPriority("baixa")).toBe("baixa");
  });

  it("validates manual tasks and study days", () => {
    expect(validateTask({ topicId: null, date: "2026-10-15", priority: "media" }, today)).toMatch(/data/);
    expect(validateTask({ topicId: "mat-0", date: today, priority: "alta" }, today)).toBeNull();
    expect(validateStudyDays([true, false, false, false, false, false, false])).toBeNull();
    expect(validateStudyDays(Array(7).fill(false))).toMatch(/pelo menos um dia/);
    expect(validateStudyDays([true])).toMatch(/7 dias/);
  });

  it("adds focus to the task without ever concluding it by time", () => {
    const started = applyFocusToTask([task({ id: "a" })], "a", 7200);
    expect(started[0]).toMatchObject({ status: "iniciada", focusSec: 7200 });
    expect(applyFocusToTask(started, "a", 7200)[0]).toMatchObject({ status: "iniciada", focusSec: 14400 });
  });
});
