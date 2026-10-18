import { describe, expect, it } from "vitest";
import {
  EMPTY_PROGRESS,
  changeStatus,
  completeNextReview,
  groupReviews,
  nextReview,
  pendingReviews,
  postponeNextReview,
  rescheduleNextReview,
  scheduleReviews,
  type TopicProgress,
} from "./reviews";
import { legacyTopics } from "./legacy-topics";
import { setTopicHidden } from "./topics";

const topics = legacyTopics();

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
    expect(pendingReviews(progress, topics).map(({ topicId, review }) => [topicId, review.due])).toEqual([
      ["hum-0", "2026-09-02"],
      ["mat-0", "2026-10-11"],
      ["nat-0", "2026-10-13"],
      ["lin-0", "2026-10-16"],
    ]);
  });

  it("groups late, due today and the next 7 days", () => {
    const withUpcoming = { ...progress, "mat-1": changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-22") };
    const groups = groupReviews(pendingReviews(withUpcoming, topics), today);
    expect(groups.late.map((item) => item.topicId)).toEqual(["hum-0", "mat-0", "nat-0"]);
    expect(groups.today.map((item) => item.topicId)).toEqual(["lin-0"]);
    expect(groups.upcoming.map((item) => item.topicId)).toEqual(["mat-1"]);
  });

  it("puts reviews more than 7 days ahead in the later group", () => {
    const farAhead = { "mat-0": changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-23") };
    const groups = groupReviews(pendingReviews(farAhead, topics), today);
    expect(groups.upcoming).toEqual([]);
    expect(groups.later.map((item) => item.topicId)).toEqual(["mat-0"]);
  });

  it("keeps reviews of hidden topics stored but out of the list", () => {
    const hidden = setTopicHidden(topics, "mat-0", true);
    expect(pendingReviews(progress, hidden).map((item) => item.topicId)).not.toContain("mat-0");
    expect(progress["mat-0"].reviews).toHaveLength(4);
  });
});

describe("status changes", () => {
  it("drops pending reviews when a concluded topic needs review again", () => {
    const concluded = completeNextReview(changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-01"), "2026-10-02");
    const result = changeStatus(concluded, "revisar", today);
    expect(result.status).toBe("revisar");
    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0].done).toBe("2026-10-02");
  });
});

describe("feedback, postpone and reschedule", () => {
  const concluded = changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-10");

  it("stores the optional feedback only on the completed review", () => {
    const result = completeNextReview(concluded, today, "dificil");
    expect(result.reviews[0]).toMatchObject({ done: today, feedback: "dificil" });
    expect(result.reviews[1].feedback).toBeUndefined();
  });

  it("moves an overdue review to tomorrow and keeps the next stages", () => {
    const result = postponeNextReview(concluded, today);
    expect(result.reviews[0]).toMatchObject({
      due: "2026-10-17",
      reschedules: [{ from: "2026-10-11", to: "2026-10-17", at: today }],
    });
    expect(result.reviews.slice(1)).toEqual(concluded.reviews.slice(1));
  });

  it("moves a future review one day after its own date", () => {
    const future = changeStatus(EMPTY_PROGRESS, "concluido", "2026-10-20");
    expect(postponeNextReview(future, today).reviews[0].due).toBe("2026-10-22");
  });

  it("reschedules to a chosen date and keeps the whole history", () => {
    const once = rescheduleNextReview(concluded, "2026-10-20", today);
    const twice = rescheduleNextReview(once, "2026-10-25", "2026-10-18");
    expect(twice.reviews[0].due).toBe("2026-10-25");
    expect(twice.reviews[0].reschedules).toEqual([
      { from: "2026-10-11", to: "2026-10-20", at: today },
      { from: "2026-10-20", to: "2026-10-25", at: "2026-10-18" },
    ]);
  });

  it("refuses dates in the past", () => {
    expect(rescheduleNextReview(concluded, "2026-10-01", today)).toBe(concluded);
  });

  it("crosses year boundaries", () => {
    const december = changeStatus(EMPTY_PROGRESS, "concluido", "2026-12-20");
    expect(december.reviews.map((review) => review.due)).toEqual(["2026-12-21", "2026-12-27", "2027-01-04", "2027-01-19"]);
  });
});
