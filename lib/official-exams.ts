import type { ExamDay } from "./exam";
import { MOCK_DAY_AREAS, QUESTIONS_PER_AREA, type MockSection } from "./mock-exams";
import type { AreaId } from "./syllabus";

export type Letter = "A" | "B" | "C" | "D" | "E";
export type ForeignLanguage = "ingles" | "espanhol";

export const LETTERS: Letter[] = ["A", "B", "C", "D", "E"];
export const QUESTIONS_PER_DAY = QUESTIONS_PER_AREA * 2;
// As 5 primeiras questões do 1º dia são de língua estrangeira: a pessoa escolhe inglês ou espanhol.
export const FOREIGN_QUESTIONS = 5;

// Prova oficial aplicada (caderno azul), com o gabarito oficial publicado pelo Inep. "*" marca questão anulada.
export interface OfficialExam {
  id: string;
  year: number;
  day: ExamDay;
  booklet: string;
  key: string;
  spanishKey: string;
  examUrl: string;
  keyUrl: string;
}

const INEP = "https://download.inep.gov.br/enem/provas_e_gabaritos";

function official(year: number, day: ExamDay, booklet: number, key: string, spanishKey = ""): OfficialExam {
  const file = `impresso_D${day}_CD${booklet}.pdf`;
  return {
    id: `${year}-${day}`,
    year,
    day,
    booklet: `Caderno ${booklet} · Azul`,
    key,
    spanishKey,
    examUrl: `${INEP}/${year}_PV_${file}`,
    keyUrl: `${INEP}/${year}_GB_${file}`,
  };
}

// Transcrito dos gabaritos oficiais do Inep (links em keyUrl). Confira a cada edição nova antes de incluir.
export const OFFICIAL_EXAMS: OfficialExam[] = [
  official(2024, 1, 1, "CAAAEECBECEDDCBDEDDCECBDCBCEADBBDBDDCBEDADEEBCECEBEBCDBADDEBBABCDCAECEDADBAEABEADCEDADACBC", "CDDDA"),
  official(2024, 2, 7, "BCEAACDEDCAAEDDDEBBDDBECCAEDBBAAACCAEE*CBBCEDABBABBADDDBBCECEADCEBCCCDBADCBEDAECADACDBCECE"),
  official(2023, 1, 1, "BBDABDACEEDCCDBADBDEDCCEBCACEACAACAACACBBEAAECDAEECABAACEAADECBDAABCDCABADCDEABAABCDDEBADB", "AAEBA"),
  official(2023, 2, 7, "DBEABDABDCACDBECDDDBCAAABBACCCADEBECCCEDAEEEDBCCDEEABCBEDCEABBEBDABDDADDA*ECAADDCCBEBEABCC"),
];

export function findOfficialExam(examId: string): OfficialExam | null {
  return OFFICIAL_EXAMS.find((exam) => exam.id === examId) ?? null;
}

export function officialExamTitle(exam: OfficialExam): string {
  return `Enem ${exam.year} · ${exam.day}º dia`;
}

// Número da questão na prova: o 2º dia começa na 91.
export function questionNumber(day: ExamDay, index: number): number {
  return (day === 1 ? 1 : QUESTIONS_PER_DAY + 1) + index;
}

export function areaOfQuestion(day: ExamDay, index: number): AreaId {
  return MOCK_DAY_AREAS[day][index < QUESTIONS_PER_AREA ? 0 : 1];
}

export function correctAnswer(exam: OfficialExam, index: number, language: ForeignLanguage): string {
  return language === "espanhol" && index < exam.spanishKey.length ? exam.spanishKey[index] : exam.key[index];
}

// Simulado em andamento no aparelho. O tempo segue a regra do timer: banked + (agora − startedAt).
export interface ExamDraft {
  examId: string;
  language: ForeignLanguage;
  answers: (Letter | null)[];
  banked: number;
  startedAt: number | null;
}

export function startDraft(examId: string, language: ForeignLanguage, now: number): ExamDraft {
  return { examId, language, answers: Array(QUESTIONS_PER_DAY).fill(null), banked: 0, startedAt: now };
}

export function draftSeconds(draft: ExamDraft, now: number): number {
  return draft.banked + (draft.startedAt === null ? 0 : Math.max(0, now - draft.startedAt) / 1000);
}

export function pauseDraft(draft: ExamDraft, now: number): ExamDraft {
  return draft.startedAt === null ? draft : { ...draft, banked: draftSeconds(draft, now), startedAt: null };
}

export function resumeDraft(draft: ExamDraft, now: number): ExamDraft {
  return draft.startedAt === null ? { ...draft, startedAt: now } : draft;
}

export function answerDraft(draft: ExamDraft, index: number, letter: Letter | null): ExamDraft {
  if (index < 0 || index >= QUESTIONS_PER_DAY) return draft;
  return { ...draft, answers: draft.answers.map((answer, item) => (item === index ? letter : answer)) };
}

export interface WrongAnswer {
  number: number;
  areaId: AreaId;
  marked: Letter | null;
  correct: string;
}

export interface GradedExam {
  sections: MockSection[];
  wrong: WrongAnswer[];
  annulled: number[];
}

// Questão anulada não conta para ninguém: sai do total da área. Em branco conta como erro.
export function gradeExam(exam: OfficialExam, answers: readonly (Letter | null)[], language: ForeignLanguage): GradedExam {
  const sections: MockSection[] = MOCK_DAY_AREAS[exam.day].map((areaId) => ({ areaId, correct: 0, total: 0 }));
  const wrong: WrongAnswer[] = [];
  const annulled: number[] = [];
  for (let index = 0; index < QUESTIONS_PER_DAY; index++) {
    const number = questionNumber(exam.day, index);
    const correct = correctAnswer(exam, index, language);
    if (correct === "*") {
      annulled.push(number);
      continue;
    }
    const section = sections[index < QUESTIONS_PER_AREA ? 0 : 1];
    section.total += 1;
    const marked = answers[index] ?? null;
    if (marked === correct) section.correct += 1;
    else wrong.push({ number, areaId: section.areaId, marked, correct });
  }
  return { sections, wrong, annulled };
}
