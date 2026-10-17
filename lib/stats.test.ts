import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatHours,
  secondsByArea,
  secondsByDay,
  studyStreak,
  weekDays,
  type StudySession,
} from "./stats";

function session(topicId: string, date: string, minutes: number): StudySession {
  return { id: `${topicId}-${date}`, topicId, date, sec: minutes * 60, mode: "pomodoro", ts: 0 };
}

const sessions = [
  session("mat-0", "2026-10-11", 60),
  session("mat-0", "2026-10-12", 30),
  session("lin-2", "2026-10-12", 45),
  session("nat-1", "2026-10-14", 90),
  session("hum-0", "2026-10-18", 20),
  session("red-0", "2026-10-19", 50),
];

describe("weekDays", () => {
  it("lists Monday through Sunday", () => {
    expect(weekDays("2026-10-26")).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });
});

describe("secondsByDay", () => {
  it("sums sessions per day and fills empty days with zero", () => {
    expect(secondsByDay(sessions, weekDays("2026-10-12"))).toEqual([75 * 60, 0, 90 * 60, 0, 0, 0, 20 * 60]);
  });
});

describe("secondsByArea", () => {
  it("sums only sessions inside the range, by area", () => {
    expect(secondsByArea(sessions, "2026-10-12", "2026-10-18")).toEqual({
      mat: 30 * 60,
      lin: 45 * 60,
      nat: 90 * 60,
      hum: 20 * 60,
      red: 0,
    });
  });

  it("ignores sessions of unknown topics", () => {
    expect(secondsByArea([session("xyz-0", "2026-10-12", 30)], "2026-10-12", "2026-10-18").mat).toBe(0);
  });
});

describe("studyStreak", () => {
  const days = (...dates: string[]) => dates.map((date) => session("mat-0", date, 30));

  it("counts consecutive days including today", () => {
    expect(studyStreak(days("2026-10-14", "2026-10-15", "2026-10-16"), "2026-10-16")).toBe(3);
  });

  it("counts from yesterday when today has no study yet", () => {
    expect(studyStreak(days("2026-10-14", "2026-10-15"), "2026-10-16")).toBe(2);
  });

  it("stops at the first gap", () => {
    expect(studyStreak(days("2026-10-12", "2026-10-14", "2026-10-15", "2026-10-16"), "2026-10-16")).toBe(3);
  });

  it("is zero when neither today nor yesterday had study", () => {
    expect(studyStreak(days("2026-10-13", "2026-10-14"), "2026-10-16")).toBe(0);
  });
});

describe("formatting", () => {
  it("formats hours with one decimal in pt-BR", () => {
    expect(formatHours(5400)).toBe("1,5");
    expect(formatHours(7200)).toBe("2");
    expect(formatHours(0)).toBe("0");
  });

  it("formats durations as minutes or hours", () => {
    expect(formatDuration(25 * 60)).toBe("25 min");
    expect(formatDuration(60 * 60)).toBe("1h");
    expect(formatDuration(95 * 60)).toBe("1h35");
    expect(formatDuration(65 * 60)).toBe("1h05");
  });
});
