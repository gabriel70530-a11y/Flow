import { describe, expect, it } from "vitest";
import {
  activeDays,
  formatDuration,
  formatHours,
  goalProgress,
  leastStudiedArea,
  plannedVersusDone,
  secondsByArea,
  secondsByDay,
  studyStreak,
  topicCounts,
  weekDays,
} from "./stats";
import { defaultTopics } from "./topics";
import type { StudySession } from "./sessions";
import type { AreaId } from "./syllabus";

function session(topicId: string, date: string, minutes: number): StudySession {
  return {
    id: `${topicId}-${date}`,
    topicId,
    areaId: topicId.split("-")[0] as AreaId,
    date,
    start: 0,
    end: minutes * 60_000,
    sec: minutes * 60,
    mode: "pomodoro",
    state: "concluida",
  };
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

  it("leaves general study out of the area totals", () => {
    const general = { ...session("mat-0", "2026-10-12", 30), topicId: null, areaId: null };
    expect(Object.values(secondsByArea([general], "2026-10-12", "2026-10-18")).every((seconds) => seconds === 0)).toBe(true);
  });

  it("keeps the area recorded on the session even if the topic moves later", () => {
    const moved = { ...session("mat-0", "2026-10-12", 30), areaId: "lin" as const };
    expect(secondsByArea([moved], "2026-10-12", "2026-10-18")).toMatchObject({ mat: 0, lin: 1800 });
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

describe("goals and summaries", () => {
  const week = ["2026-10-12", "2026-10-18"] as const;
  const progress = {
    "mat-0": { status: "concluido" as const, mastery: 3 as const, completedAt: "2026-10-13", reviews: [] },
    "mat-1": { status: "concluido" as const, mastery: 3 as const, completedAt: "2026-10-01", reviews: [] },
    "mat-2": { status: "and" as const, mastery: 2 as const, reviews: [] },
    "mat-3": { status: "revisar" as const, mastery: 1 as const, reviews: [] },
  };

  it("measures the weekly goal in hours, sessions or concluded topics", () => {
    const hours = goalProgress({ type: "horas", value: 10 }, sessions, progress, ...week);
    expect(hours.done).toBeCloseTo(185 / 60);
    expect(hours.target).toBe(10);
    expect(goalProgress({ type: "sessoes", value: 5 }, sessions, progress, ...week)).toEqual({ done: 4, target: 5 });
    expect(goalProgress({ type: "topicos", value: 3 }, sessions, progress, ...week)).toEqual({ done: 1, target: 3 });
  });

  it("compares planned minutes with recorded study and ignores postponed tasks", () => {
    const base = { topicId: "mat-0", areaId: "mat" as const, kind: "estudo" as const, priority: "media" as const, origin: "gerada" as const, focusSec: 0 };
    const tasks = [
      { ...base, id: "a", date: "2026-10-12", minutes: 60, status: "concluida" as const, focusSec: 3000 },
      { ...base, id: "b", date: "2026-10-14", minutes: 50, status: "planejada" as const },
      { ...base, id: "c", date: null, minutes: 50, status: "adiada" as const },
      { ...base, id: "d", date: "2026-10-20", minutes: 50, status: "planejada" as const },
    ];
    expect(plannedVersusDone(tasks, sessions, ...week)).toEqual({
      plannedMinutes: 110,
      taskCount: 2,
      tasksDone: 1,
      taskFocusSeconds: 3000,
      doneSeconds: 185 * 60,
    });
  });

  it("counts active days and suggests the least studied area only with data", () => {
    expect(activeDays(sessions, ...week)).toBe(3);
    expect(leastStudiedArea(sessions, ...week)).toBe("red");
    expect(leastStudiedArea([], ...week)).toBeNull();
  });

  it("counts visible topics by status", () => {
    const topics = defaultTopics().map((topic) => (topic.id === "mat-3" ? { ...topic, hidden: true } : topic));
    expect(topicCounts(progress, topics)).toEqual({ total: 43, concluded: 2, inProgress: 1, needsReview: 0 });
  });
});
