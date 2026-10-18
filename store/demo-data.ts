import { addDays, fromDateKey, mondayOf } from "@/lib/dates";
import { scheduleReviews, type Mastery, type ProgressMap } from "@/lib/reviews";
import type { StudySession } from "@/lib/sessions";
import { legacyTopics } from "@/lib/legacy-topics";
import type { AreaId } from "@/lib/syllabus";
import type { TopicRecord } from "@/lib/topics";

const currentWeek: [topicId: string, minutes: number][][] = [
  [["mat-3", 95], ["lin-3", 50]],
  [["nat-1", 80], ["red-0", 45], ["mat-4", 60]],
  [["hum-2", 110], ["mat-3", 50]],
  [["nat-3", 75], ["lin-3", 40]],
  [["mat-4", 120], ["red-0", 50]],
  [["hum-2", 90]],
  [["nat-1", 60]],
];

const previousWeekMinutes = [200, 150, 180, 90, 240, 60];

// Os dados de exemplo trazem alguns tópicos criados "pelo estudante"; somem ao apagar e começar do zero.
const DEMO_TOPIC_IDS = [
  "mat-0", "mat-1", "mat-2", "mat-3", "mat-4", "mat-5", "mat-8",
  "lin-0", "lin-2", "lin-3",
  "nat-0", "nat-1", "nat-3",
  "hum-1", "hum-2",
  "red-0",
];

function demoTopics(): TopicRecord[] {
  return legacyTopics()
    .filter((topic) => DEMO_TOPIC_IDS.includes(topic.id))
    .map((topic) => (topic.id === "red-0" ? { ...topic, name: "Prática de redação" } : topic));
}

export function createDemoData(today: string): { topics: TopicRecord[]; progress: ProgressMap; sessions: StudySession[] } {
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
  conclude("hum-1", 10, 4, 1);
  studying("mat-3", 2);
  studying("mat-4", 2);
  studying("lin-3", 3);
  studying("nat-1", 2);
  studying("nat-3", 1);
  studying("hum-2", 3);
  studying("red-0", 2);

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

  return { topics: demoTopics(), progress, sessions };
}
