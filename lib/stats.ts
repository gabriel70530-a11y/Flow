import { addDays } from "./dates";
import type { PlanTask } from "./planner";
import { progressOf, type ProgressMap, type TopicStatus } from "./reviews";
import type { StudySession } from "./sessions";
import { AREAS, type AreaId } from "./syllabus";
import type { TopicRecord } from "./topics";

export type GoalType = "horas" | "sessoes" | "topicos";

export interface WeeklyGoal {
  type: GoalType;
  value: number;
}

export const DEFAULT_GOAL: WeeklyGoal = { type: "horas", value: 25 };

export const GOAL_LIMITS: Record<GoalType, { max: number; fallback: number }> = {
  horas: { max: 100, fallback: 25 },
  sessoes: { max: 100, fallback: 20 },
  topicos: { max: 50, fallback: 5 },
};

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

export const GOAL_UNITS: Record<GoalType, { label: string; singular: string }> = {
  horas: { label: "horas", singular: "hora" },
  sessoes: { label: "sessões", singular: "sessão" },
  topicos: { label: "tópicos concluídos", singular: "tópico concluído" },
};

function inRange(date: string | undefined | null, from: string, to: string): boolean {
  return Boolean(date && date >= from && date <= to);
}

export function secondsBetween(sessions: StudySession[], from: string, to: string): number {
  return sessions.filter((session) => inRange(session.date, from, to)).reduce((total, session) => total + session.sec, 0);
}

// Quanto da meta semanal foi feito, na unidade escolhida. Tópicos contam pela data de conclusão.
export function goalProgress(
  goal: WeeklyGoal,
  sessions: StudySession[],
  progress: ProgressMap,
  from: string,
  to: string,
): { done: number; target: number } {
  if (goal.type === "sessoes") {
    return { done: sessions.filter((session) => inRange(session.date, from, to)).length, target: goal.value };
  }
  if (goal.type === "topicos") {
    const done = Object.values(progress).filter(
      (topic) => topic.status === "concluido" && inRange(topic.completedAt, from, to),
    ).length;
    return { done, target: goal.value };
  }
  return { done: secondsBetween(sessions, from, to) / 3600, target: goal.value };
}

// O realizado do plano é o foco registrado nas próprias tarefas, separado do total estudado na semana.
// Tarefas adiadas não contam como planejadas.
export function plannedVersusDone(tasks: PlanTask[], sessions: StudySession[], from: string, to: string) {
  const planned = tasks.filter((task) => task.status !== "adiada" && inRange(task.date, from, to));
  return {
    plannedMinutes: planned.reduce((total, task) => total + task.minutes, 0),
    taskCount: planned.length,
    tasksDone: planned.filter((task) => task.status === "concluida").length,
    taskFocusSeconds: planned.reduce((total, task) => total + task.focusSec, 0),
    doneSeconds: secondsBetween(sessions, from, to),
  };
}

export function activeDays(sessions: StudySession[], from: string, to: string): number {
  return new Set(sessions.filter((session) => inRange(session.date, from, to)).map((session) => session.date)).size;
}

// Sugestão, não diagnóstico: a área com menos tempo no período, só quando há estudo registrado.
export function leastStudiedArea(sessions: StudySession[], from: string, to: string): AreaId | null {
  const totals = secondsByArea(sessions, from, to);
  if (Object.values(totals).every((seconds) => seconds === 0)) return null;
  return AREAS.reduce((least, area) => (totals[area.id] < totals[least] ? area.id : least), AREAS[0].id);
}

export function topicCounts(progress: ProgressMap, topics: readonly TopicRecord[]) {
  const visible = topics.filter((topic) => !topic.hidden);
  const count = (status: TopicStatus) => visible.filter((topic) => progressOf(progress, topic.id).status === status).length;
  return { total: visible.length, concluded: count("concluido"), inProgress: count("and"), needsReview: count("revisar") };
}
