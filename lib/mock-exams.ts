import type { AreaId } from "./syllabus";
import type { ExamDay } from "./exam";

export interface MockSection {
  areaId: AreaId;
  correct: number;
  total: number;
}

// Simulado feito fora do app (MEC Enem, cursinho, prova antiga): a pessoa registra acertos e tempo, sem nota oficial.
export interface MockExam {
  id: string;
  date: string;
  day: ExamDay;
  minutes: number | null;
  sections: MockSection[];
  note: string;
}

export interface MockExamInput {
  date: string;
  day: ExamDay;
  minutes: number | null;
  sections: MockSection[];
  note: string;
}

export const MOCK_DAY_AREAS: Record<ExamDay, AreaId[]> = { 1: ["lin", "hum"], 2: ["nat", "mat"] };
export const QUESTIONS_PER_AREA = 45;
// Tempo oficial de cada dia, em minutos: 5h30 no primeiro (com a redação) e 5h no segundo.
export const MOCK_DAY_MINUTES: Record<ExamDay, number> = { 1: 330, 2: 300 };
export const MOCK_NOTE_MAX = 300;

export function validateMockExam(input: MockExamInput, today: string): string | null {
  if (input.date > today) return "Registre só simulados que você já fez.";
  if (input.sections.length === 0) return "Informe os acertos de pelo menos uma área.";
  for (const section of input.sections) {
    if (!Number.isInteger(section.total) || section.total < 1 || section.total > QUESTIONS_PER_AREA) {
      return `Cada área tem de 1 a ${QUESTIONS_PER_AREA} questões.`;
    }
    if (!Number.isInteger(section.correct) || section.correct < 0 || section.correct > section.total) {
      return "Os acertos não podem passar do número de questões.";
    }
  }
  if (input.minutes !== null && (!Number.isInteger(input.minutes) || input.minutes < 1 || input.minutes > 600)) {
    return "Informe o tempo em minutos, ou deixe em branco.";
  }
  if (input.note.length > MOCK_NOTE_MAX) return `Use no máximo ${MOCK_NOTE_MAX} caracteres na observação.`;
  return null;
}

export function sectionRate({ correct, total }: MockSection): number {
  return total > 0 ? correct / total : 0;
}

export function totalQuestions(mock: MockExam): number {
  return mock.sections.reduce((sum, section) => sum + section.total, 0);
}

// Minutos por questão. No primeiro dia desconta 1h para a redação, que divide o mesmo tempo de prova.
export function minutesPerQuestion(mock: MockExam): number | null {
  const questions = totalQuestions(mock);
  if (mock.minutes === null || questions === 0) return null;
  const essayMinutes = mock.day === 1 ? 60 : 0;
  return Math.max(0, mock.minutes - essayMinutes) / questions;
}

// Ritmo de referência: o tempo oficial dividido pelas 90 questões (com a mesma 1h de redação no primeiro dia).
export function targetMinutesPerQuestion(day: ExamDay): number {
  return (MOCK_DAY_MINUTES[day] - (day === 1 ? 60 : 0)) / (QUESTIONS_PER_AREA * 2);
}

// Comparação da área com o simulado anterior que também a teve. Null quando ainda não há com o que comparar.
export function areaTrend(mocks: readonly MockExam[], areaId: AreaId): { last: number; previous: number | null } | null {
  const rates = [...mocks]
    .sort((first, second) => first.date.localeCompare(second.date))
    .flatMap((mock) => mock.sections.filter((section) => section.areaId === areaId).map(sectionRate));
  if (rates.length === 0) return null;
  return { last: rates[rates.length - 1], previous: rates.length > 1 ? rates[rates.length - 2] : null };
}
