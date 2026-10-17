import { addDays, fromDateKey, mondayOf } from "@/lib/dates";
import { scheduleReviews, type Mastery, type ProgressMap } from "@/lib/reviews";
import type { StudySession } from "@/lib/sessions";
import type { AreaId } from "@/lib/syllabus";

const currentWeek: [topicId: string, minutes: number][][] = [
  [["mat-3", 95], ["lin-3", 50]],
  [["nat-1", 80], ["red-5", 45], ["mat-4", 60]],
  [["hum-2", 110], ["mat-3", 50]],
  [["nat-3", 75], ["lin-3", 40]],
  [["mat-4", 120], ["red-0", 50]],
  [["hum-2", 90]],
  [["nat-1", 60]],
];

const previousWeekMinutes = [200, 150, 180, 90, 240, 60];

export function createDemoData(today: string): { progress: ProgressMap; sessions: StudySession[] } {
  const progress: ProgressMap = {};
  const sessions: StudySession[] = [];

  // Revisões vencidas antes de hoje entram como feitas, exceto as que passam de reviewsDone.
  const conclude = (topicId: string, daysAgo: number, mastery: Mastery, reviewsDone = Infinity) => {
    const completedAt = addDays(today, -daysAgo);
    const reviews = scheduleReviews(completedAt, 1).map((review) =>
      reviewsDone >= review.stage && review.due < today ? { ...review, done: review.due } : review,
    );
    progress[topicId] = { status: "concluido", mastery, completedAt, reviews };
  };
  const studying = (topicId: string, mastery: Mastery) => {
    progress[topicId] = { status: "and", mastery, reviews: [] };
  };
  const addSession = (topicId: string, date: string, minutes: number, hour: number) => {
    const start = fromDateKey(date).getTime() + hour * 3_600_000;
    sessions.push({
      id: `demo-${sessions.length}`,
      topicId,
      areaId: topicId.split("-")[0] as AreaId,
      date,
      start,
      end: start + minutes * 60_000,
      sec: minutes * 60,
      mode: "pomodoro",
      state: "concluida",
    });
  };

  conclude("mat-0", 15, 5);
  conclude("mat-1", 7, 4);
  conclude("mat-8", 1, 3);
  conclude("lin-0", 30, 4);
  conclude("lin-2", 1, 3);
  conclude("nat-0", 7, 3);
  conclude("red-0", 7, 4);
  conclude("hum-1", 10, 4, 1);
  studying("mat-3", 2);
  studying("mat-4", 2);
  studying("lin-3", 3);
  studying("nat-1", 2);
  studying("nat-3", 1);
  studying("hum-2", 3);
  studying("red-5", 2);

  const monday = mondayOf(today);
  currentWeek.forEach((daySessions, dayIndex) => {
    const date = addDays(monday, dayIndex);
    if (date >= today) return;
    daySessions.forEach(([topicId, minutes], order) => addSession(topicId, date, minutes, 9 + 3 * order));
  });
  previousWeekMinutes.forEach((minutes, dayIndex) =>
    addSession(`mat-${dayIndex}`, addDays(monday, dayIndex - 7), minutes, 10),
  );
  addSession("mat-3", today, 50, 8);

  return { progress, sessions };
}
