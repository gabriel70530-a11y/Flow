import { describe, expect, it } from "vitest";
import { areaTrend, minutesPerQuestion, targetMinutesPerQuestion, validateMockExam, type MockExam } from "./mock-exams";

const today = "2026-10-18";

function mock(overrides: Partial<MockExam>): MockExam {
  return {
    id: "a",
    date: today,
    day: 2,
    minutes: 300,
    sections: [
      { areaId: "nat", correct: 20, total: 45 },
      { areaId: "mat", correct: 25, total: 45 },
    ],
    note: "",
    ...overrides,
  };
}

describe("mock exams", () => {
  it("validates answers, dates and time", () => {
    const valid = { date: today, day: 2 as const, minutes: 280, sections: mock({}).sections, note: "" };
    expect(validateMockExam(valid, today)).toBeNull();
    expect(validateMockExam({ ...valid, date: "2026-10-19" }, today)).toMatch(/já fez/);
    expect(validateMockExam({ ...valid, sections: [] }, today)).toMatch(/pelo menos uma/);
    expect(validateMockExam({ ...valid, sections: [{ areaId: "mat", correct: 40, total: 46 }] }, today)).toMatch(/1 a 45/);
    expect(validateMockExam({ ...valid, sections: [{ areaId: "mat", correct: 30, total: 20 }] }, today)).toMatch(/passar/);
    expect(validateMockExam({ ...valid, minutes: 0 }, today)).toMatch(/minutos/);
  });

  it("computes pace against the official time", () => {
    expect(minutesPerQuestion(mock({ minutes: 270 }))).toBe(3);
    expect(minutesPerQuestion(mock({ day: 1, minutes: 330 }))).toBeCloseTo(3);
    expect(minutesPerQuestion(mock({ minutes: null }))).toBeNull();
    expect(targetMinutesPerQuestion(1)).toBe(3);
    expect(targetMinutesPerQuestion(2)).toBeCloseTo(3.33, 2);
  });

  it("compares an area with its previous mock", () => {
    const older = mock({ id: "o", date: "2026-10-01" });
    const newer = mock({ id: "n", sections: [{ areaId: "mat", correct: 36, total: 45 }] });
    expect(areaTrend([newer, older], "mat")).toEqual({ last: 0.8, previous: 25 / 45 });
    expect(areaTrend([newer, older], "nat")).toEqual({ last: 20 / 45, previous: null });
    expect(areaTrend([newer], "lin")).toBeNull();
  });
});
