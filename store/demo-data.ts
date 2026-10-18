import { addDays, fromDateKey, mondayOf } from "@/lib/dates";
import { parseStudyChoice, type StudySession } from "@/lib/sessions";

// Os dados de exemplo só têm tempo de estudo por área e matéria: nenhum tópico vem pronto.
const currentWeek: [choice: string, minutes: number][][] = [
  [["area:mat", 95], ["area:lin", 50]],
  [["materia:bio", 80], ["area:red", 45], ["area:mat", 60]],
  [["materia:his", 110], ["area:mat", 50]],
  [["materia:qui", 75], ["area:lin", 40]],
  [["area:mat", 120], ["area:red", 50]],
  [["materia:geo", 90]],
  [["materia:fis", 60]],
];

const previousWeekMinutes = [200, 150, 180, 90, 240, 60];

export function createDemoData(today: string): { sessions: StudySession[] } {
  const sessions: StudySession[] = [];
  const addSession = (choice: string, date: string, minutes: number, hour: number) => {
    const start = fromDateKey(date).getTime() + hour * 3_600_000;
    sessions.push({
      id: `demo-${sessions.length}`,
      ...parseStudyChoice(choice, []),
      date,
      start,
      end: start + minutes * 60_000,
      sec: minutes * 60,
      mode: "pomodoro",
      state: "concluida",
    });
  };

  const monday = mondayOf(today);
  currentWeek.forEach((daySessions, dayIndex) => {
    const date = addDays(monday, dayIndex);
    if (date >= today) return;
    daySessions.forEach(([choice, minutes], order) => addSession(choice, date, minutes, 9 + 3 * order));
  });
  previousWeekMinutes.forEach((minutes, dayIndex) => addSession("area:mat", addDays(monday, dayIndex - 7), minutes, 10));
  addSession("area:mat", today, 50, 8);

  return { sessions };
}
