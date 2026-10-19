import type { ExamDay } from "./exam";
import { MOCK_DAY_AREAS, QUESTIONS_PER_AREA, type MockSection } from "./mock-exams";
import type { AreaId } from "./syllabus";

export type Letter = "A" | "B" | "C" | "D" | "E";
export type ForeignLanguage = "ingles" | "espanhol";
// "app": as questões aparecem no Flow. "pdf": a pessoa resolve no PDF oficial e marca no cartão-resposta.
export type ExamFormat = "app" | "pdf";
// O dia inteiro (90 questões) ou só uma das duas áreas do dia (45).
export type ExamScope = "dia" | AreaId;

export const LETTERS: Letter[] = ["A", "B", "C", "D", "E"];
export const QUESTIONS_PER_DAY = QUESTIONS_PER_AREA * 2;
// As 5 primeiras questões do 1º dia são de língua estrangeira: a pessoa escolhe inglês ou espanhol.
export const FOREIGN_QUESTIONS = 5;
// Tempo de referência para uma área só: metade dos 5h do 2º dia.
export const AREA_MINUTES = 150;

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
  // Arquivo com o texto das questões para fazer o simulado dentro do app; null quando só há o PDF.
  questionsUrl: string | null;
}

const INEP = "https://download.inep.gov.br/enem/provas_e_gabaritos";

function official(year: number, day: ExamDay, booklet: number, key: string, spanishKey = "", inApp = false): OfficialExam {
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
    questionsUrl: inApp ? `/provas/${year}/${day}.json` : null,
  };
}

// Transcrito dos gabaritos oficiais do Inep (links em keyUrl). Confira a cada edição nova antes de incluir.
export const OFFICIAL_EXAMS: OfficialExam[] = [
  official(2021, 1, 1, "CAABBBDCDEADCEDBEDDDABBBBDEBCEADABDBACACDCDDCBADCBADBCEDDEBBADBCABEECCAEABEBAAECBBABAAEEBB", "CAEAA", true),
  official(2021, 2, 7, "EDECABEDABCBEBACCDCBBEEBBCBDAAECDCBDCDBBBADCDEE*EBABDDCECCBCCECDCAEBADEABBDBDEDCEDCCADDCAB", "", true),
  official(2022, 1, 1, "DCBDEEAAACABBDBEBACCBEEECCBBDCAAADCCABEDBDECEDEABEEDAEBAAECBECBABCDDAAADBCEDAEACDBBCDCBECA", "EDCAA", true),
  official(2022, 2, 7, "ADBADABEABCEEEACCBDDADDCBBCCAEBAEBEBEACCCDDDEECDABEBDCEECDBDCCCCBC*CBAACDBAAACEBABDDEDAEBE", "", true),
  official(2023, 1, 1, "BBDABDACEEDCCDBADBDEDCCEBCACEACAACAACACBBEAAECDAEECABAACEAADECBDAABCDCABADCDEABAABCDDEBADB", "AAEBA", true),
  official(2023, 2, 7, "DBEABDABDCACDBECDDDBCAAABBACCCADEBECCCEDAEEEDBCCDEEABCBEDCEABBEBDABDDADDA*ECAADDCCBEBEABCC", "", true),
  official(2024, 1, 1, "CAAAEECBECEDDCBDEDDCECBDCBCEADBBDBDDCBEDADEEBCECEBEBCDBADDEBBABCDCAECEDADBAEABEADCEDADACBC", "CDDDA"),
  official(2024, 2, 7, "BCEAACDEDCAAEDDDEBBDDBECCAEDBBAAACCAEE*CBBCEDABBABBADDDBBCECEADCEBCCCDBADCBEDAECADACDBCECE"),
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

// Posições (0 a 89) que entram no simulado: o dia inteiro ou só as 45 da área escolhida.
export function scopeIndices(day: ExamDay, scope: ExamScope): number[] {
  const all = Array.from({ length: QUESTIONS_PER_DAY }, (_, index) => index);
  return scope === "dia" ? all : all.filter((index) => areaOfQuestion(day, index) === scope);
}

export function officialMinutes(day: ExamDay, scope: ExamScope): number {
  return scope === "dia" ? (day === 1 ? 330 : 300) : AREA_MINUTES;
}

// Simulado em andamento no aparelho. O tempo segue a regra do timer: banked + (agora − startedAt).
export interface ExamDraft {
  examId: string;
  language: ForeignLanguage;
  format: ExamFormat;
  scope: ExamScope;
  answers: (Letter | null)[];
  // Questão aberta (posição de 0 a 89) e as marcadas para rever depois.
  current: number;
  flagged: number[];
  banked: number;
  startedAt: number | null;
}

export interface DraftOptions {
  language: ForeignLanguage;
  format: ExamFormat;
  scope: ExamScope;
}

export function startDraft(exam: OfficialExam, options: DraftOptions, now: number): ExamDraft {
  return {
    examId: exam.id,
    ...options,
    answers: Array(QUESTIONS_PER_DAY).fill(null),
    current: scopeIndices(exam.day, options.scope)[0],
    flagged: [],
    banked: 0,
    startedAt: now,
  };
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

export function moveDraft(draft: ExamDraft, index: number): ExamDraft {
  return index >= 0 && index < QUESTIONS_PER_DAY ? { ...draft, current: index } : draft;
}

export function toggleFlag(draft: ExamDraft, index: number): ExamDraft {
  const flagged = draft.flagged.includes(index)
    ? draft.flagged.filter((item) => item !== index)
    : [...draft.flagged, index].sort((first, second) => first - second);
  return { ...draft, flagged };
}

export function answeredCount(draft: ExamDraft, indices: readonly number[]): number {
  return indices.filter((index) => draft.answers[index] !== null).length;
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
export function gradeExam(
  exam: OfficialExam,
  answers: readonly (Letter | null)[],
  language: ForeignLanguage,
  scope: ExamScope = "dia",
): GradedExam {
  const areas = MOCK_DAY_AREAS[exam.day].filter((areaId) => scope === "dia" || areaId === scope);
  const sections: MockSection[] = areas.map((areaId) => ({ areaId, correct: 0, total: 0 }));
  const wrong: WrongAnswer[] = [];
  const annulled: number[] = [];
  for (const index of scopeIndices(exam.day, scope)) {
    const number = questionNumber(exam.day, index);
    const correct = correctAnswer(exam, index, language);
    if (correct === "*") {
      annulled.push(number);
      continue;
    }
    const section = sections.find((item) => item.areaId === areaOfQuestion(exam.day, index));
    if (!section) continue;
    section.total += 1;
    const marked = answers[index] ?? null;
    if (marked === correct) section.correct += 1;
    else wrong.push({ number, areaId: section.areaId, marked, correct });
  }
  return { sections, wrong, annulled };
}

export interface ExamAlternative {
  letter: Letter;
  text: string | null;
  image: string | null;
}

// Uma questão da prova como aparece no app. O texto usa só **negrito**, *itálico* e ![](imagem); o gabarito fica em OFFICIAL_EXAMS.
export interface ExamQuestion {
  number: number;
  areaId: AreaId;
  language: ForeignLanguage | null;
  text: string;
  stem: string;
  alternatives: ExamAlternative[];
}

// As 90 questões na ordem do caderno. Nas 5 de língua estrangeira, fica a versão do idioma escolhido.
export function questionsFor(questions: readonly ExamQuestion[], language: ForeignLanguage): ExamQuestion[] {
  const byNumber = new Map<number, ExamQuestion>();
  for (const question of questions) {
    if (question.language !== null && question.language !== language) continue;
    byNumber.set(question.number, question);
  }
  return [...byNumber.values()].sort((first, second) => first.number - second.number);
}

export type RichPart =
  | { kind: "text"; text: string; bold: boolean; italic: boolean }
  | { kind: "image"; src: string }
  | { kind: "break" };

// Parágrafo que é só uma imagem vira figura; imagem no meio do texto (fórmulas) fica na linha.
export type RichBlock = { kind: "figure"; src: string } | { kind: "paragraph"; parts: RichPart[] };

const INLINE = /!\[[^\]]*\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_|\n/g;
const FIGURE = /^!\[[^\]]*\]\(([^)\s]+)\)$/;

// O texto da base vem com escapes de markdown ("\[") e às vezes negrito dentro do itálico.
function textPart(raw: string, bold: boolean, italic: boolean): RichPart {
  const nestedBold = /^\*\*.*\*\*$/.test(raw);
  const text = raw.replace(/^\*\*|\*\*$/g, "").replace(/\\([\\[\]()*_#.!-])/g, "$1");
  return { kind: "text", text, bold: bold || nestedBold, italic };
}

function parseInline(text: string): RichPart[] {
  const parts: RichPart[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(textPart(text.slice(last, index), false, false));
    const [whole, image, bold, italic, underscored] = match;
    if (image) parts.push({ kind: "image", src: image });
    else if (bold) parts.push(textPart(bold, true, false));
    else if (italic ?? underscored) parts.push(textPart(italic ?? underscored, false, true));
    else if (whole === "\n") parts.push({ kind: "break" });
    last = index + whole.length;
  }
  if (last < text.length) parts.push(textPart(text.slice(last), false, false));
  return parts;
}

export function parseRichText(text: string): RichBlock[] {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const figure = block.match(FIGURE);
      return figure ? { kind: "figure" as const, src: figure[1] } : { kind: "paragraph" as const, parts: parseInline(block) };
    });
}

// Endereços das imagens de uma questão, para guardar a prova inteira no aparelho antes de começar.
export function questionImages(question: ExamQuestion): string[] {
  const inText = [...`${question.text}\n${question.stem}`.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((match) => match[1]);
  return [...inText, ...question.alternatives.flatMap((alternative) => (alternative.image ? [alternative.image] : []))];
}

const MISTAKE_QUESTION_LIMIT = 300;

// Texto do erro que vai para o caderno: o comando da questão (quando o app tem o texto) e a resposta certa para conferir.
export function examMistakeText(item: WrongAnswer, stem: string | null): { question: string; lesson: string } {
  const marked = item.marked ? `Você marcou ${item.marked}` : "Ficou em branco";
  const prefix = `Questão ${item.number}: `;
  const plain = (stem ?? "").replace(/!\[[^\]]*\]\([^)]*\)/g, "[figura]").replace(/[*_\\]/g, "").replace(/\s+/g, " ").trim();
  const room = MISTAKE_QUESTION_LIMIT - prefix.length;
  const question = plain
    ? prefix + (plain.length > room ? `${plain.slice(0, room - 1).trimEnd()}…` : plain)
    : `${prefix}${item.marked ? `você marcou ${item.marked}` : "ficou em branco"}, a resposta é ${item.correct}. Refaça e descubra onde errou.`;
  return { question, lesson: plain ? `${marked}; a resposta certa é ${item.correct}.` : "" };
}
