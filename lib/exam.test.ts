import { describe, expect, it } from "vitest";
import { checklistIds, countdownLabel, daysUntil, isFinalStretch, secondExamDay, suggestedExamDate } from "./exam";

describe("exam dates", () => {
  it("counts days and detects the last four weeks", () => {
    expect(daysUntil("2026-11-08", "2026-10-18")).toBe(21);
    expect(isFinalStretch("2026-11-08", "2026-10-18")).toBe(true);
    expect(isFinalStretch("2026-11-08", "2026-10-01")).toBe(false);
    expect(isFinalStretch("2026-11-08", "2026-11-09")).toBe(false);
    expect(isFinalStretch(null, "2026-10-18")).toBe(false);
  });

  it("labels the countdown and finds the second day", () => {
    expect(countdownLabel("2026-11-08", "2026-11-08")).toBe("A prova é hoje");
    expect(countdownLabel("2026-11-08", "2026-11-07")).toBe("A prova é amanhã");
    expect(countdownLabel("2026-11-08", "2026-10-18")).toBe("21 dias para a prova");
    expect(secondExamDay("2026-11-08")).toBe("2026-11-15");
    expect(secondExamDay("2027-11-07")).toBe("2027-11-14");
  });

  it("suggests the Enem date only before it happens", () => {
    expect(suggestedExamDate("2026-10-18")).toBe("2026-11-08");
    expect(suggestedExamDate("2026-12-01")).toBeNull();
  });

  it("has unique checklist items per day", () => {
    const ids = [...checklistIds(1), ...checklistIds(2)];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
