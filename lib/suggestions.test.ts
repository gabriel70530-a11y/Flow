import { describe, expect, it } from "vitest";
import { hasTopicNamed, topicSuggestions } from "./suggestions";
import { SUBJECTS } from "./syllabus";
import type { TopicRecord } from "./topics";

describe("topic suggestions", () => {
  it("lists suggestions per area and per subject, starting with what falls most", () => {
    expect(topicSuggestions("mat", null)?.[0]).toBe("Razão e proporção");
    expect(topicSuggestions("nat", "bio")?.[0]).toBe("Ecologia");
    expect(topicSuggestions("hum", "his")).toContain("Era Vargas");
    expect(topicSuggestions("red", null)).toContain("Proposta de intervenção");
  });

  it("asks for the subject first in areas that have subjects", () => {
    expect(topicSuggestions("nat", null)).toBeNull();
    expect(topicSuggestions("hum", null)).toBeNull();
  });

  it("has a short list for every subject, without duplicates", () => {
    for (const subject of SUBJECTS) {
      const list = topicSuggestions(subject.areaId, subject.id) ?? [];
      expect(list.length).toBeGreaterThan(3);
      expect(list.length).toBeLessThanOrEqual(10);
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it("recognizes existing topics ignoring accents and case, only in the same area", () => {
    const topics: TopicRecord[] = [
      { id: "a", areaId: "nat", subjectId: "bio", name: " ecologia ", description: "", priority: "media", hidden: false },
      { id: "b", areaId: "mat", subjectId: null, name: "Razao e proporcao", description: "", priority: "media", hidden: false },
    ];
    expect(hasTopicNamed(topics, "nat", "Ecologia")).toBe(true);
    expect(hasTopicNamed(topics, "mat", "Razão e proporção")).toBe(true);
    expect(hasTopicNamed(topics, "lin", "Ecologia")).toBe(false);
  });
});
