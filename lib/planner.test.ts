import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLANNER,
  MAX_TOPICS_PER_DAY,
  applyFocusToTask,
  carryOverMissed,
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
import { defaultTopics, setTopicHidden, updateTopic } from "./topics";

// 2026-10-16 é sexta-feira. Estuda de segunda a sábado; domingo é livre.
const today = "2026-10-16";
const settings: PlannerSettings = { ...DEFAULT_PLANNER, studyDays: [true, true, true, true, true, true, false] };
const week = ["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"];

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
    priority: "media",
    status: "planejada",
    origin: "gerada",
    focusSec: 0,
    ...overrides,
  };
}

describe("generatePlan", () => {
  it("puts at most two topics on each study day and none on rest days", () => {
    const { tasks } = generatePlan(context());
    for (const date of week) {
      expect(topicsOn(tasks, date)).toBe(date === "2026-10-18" ? 0 : MAX_TOPICS_PER_DAY);
    }
    expect(tasks).toHaveLength(12);
  });

  it("schedules a topic at most once and leaves hidden and concluded topics out", () => {
    const topics = setTopicHidden(defaultTopics(), "mat-0", true);
    const progress: ProgressMap = { "mat-1": changeStatus(EMPTY_PROGRESS, "concluido", "2026-09-01") };
    const { tasks } = generatePlan(context({ topics, progress }));
    const studyIds = tasks.filter((item) => item.kind === "estudo").map((item) => item.topicId);
    expect(new Set(studyIds).size).toBe(studyIds.length);
    expect(tasks.map((item) => item.topicId)).not.toContain("mat-0");
    expect(studyIds).not.toContain("mat-1");
  });

  it("puts overdue and due reviews first, on the first study day from their date", () => {
    const progress: ProgressMap = {
      "hum-1": changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-01"),
      "lin-0": changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-17"),
    };
    const reviews = generatePlan(context({ progress })).added.filter((item) => item.kind === "revisao");
    // A revisão de lin-0 vence no domingo, dia livre: vai para segunda.
    expect(reviews.map((item) => [item.topicId, item.date])).toEqual([
      ["hum-1", today],
      ["lin-0", "2026-10-19"],
    ]);
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

  it("keeps done, started, manual, repeated, carried and past tasks and only replaces future generated plans", () => {
    const tasks = [
      task({ id: "done", status: "concluida", topicId: "mat-0" }),
      task({ id: "started", status: "iniciada", topicId: "mat-1" }),
      task({ id: "manual", origin: "manual", topicId: "mat-2", date: "2026-10-19" }),
      task({ id: "repeat", origin: "repeticao", topicId: "mat-5", date: "2026-10-20" }),
      task({ id: "carried", origin: "transferida", topicId: "mat-6", date: "2026-10-20" }),
      task({ id: "past", date: "2026-10-14", topicId: "mat-3" }),
      task({ id: "old-plan", date: "2026-10-21", topicId: "mat-4" }),
    ];
    const result = generatePlan(context({ tasks }));
    const ids = result.tasks.map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining(["done", "started", "manual", "repeat", "carried", "past"]));
    expect(ids).not.toContain("old-plan");
    expect(result.removed.map((item) => item.id)).toEqual(["old-plan"]);
    expect(result.added.map((item) => item.topicId)).not.toContain("mat-1");
    // Hoje e terça já têm duas matérias mantidas: nada novo entra nesses dias.
    expect(result.added.filter((item) => item.date === today || item.date === "2026-10-20")).toEqual([]);
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
    expect(result.added).toHaveLength(2);
    expect(result.leftovers.map((item) => item.topicId)).toHaveLength(1);
  });
});

describe("repeatNextDay", () => {
  it("brings a topic that was not mastered back tomorrow", () => {
    const original = task({ id: "a", status: "concluida" });
    const { repeat, displaced, tasks } = repeatNextDay([original], original, settings, today, idGenerator());
    expect(repeat).toMatchObject({ topicId: "mat-0", date: "2026-10-17", origin: "repeticao", status: "planejada", focusSec: 0 });
    expect(displaced).toBeNull();
    expect(tasks).toHaveLength(2);
  });

  it("skips rest days", () => {
    const saturday = task({ id: "a", date: "2026-10-17", status: "concluida" });
    expect(repeatNextDay([saturday], saturday, settings, "2026-10-17", idGenerator()).repeat.date).toBe("2026-10-19");
  });

  it("takes the place of a generated task when tomorrow already has two topics", () => {
    const original = task({ id: "a", status: "concluida" });
    const tomorrow = [task({ id: "b", date: "2026-10-17", topicId: "lin-0" }), task({ id: "c", date: "2026-10-17", topicId: "nat-0" })];
    const result = repeatNextDay([original, ...tomorrow], original, settings, today, idGenerator());
    expect(result.repeat.date).toBe("2026-10-17");
    expect(result.displaced?.id).toBe("c");
    expect(topicsOn(result.tasks, "2026-10-17")).toBe(2);
  });

  it("never pushes out manual or started tasks and moves on to the next day", () => {
    const original = task({ id: "a", status: "concluida" });
    const tomorrow = [
      task({ id: "b", date: "2026-10-17", origin: "manual", topicId: "lin-0" }),
      task({ id: "c", date: "2026-10-17", status: "iniciada", topicId: "nat-0" }),
    ];
    expect(repeatNextDay([original, ...tomorrow], original, settings, today, idGenerator()).repeat.date).toBe("2026-10-19");
  });
});

describe("carryOverMissed", () => {
  it("moves topics not studied on past days to the next study day, without being required", () => {
    const tasks = [
      task({ id: "a", date: "2026-10-14", topicId: "mat-3" }),
      task({ id: "b", date: "2026-10-15", status: "iniciada", focusSec: 600, topicId: "lin-3" }),
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

  it("does not overload today: extra topics go to the following study days", () => {
    const tasks = [
      task({ id: "m1", date: "2026-10-15", topicId: "mat-1" }),
      task({ id: "m2", date: "2026-10-15", topicId: "mat-2" }),
      task({ id: "m3", date: "2026-10-15", topicId: "mat-3" }),
      task({ id: "today", date: today, origin: "manual", topicId: "lin-0" }),
    ];
    const { tasks: result } = carryOverMissed(tasks, settings, today);
    for (const date of week) expect(topicsOn(result, date)).toBeLessThanOrEqual(MAX_TOPICS_PER_DAY);
    expect(result.find((item) => item.id === "m1")?.date).toBe(today);
    expect(result.find((item) => item.id === "m2")?.date).toBe("2026-10-17");
  });

  it("does nothing when there is nothing to move", () => {
    const tasks = [task({ id: "a" })];
    expect(carryOverMissed(tasks, settings, today)).toEqual({ tasks, moved: [] });
  });
});

describe("moving and validating", () => {
  const tasks = [task({ id: "a" }), task({ id: "b", topicId: "lin-0" })];

  it("suggests the first study day with fewer than two topics", () => {
    expect(suggestDay(tasks, settings, today)).toBe("2026-10-17");
    expect(suggestDay(tasks, settings, today, "a")).toBe(today);
    expect(suggestDay(tasks, { ...settings, studyDays: Array(7).fill(false) }, today)).toBeNull();
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

describe("displaced tasks", () => {
  it("move forward to the next study day instead of disappearing", () => {
    const original = task({ id: "a", status: "concluida" });
    const tomorrow = [task({ id: "b", date: "2026-10-17", topicId: "lin-0" }), task({ id: "c", date: "2026-10-17", topicId: "nat-0" })];
    const monday = [task({ id: "d", date: "2026-10-19", topicId: "hum-0" })];
    const result = repeatNextDay([original, ...tomorrow, ...monday], original, settings, today, idGenerator());
    expect(result.displaced?.id).toBe("c");
    expect(result.tasks.find((item) => item.id === "c")).toMatchObject({ date: "2026-10-19", origin: "transferida" });
    expect(result.tasks).toHaveLength(5);
    for (const date of week) expect(topicsOn(result.tasks, date)).toBeLessThanOrEqual(MAX_TOPICS_PER_DAY);
  });
});

describe("making room", () => {
  it("bumps a study task before a review", () => {
    const original = task({ id: "a", status: "concluida" });
    const tomorrow = [
      task({ id: "study", date: "2026-10-17", topicId: "lin-0" }),
      task({ id: "review", date: "2026-10-17", topicId: "nat-0", kind: "revisao" }),
    ];
    const result = repeatNextDay([original, ...tomorrow], original, settings, today, idGenerator());
    expect(result.displaced?.id).toBe("study");
    expect(result.tasks.find((item) => item.id === "review")?.date).toBe("2026-10-17");
  });
});
