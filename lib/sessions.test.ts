import { describe, expect, it } from "vitest";
import { GENERAL_STUDY, createSession, needsReinforcement } from "./sessions";
import { legacyTopics } from "./legacy-topics";

const topics = legacyTopics();
const end = new Date(2026, 9, 16, 10, 30).getTime();
const base = { id: "s1", topics, mode: "pomodoro" as const, state: "concluida" as const, start: 0, end };

describe("createSession", () => {
  it("records the area of the topic and the local date", () => {
    expect(createSession({ ...base, topicId: "nat-2", seconds: 1500.4 })).toMatchObject({
      topicId: "nat-2",
      areaId: "nat",
      date: "2026-10-16",
      sec: 1500,
      start: end - 1500 * 1000,
    });
  });

  it("keeps general study without topic and without area", () => {
    expect(createSession({ ...base, topicId: GENERAL_STUDY, seconds: 600 })).toMatchObject({ topicId: null, areaId: null });
  });

  it("uses the real start when it includes pauses", () => {
    const start = end - 40 * 60 * 1000;
    expect(createSession({ ...base, topicId: "mat-0", seconds: 1500, start })?.start).toBe(start);
  });

  it("refuses sessions shorter than one minute, without topic or with invalid durations", () => {
    expect(createSession({ ...base, topicId: "mat-0", seconds: 59 })).toBeNull();
    expect(createSession({ ...base, topicId: "", seconds: 600 })).toBeNull();
    expect(createSession({ ...base, topicId: "mat-0", seconds: Number.NaN })).toBeNull();
    expect(createSession({ ...base, topicId: "mat-0", seconds: -600 })).toBeNull();
  });

  it("links the plan task when there is one", () => {
    expect(createSession({ ...base, topicId: "mat-0", seconds: 600, taskId: "t1" })?.taskId).toBe("t1");
    expect(createSession({ ...base, topicId: "mat-0", seconds: 600 })).not.toHaveProperty("taskId");
  });
});

describe("needsReinforcement", () => {
  it("suggests review only for the two hard answers", () => {
    expect(needsReinforcement("revisar")).toBe(true);
    expect(needsReinforcement("dificuldade")).toBe(true);
    expect(needsReinforcement("parcial")).toBe(false);
    expect(needsReinforcement(undefined)).toBe(false);
  });
});
