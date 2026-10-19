import type { StudySession } from "./sessions";

// Teto de horas por dia que contam para rank e conquistas: estudar 14 h num dia não deve valer mais que 10 h,
// para não premiar a exaustão (docs/roadmap-proxima-fase.md, Etapa 3).
export const DAILY_COUNTED_SECONDS = 10 * 3600;

export interface Rank {
  id: string;
  name: string;
  minHours: number;
}

export const RANKS: readonly Rank[] = [
  { id: "inicio", name: "Começando", minHours: 0 },
  { id: "ritmo", name: "Pegando o ritmo", minHours: 10 },
  { id: "constante", name: "Constante", minHours: 50 },
  { id: "dedicado", name: "Dedicado", minHours: 100 },
  { id: "focado", name: "Focado", minHours: 250 },
  { id: "maratonista", name: "Maratonista", minHours: 500 },
];

export interface Achievement {
  id: string;
  title: string;
  hours: number;
}

export const HOUR_ACHIEVEMENTS: readonly Achievement[] = [
  { id: "horas-1", title: "Estude 1 hora", hours: 1 },
  { id: "horas-10", title: "Estude 10 horas", hours: 10 },
  { id: "horas-50", title: "Estude 50 horas", hours: 50 },
  { id: "horas-100", title: "Estude 100 horas", hours: 100 },
  { id: "horas-250", title: "Estude 250 horas", hours: 250 },
  { id: "horas-500", title: "Estude 500 horas", hours: 500 },
];

export function countedSeconds(sessions: readonly StudySession[]): number {
  const byDay = new Map<string, number>();
  for (const session of sessions) byDay.set(session.date, (byDay.get(session.date) ?? 0) + session.sec);
  let total = 0;
  for (const seconds of byDay.values()) total += Math.min(seconds, DAILY_COUNTED_SECONDS);
  return total;
}

export function rankProgress(totalSeconds: number) {
  const hours = totalSeconds / 3600;
  const index = RANKS.filter((rank) => hours >= rank.minHours).length - 1;
  const current = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  const fraction = next ? (hours - current.minHours) / (next.minHours - current.minHours) : 1;
  return { current, next, hours, fraction, hoursToNext: next ? next.minHours - hours : 0 };
}

export interface AchievementStatus extends Achievement {
  unlocked: boolean;
  fraction: number;
}

export function achievementStatus(totalSeconds: number): AchievementStatus[] {
  const hours = totalSeconds / 3600;
  return HOUR_ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    unlocked: hours >= achievement.hours,
    fraction: Math.min(hours / achievement.hours, 1),
  }));
}

export function newlyUnlocked(beforeSeconds: number, afterSeconds: number): Achievement[] {
  return HOUR_ACHIEVEMENTS.filter(
    (achievement) => beforeSeconds / 3600 < achievement.hours && afterSeconds / 3600 >= achievement.hours,
  );
}

// Conquistas que a sessão recém-registrada (já incluída em `sessions`) desbloqueou.
export function unlockedBySession(sessions: readonly StudySession[], session: StudySession): Achievement[] {
  const before = countedSeconds(sessions.filter((candidate) => candidate.id !== session.id));
  return newlyUnlocked(before, countedSeconds(sessions));
}

export function unlockMessage(achievements: readonly Achievement[]): string {
  if (achievements.length === 0) return "";
  const hours = achievements[achievements.length - 1].hours;
  return ` Nova conquista: ${hours} ${hours === 1 ? "hora" : "horas"} de estudo.`;
}
