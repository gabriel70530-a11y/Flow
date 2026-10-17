const pad = (value: number) => String(value).padStart(2, "0");

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function mondayOf(key: string): string {
  // getDay() começa no domingo (0); a semana do app começa na segunda.
  const daysSinceMonday = (fromDateKey(key).getDay() + 6) % 7;
  return addDays(key, -daysSinceMonday);
}

export function shortDate(key: string): string {
  return `${key.slice(8)}/${key.slice(5, 7)}`;
}

export function dueLabel(due: string, today: string): string {
  if (due < today) return `Atrasada desde ${shortDate(due)}`;
  if (due === today) return "Hoje";
  if (due === addDays(today, 1)) return "Amanhã";
  return shortDate(due);
}
