import { addDays } from "./dates";
import type { StudySession } from "./sessions";
import { AREAS, type AreaId } from "./syllabus";

export type GoalType = "horas" | "sessoes" | "topicos";

export interface WeeklyGoal {
  type: GoalType;
  value: number;
}

export const DEFAULT_GOAL: WeeklyGoal = { type: "horas", value: 25 };

export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function secondsOn(sessions: StudySession[], date: string): number {
  return sessions.filter((session) => session.date === date).reduce((total, session) => total + session.sec, 0);
}

export function secondsByDay(sessions: StudySession[], days: string[]): number[] {
  return days.map((date) => secondsOn(sessions, date));
}

// Usa a área gravada na sessão: renomear ou mudar um tópico de área não reescreve o histórico.
// Sessões de "Estudo geral" não têm área e ficam fora desta soma.
export function secondsByArea(sessions: StudySession[], from: string, to: string): Record<AreaId, number> {
  const totals = Object.fromEntries(AREAS.map((area) => [area.id, 0])) as Record<AreaId, number>;
  for (const session of sessions) {
    if (session.areaId && session.date >= from && session.date <= to) totals[session.areaId] += session.sec;
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
