import { describe, expect, it } from "vitest";
import {
  EMPTY_PROGRESS,
  changeStatus,
  completeNextReview,
  groupReviews,
  nextReview,
  pendingReviews,
  scheduleReviews,
  type TopicProgress,
} from "./reviews";

const today = "2026-10-16";

describe("scheduleReviews", () => {
  it("schedules the four stages at +1, +7, +15 and +30 days", () => {
    expect(scheduleReviews(today, 1)).toEqual([
      { stage: 1, due: "2026-10-17" },
      { stage: 2, due: "2026-10-23" },
      { stage: 3, due: "2026-10-31" },
      { stage: 4, due: "2026-11-15" },
    ]);
  });

  it("schedules only the remaining stages with their own intervals", () => {
    expect(scheduleReviews(today, 3)).toEqual([
      { stage: 3, due: "2026-10-31" },
      { stage: 4, due: "2026-11-15" },
    ]);
  });

  it("schedules nothing after the last stage", () => {
    expect(scheduleReviews(today, 5)).toEqual([]);
  });
});

describe("changeStatus", () => {
  it("schedules four reviews when a topic is concluded", () => {
    const result = changeStatus(EMPTY_PROGRESS, "concluido", today);
    expect(result.status).toBe("concluido");
    expect(result.completedAt).toBe(today);
    expect(result.reviews).toEqual(scheduleReviews(today, 1));
  });

  it("keeps done reviews and drops pending ones when un-concluded", () => {
    const concluded: TopicProgress = {
      status: "concluido",
      mastery: 3,
      completedAt: "2026-10-01",
      reviews: [
        { stage: 1, due: "2026-10-02", done: "2026-10-02" },
        { stage: 2, due: "2026-10-08", done: "2026-10-09" },
        { stage: 3, due: "2026-10-16" },
        { stage: 4, due: "2026-10-31" },
      ],
    };
    const result = changeStatus(concluded, "and", today);
    expect(result.status).toBe("and");
    expect(result.completedAt).toBeUndefined();
    expect(result.mastery).toBe(3);
    expect(result.reviews).toEqual(concluded.reviews.slice(0, 2));
  });

  it("reschedules only the remaining stages from today when re-concluded", () => {
    const reopened: TopicProgress = {
      status: "and",
      mastery: 2,
      reviews: [{ stage: 1, due: "2026-10-02", done: "2026-10-02" }],
    };
    const result = changeStatus(reopened, "concluido", today);
    expect(result.reviews).toEqual([
      { stage: 1, due: "2026-10-02", done: "2026-10-02" },
      { stage: 2, due: "2026-10-23" },
      { stage: 3, due: "2026-10-31" },
      { stage: 4, due: "2026-11-15" },
    ]);
  });

  it("returns the same object when the status does not change", () => {
    expect(changeStatus(EMPTY_PROGRESS, "nao", today)).toBe(EMPTY_PROGRESS);
  });
});

describe("completeNextReview", () => {
  it("marks only the next pending review as done today", () => {
    const concluded = changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-01");
    const result = completeNextReview(concluded, today);
    expect(result.reviews[0].done).toBe(today);
    expect(result.reviews.slice(1).every((review) => !review.done)).toBe(true);
    expect(nextReview(result)?.stage).toBe(2);
  });

  it("leaves no next review after the last stage", () => {
    let progress = changeStatus(EMPTY_PROGRESS, "concluido", "2026-09-01");
    for (let stage = 0; stage < 4; stage++) progress = completeNextReview(progress, today);
    expect(nextReview(progress)).toBeUndefined();
  });
});

describe("pendingReviews and groupReviews", () => {
  const progress = {
    "mat-0": changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-10"),
    "lin-0": changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-15"),
    "nat-0": changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-12"),
    "hum-0": changeStatus(EMPTY_PROGRESS, "concluido", "2026-09-01"),
    "red-0": { status: "and", mastery: 1, reviews: [] } satisfies TopicProgress,
  };

  it("lists the next pending review of each topic, sorted by due date", () => {
    expect(pendingReviews(progress).map(({ topicId, review }) => [topicId, review.due])).toEqual([
      ["hum-0", "2026-09-02"],
      ["mat-0", "2026-10-11"],
      ["nat-0", "2026-10-13"],
      ["lin-0", "2026-10-16"],
    ]);
  });

  it("groups late, due today and the next 7 days", () => {
    const withUpcoming = { ...progress, "mat-1": changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-22") };
    const groups = groupReviews(pendingReviews(withUpcoming), today);
    expect(groups.late.map((item) => item.topicId)).toEqual(["hum-0", "mat-0", "nat-0"]);
    expect(groups.today.map((item) => item.topicId)).toEqual(["lin-0"]);
    expect(groups.upcoming.map((item) => item.topicId)).toEqual(["mat-1"]);
  });

  it("leaves reviews more than 7 days ahead out of the upcoming group", () => {
    const farAhead = { "mat-0": changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-23") };
    expect(groupReviews(pendingReviews(farAhead), today).upcoming).toEqual([]);
  });
});
