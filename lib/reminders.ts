import { toDateKey } from "./dates";

// Avisos antes do horário de estudo, em minutos: 1 hora antes, 30 minutos antes e na hora.
export const REMINDER_OFFSETS = [60, 30, 0] as const;
export type ReminderOffset = (typeof REMINDER_OFFSETS)[number];

export interface ReminderSettings {
  // Horário escolhido, "HH:MM" no fuso do aparelho; null = sem lembrete.
  time: string | null;
}

export const DEFAULT_REMINDER: ReminderSettings = { time: null };

export function isTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function normalizeReminder(saved: unknown): ReminderSettings {
  const time = saved && typeof saved === "object" ? (saved as Record<string, unknown>).time : null;
  return { time: isTime(time) ? time : null };
}

// studyDays vai de segunda (0) a domingo (6), como no cronograma; Date.getDay() começa no domingo.
function isStudyDay(date: Date, studyDays: readonly boolean[]): boolean {
  return studyDays[(date.getDay() + 6) % 7] ?? false;
}

export interface ReminderMoment {
  at: Date;
  offset: ReminderOffset;
  // Mesma chave no aviso local e no push: o sistema troca um pelo outro em vez de mostrar dois.
  tag: string;
}

function momentsOn(day: Date, time: string): ReminderMoment[] {
  const [hours, minutes] = time.split(":").map(Number);
  return REMINDER_OFFSETS.map((offset) => {
    const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes - offset);
    return { at, offset, tag: `flow-lembrete-${toDateKey(day)}-${offset}` };
  });
}

// O próximo aviso depois de agora, olhando até uma semana à frente. Só em dias de estudo.
export function nextReminder(now: Date, settings: ReminderSettings, studyDays: readonly boolean[]): ReminderMoment | null {
  if (!settings.time) return null;
  for (let ahead = 0; ahead <= 7; ahead++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ahead);
    if (!isStudyDay(day, studyDays)) continue;
    const next = momentsOn(day, settings.time).find((moment) => moment.at.getTime() > now.getTime());
    if (next) return next;
  }
  return null;
}

export function reminderText(offset: ReminderOffset, time: string): { title: string; body: string } {
  if (offset === 60) return { title: "Daqui a 1 hora", body: `Seu horário de estudo começa às ${time}. Separe o material.` };
  if (offset === 30) return { title: "Faltam 30 minutos", body: `Seu horário de estudo começa às ${time}.` };
  return { title: "Hora de estudar", body: "Abra o Flow e comece pela matéria do dia. Sem pressa." };
}
