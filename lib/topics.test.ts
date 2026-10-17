import { describe, expect, it } from "vitest";
import {
  createTopic,
  defaultTopics,
  deleteTopic,
  findTopic,
  restoreDefaults,
  restoreDefaultsChanges,
  setTopicHidden,
  updateTopic,
  validateTopic,
  visibleTopics,
  type TopicInput,
} from "./topics";

const input: TopicInput = { name: "Matrizes", areaId: "mat", description: "Determinantes também", priority: "alta" };

describe("defaultTopics", () => {
  it("seeds the 44 default topics with stable ids", () => {
    const topics = defaultTopics();
    expect(topics).toHaveLength(44);
    expect(findTopic(topics, "mat-3")?.name).toBe("Probabilidade");
    expect(new Set(topics.map((topic) => topic.id)).size).toBe(44);
  });
});

describe("validateTopic", () => {
  const topics = defaultTopics();

  it("requires a name", () => {
    expect(validateTopic({ ...input, name: "   " }, topics)).toBe("Dê um nome ao tópico.");
  });

  it("refuses a duplicate name in the same area, ignoring case", () => {
    expect(validateTopic({ ...input, name: "probabilidade" }, topics)).toMatch(/Já existe/);
    expect(validateTopic({ ...input, name: "Probabilidade", areaId: "nat" }, topics)).toBeNull();
  });

  it("allows keeping the same name while editing", () => {
    expect(validateTopic({ ...input, name: "Probabilidade" }, topics, "mat-3")).toBeNull();
  });

  it("limits name and description length", () => {
    expect(validateTopic({ ...input, name: "x".repeat(121) }, topics)).toMatch(/120/);
    expect(validateTopic({ ...input, description: "x".repeat(501) }, topics)).toMatch(/500/);
  });
});

describe("create, edit, hide and delete", () => {
  const created = createTopic(defaultTopics(), input, "custom-1");

  it("adds a custom topic with a trimmed name", () => {
    expect(findTopic(created, "custom-1")).toMatchObject({ name: "Matrizes", origin: "personalizado", hidden: false });
  });

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

  it("deletes only custom topics", () => {
    expect(deleteTopic(created, "custom-1")).toHaveLength(44);
    expect(deleteTopic(created, "mat-3")).toHaveLength(45);
  });
});

describe("restoreDefaults", () => {
  const edited = setTopicHidden(
    updateTopic(createTopic(defaultTopics(), input, "custom-1"), "mat-3", { ...input, name: "Prob", priority: "baixa" }),
    "lin-0",
    true,
  );

  it("lists what will change before restoring", () => {
    expect(restoreDefaultsChanges(edited).map(({ topic, changes }) => [topic.id, changes])).toEqual([
      ["mat-3", ["nome", "descricao"]],
      ["lin-0", ["reexibir"]],
    ]);
  });

  it("restores names and visibility, keeps priority and custom topics, never duplicates", () => {
    const restored = restoreDefaults(edited);
    expect(restored).toHaveLength(45);
    expect(findTopic(restored, "mat-3")).toMatchObject({ name: "Probabilidade", description: "", priority: "baixa" });
    expect(findTopic(restored, "lin-0")?.hidden).toBe(false);
    expect(findTopic(restored, "custom-1")?.name).toBe("Matrizes");
    expect(restoreDefaults(restored)).toEqual(restored);
    expect(restoreDefaultsChanges(restored)).toEqual([]);
  });

  it("adds back a default that is missing", () => {
    const missing = defaultTopics().filter((topic) => topic.id !== "red-6");
    expect(restoreDefaultsChanges(missing)).toEqual([{ topic: expect.objectContaining({ id: "red-6" }), changes: ["adicionar"] }]);
    expect(restoreDefaults(missing)).toHaveLength(44);
  });
});
