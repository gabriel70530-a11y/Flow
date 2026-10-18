import { describe, expect, it } from "vitest";
import {
  createMistake,
  dueMistakes,
  mainReason,
  openMistakesOnTopic,
  reviewMistake,
  validateMistake,
  type MistakeInput,
} from "./mistakes";

const today = "2026-10-18";
const input: MistakeInput = {
  topicId: "custom-1",
  areaId: "mat",
  subjectId: null,
  reason: "conteudo",
  question: "  Questão 140 do Enem 2023, porcentagem  ",
  lesson: "Aumento de 20% é multiplicar por 1,2.",
  source: "Simulado MEC",
};

describe("mistakes", () => {
  it("validates the question and limits", () => {
    expect(validateMistake({ ...input, question: " " })).toMatch(/Descreva/);
    expect(validateMistake({ ...input, lesson: "x".repeat(501) })).toMatch(/500/);
    expect(validateMistake(input)).toBeNull();
  });

  it("creates a mistake due tomorrow with trimmed text", () => {
    const mistake = createMistake(input, "m1", today);
    expect(mistake).toMatchObject({ id: "m1", question: "Questão 140 do Enem 2023, porcentagem", stage: 0, due: "2026-10-19" });
  });

  it("moves through 1, 7, 15 and 30 days and leaves the queue after four reviews remembered", () => {
    let mistake = createMistake(input, "m1", today);
    const dues: (string | null)[] = [];
    for (const date of ["2026-10-19", "2026-10-26", "2026-11-10", "2026-12-10"]) {
      mistake = reviewMistake(mistake, date, true);
      dues.push(mistake.due);
    }
    expect(dues).toEqual(["2026-10-26", "2026-11-10", "2026-12-10", null]);
    expect(mistake.history).toHaveLength(4);
  });

  it("starts over tomorrow when not remembered", () => {
    const advanced = reviewMistake(createMistake(input, "m1", today), "2026-10-19", true);
    expect(reviewMistake(advanced, "2026-10-26", false)).toMatchObject({ stage: 0, due: "2026-10-27" });
  });

  it("lists due mistakes, counts open ones per topic and finds the main reason", () => {
    const first = createMistake(input, "a", "2026-10-10");
    const second = createMistake({ ...input, reason: "interpretacao" }, "b", today);
    const done = { ...createMistake(input, "c", today), due: null };
    expect(dueMistakes([second, first, done], today).map((mistake) => mistake.id)).toEqual(["a"]);
    expect(openMistakesOnTopic([first, second, done], "custom-1")).toBe(2);
    expect(mainReason([first, second])).toBeNull();
    expect(mainReason([first, second, done])).toEqual({ reason: "conteudo", count: 2 });
  });
});
