import { describe, expect, it } from "vitest";
import { addDays, dayLabel, dueLabel, mondayOf, shortDate, toDateKey, weekdayIndex } from "./dates";

describe("toDateKey", () => {
  it("uses the local date, not UTC", () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("mondayOf", () => {
  it("returns the same day for a Monday", () => {
    expect(mondayOf("2026-10-12")).toBe("2026-10-12");
  });

  it("returns the previous Monday for mid-week days", () => {
    expect(mondayOf("2026-10-15")).toBe("2026-10-12");
  });

  it("treats Sunday as the last day of the week", () => {
    expect(mondayOf("2026-10-18")).toBe("2026-10-12");
  });

  it("crosses month boundaries", () => {
    expect(mondayOf("2026-11-01")).toBe("2026-10-26");
  });
});

describe("shortDate", () => {
  it("formats as dd/mm", () => {
    expect(shortDate("2026-03-07")).toBe("07/03");
  });
});

describe("dueLabel", () => {
  const today = "2026-10-16";

  it("labels late, today, tomorrow and later dates", () => {
    expect(dueLabel("2026-10-10", today)).toBe("Atrasada desde 10/10");
    expect(dueLabel(today, today)).toBe("Hoje");
    expect(dueLabel("2026-10-17", today)).toBe("Amanhã");
    expect(dueLabel("2026-10-20", today)).toBe("20/10");
  });
});

describe("dayLabel and weekdayIndex", () => {
  it("names today, tomorrow and other days with weekday", () => {
    expect(dayLabel("2026-10-16", "2026-10-16")).toBe("Hoje");
    expect(dayLabel("2026-10-17", "2026-10-16")).toBe("Amanhã");
    expect(dayLabel("2026-10-19", "2026-10-16")).toBe("seg 19/10");
    expect(weekdayIndex("2026-10-18")).toBe(6);
  });
});
