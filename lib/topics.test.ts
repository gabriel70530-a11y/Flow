import { describe, expect, it } from "vitest";
import { legacyTopics } from "./legacy-topics";
import {
  EMPTY_FILTER,
  createTopic,
  deleteTopic,
  filterTopics,
  findTopic,
  setTopicHidden,
  sortTopics,
  updateTopic,
  validateTopic,
  visibleTopics,
  type TopicInput,
} from "./topics";

const input: TopicInput = { name: "Matrizes", areaId: "mat", subjectId: null, description: "Determinantes também", priority: "alta" };

describe("validateTopic", () => {
  const topics = legacyTopics();

  it("requires a name", () => {
    expect(validateTopic({ ...input, name: "   " }, topics)).toBe("Dê um nome ao tópico.");
  });

  it("refuses a duplicate name in the same area, ignoring case", () => {
    expect(validateTopic({ ...input, name: "probabilidade" }, topics)).toMatch(/Já existe/);
    expect(validateTopic({ ...input, name: "Probabilidade", areaId: "nat", subjectId: "fis" }, topics)).toBeNull();
  });

  it("allows keeping the same name while editing", () => {
    expect(validateTopic({ ...input, name: "Probabilidade" }, topics, "mat-3")).toBeNull();
  });

  it("requires a subject in Natureza and Humanas and ignores it elsewhere", () => {
    expect(validateTopic({ ...input, areaId: "nat" }, topics)).toBe("Escolha a matéria do tópico.");
    expect(validateTopic({ ...input, areaId: "nat", subjectId: "his" }, topics)).toBe("Escolha a matéria do tópico.");
    expect(validateTopic({ ...input, areaId: "nat", subjectId: "qui" }, topics)).toBeNull();
    expect(createTopic([], { ...input, subjectId: "qui" }, "custom-2")[0].subjectId).toBeNull();
  });

  it("limits name and description length", () => {
    expect(validateTopic({ ...input, name: "x".repeat(121) }, topics)).toMatch(/120/);
    expect(validateTopic({ ...input, description: "x".repeat(501) }, topics)).toMatch(/500/);
  });
});

describe("create, edit, hide and delete", () => {
  it("starts from an empty list and adds a topic with a trimmed name", () => {
    const created = createTopic([], { ...input, name: "  Matrizes " }, "custom-1");
    expect(created).toEqual([
      { id: "custom-1", areaId: "mat", subjectId: null, name: "Matrizes", description: "Determinantes também", priority: "alta", hidden: false },
    ]);
  });

  const created = createTopic(legacyTopics(), input, "custom-1");

  it("renames without changing the id", () => {
    const renamed = updateTopic(created, "mat-3", { ...input, name: "Probabilidade e estatística" });
    expect(findTopic(renamed, "mat-3")?.name).toBe("Probabilidade e estatística");
    expect(renamed).toHaveLength(created.length);
  });

  it("hides and shows a topic without removing it", () => {
    const hidden = setTopicHidden(created, "mat-3", true);
    expect(visibleTopics(hidden).some((topic) => topic.id === "mat-3")).toBe(false);
    expect(findTopic(setTopicHidden(hidden, "mat-3", false), "mat-3")?.hidden).toBe(false);
  });

  it("deletes any topic", () => {
    expect(findTopic(deleteTopic(created, "custom-1"), "custom-1")).toBeUndefined();
    expect(deleteTopic(created, "mat-3")).toHaveLength(created.length - 1);
  });
});

describe("filterTopics and sortTopics", () => {
  const topics = setTopicHidden(createTopic(legacyTopics(), input, "custom-1"), "mat-1", true);
  const progress = {
    "mat-0": { status: "concluido" as const, mastery: 4 as const, reviews: [{ stage: 1 as const, due: "2026-10-20" }] },
    "mat-2": { status: "revisar" as const, mastery: 2 as const, reviews: [] },
    "mat-3": { status: "and" as const, mastery: 2 as const, reviews: [{ stage: 2 as const, due: "2026-10-18" }] },
  };

  it("searches ignoring accents and case, including the description", () => {
    const ids = (query: string) => filterTopics(topics, progress, { ...EMPTY_FILTER, query }).map((topic) => topic.id);
    expect(ids("estatistica")).toEqual(["mat-2"]);
    expect(ids("DETERMINANTES")).toEqual(["custom-1"]);
  });

  it("filters by area, status and priority and skips hidden topics", () => {
    const math = filterTopics(topics, progress, { ...EMPTY_FILTER, areaId: "mat" });
    expect(math.map((topic) => topic.id)).not.toContain("mat-1");
    expect(math).toHaveLength(10);
    expect(filterTopics(topics, progress, { ...EMPTY_FILTER, status: "revisar" }).map((topic) => topic.id)).toEqual(["mat-2"]);
    expect(filterTopics(topics, progress, { ...EMPTY_FILTER, priority: "alta" }).map((topic) => topic.id)).toEqual(["custom-1"]);
  });

  it("sorts by status, priority, name, next review and creation order", () => {
    const math = filterTopics(topics, progress, { ...EMPTY_FILTER, areaId: "mat" });
    expect(sortTopics(math, progress, "status").slice(0, 2).map((topic) => topic.id)).toEqual(["mat-2", "mat-3"]);
    expect(sortTopics(math, progress, "status").at(-1)?.id).toBe("mat-0");
    expect(sortTopics(math, progress, "prioridade")[0].id).toBe("custom-1");
    expect(sortTopics(math, progress, "nome")[0].name).toBe("Análise combinatória");
    expect(sortTopics(math, progress, "revisao").slice(0, 2).map((topic) => topic.id)).toEqual(["mat-3", "mat-0"]);
    expect(sortTopics(math, progress, "criacao")).toEqual(math);
  });
});
