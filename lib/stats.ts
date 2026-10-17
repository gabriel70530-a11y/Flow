import { addDays } from "./dates";
import { AREAS, findTopic, type AreaId } from "./syllabus";
import type { TimerMode } from "./timer";

export interface StudySession {
  id: string;
  topicId: string;
  date: string;
  sec: number;
  mode: TimerMode;
  ts: number;
}

export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function secondsOn(sessions: StudySession[], date: string): number {
  return sessions.filter((session) => session.date === date).reduce((total, session) => total + session.sec, 0);
}

export function secondsByDay(sessions: StudySession[], days: string[]): number[] {
  return days.map((date) => secondsOn(sessions, date));
}

export function secondsByArea(sessions: StudySession[], from: string, to: string): Record<AreaId, number> {
  const totals = Object.fromEntries(AREAS.map((area) => [area.id, 0])) as Record<AreaId, number>;
  for (const session of sessions) {
    const areaId = findTopic(session.topicId)?.area.id;
    if (areaId && session.date >= from && session.date <= to) totals[areaId] += session.sec;
  }
  return totals;
}

// Se hoje ainda não teve estudo, a sequência segue valendo a partir de ontem.
export function studyStreak(sessions: StudySession[], today: string): number {
  const studied = new Set(sessions.map((session) => session.date));
  let day = studied.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (studied.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

export function formatHours(seconds: number): string {
  return (seconds / 3600).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)}h${rest ? String(rest).padStart(2, "0") : ""}`;
}
