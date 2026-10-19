import type { ExamDay } from "./exam";
import { MOCK_DAY_AREAS } from "./mock-exams";
import {
  correctAnswer,
  questionNumber,
  type ExamQuestion,
  type ForeignLanguage,
  type Letter,
  type OfficialExam,
  type WrongAnswer,
} from "./official-exams";
import type { AreaId } from "./syllabus";

export const BLOCK_SIZE = 5;
export const BLOCK_THEME_MAX = 60;

export type PracticeArea = Exclude<AreaId, "red">;
export const PRACTICE_AREAS: readonly PracticeArea[] = ["lin", "hum", "nat", "mat"];

export function dayOfArea(areaId: PracticeArea): ExamDay {
  return MOCK_DAY_AREAS[1].includes(areaId) ? 1 : 2;
}

export interface PoolQuestion {
  examId: string;
  question: ExamQuestion;
  correct: Letter;
}

export interface BlockItem {
  examId: string;
  number: number;
  correct: Letter;
  marked: Letter | null;
}

export interface QuestionBlock {
  id: string;
  areaId: PracticeArea;
  theme: string;
  language: ForeignLanguage;
  date: string;
  items: BlockItem[];
  current: number;
  finished: boolean;
}

export function questionKey(examId: string, number: number): string {
  return `${examId}:${number}`;
}

// Questões de uma prova já filtradas pelo idioma, com a resposta do gabarito oficial. Anuladas ficam de fora.
export function poolFromExam(exam: OfficialExam, questions: readonly ExamQuestion[], language: ForeignLanguage): PoolQuestion[] {
  return questions.flatMap((question) => {
    const index = question.number - questionNumber(exam.day, 0);
    const correct = correctAnswer(exam, index, language);
    return correct === "*" ? [] : [{ examId: exam.id, question, correct: correct as Letter }];
  });
}

const STOPWORDS = new Set(["como", "para", "entre", "sobre", "pelo", "pela", "suas", "seus", "outros", "outras", "geral"]);

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
}

// Radical simples: plural vira singular e só as 6 primeiras letras contam, para "funções" achar "função" e
// "genética" achar "genético". O mesmo vale para o tema e para o texto da questão.
function stem(word: string): string {
  return word
    .replace(/coes$/, "cao")
    .replace(/[oa]es$/, "ao")
    .replace(/ns$/, "m")
    .replace(/([aeiou])s$/, "$1")
    .slice(0, 6);
}

function words(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word));
}

export function themeWords(theme: string): string[] {
  return [...new Set(words(theme).map(stem))];
}

function questionStems(question: ExamQuestion): Set<string> {
  const alternatives = question.alternatives.map((alternative) => alternative.text ?? "").join(" ");
  const text = `${question.text} ${question.stem} ${alternatives}`.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  return new Set(words(text).map(stem));
}

// Quantas palavras do tema aparecem na questão. Sem tema, toda questão da área vale.
export function themeScore(question: ExamQuestion, themeStems: readonly string[]): number {
  if (themeStems.length === 0) return 1;
  const stems = questionStems(question);
  return themeStems.filter((word) => stems.has(word)).length;
}

export function matchingQuestions(pool: readonly PoolQuestion[], areaId: PracticeArea, theme: string): PoolQuestion[] {
  const themeStems = themeWords(theme);
  return pool
    .filter((item) => item.question.areaId === areaId)
    .map((item) => ({ item, score: themeScore(item.question, themeStems) }))
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score)
    .map(({ item }) => item);
}

// Escolhe 5 questões do tema, primeiro as que a pessoa ainda não fez; só repete quando as novas acabam.
export function pickBlock(
  matches: readonly PoolQuestion[],
  seen: ReadonlySet<string>,
  random: () => number = Math.random,
): PoolQuestion[] {
  const shuffle = (items: PoolQuestion[]) =>
    items
      .map((item) => ({ item, order: random() }))
      .sort((first, second) => first.order - second.order)
      .map(({ item }) => item);
  const fresh = matches.filter((item) => !seen.has(questionKey(item.examId, item.question.number)));
  const repeated = matches.filter((item) => seen.has(questionKey(item.examId, item.question.number)));
  return [...shuffle(fresh), ...shuffle(repeated)].slice(0, BLOCK_SIZE);
}

export function seenQuestions(blocks: readonly QuestionBlock[]): Set<string> {
  return new Set(blocks.flatMap((block) => block.items.map((item) => questionKey(item.examId, item.number))));
}

export function createBlock(input: {
  id: string;
  areaId: PracticeArea;
  theme: string;
  language: ForeignLanguage;
  date: string;
  picked: readonly PoolQuestion[];
}): QuestionBlock {
  return {
    id: input.id,
    areaId: input.areaId,
    theme: input.theme.trim().slice(0, BLOCK_THEME_MAX),
    language: input.language,
    date: input.date,
    items: input.picked.map(({ examId, question, correct }) => ({ examId, number: question.number, correct, marked: null })),
    current: 0,
    finished: false,
  };
}

export function answerBlock(block: QuestionBlock, index: number, letter: Letter | null): QuestionBlock {
  if (block.finished || !block.items[index]) return block;
  return { ...block, items: block.items.map((item, position) => (position === index ? { ...item, marked: letter } : item)) };
}

export function moveBlock(block: QuestionBlock, index: number): QuestionBlock {
  return index >= 0 && index < block.items.length ? { ...block, current: index } : block;
}

export function blockScore(block: QuestionBlock): { correct: number; total: number } {
  return { correct: block.items.filter((item) => item.marked === item.correct).length, total: block.items.length };
}

export function blockWrongAnswers(block: QuestionBlock): (WrongAnswer & { examId: string })[] {
  return block.items
    .filter((item) => item.marked !== item.correct)
    .map((item) => ({ examId: item.examId, number: item.number, areaId: block.areaId, marked: item.marked, correct: item.correct }));
}

// Acertos somados dos blocos terminados de cada área.
export function practiceStats(blocks: readonly QuestionBlock[]): { areaId: PracticeArea; correct: number; total: number }[] {
  return PRACTICE_AREAS.map((areaId) => {
    const done = blocks.filter((block) => block.finished && block.areaId === areaId);
    return done.reduce(
      (sum, block) => {
        const score = blockScore(block);
        return { areaId, correct: sum.correct + score.correct, total: sum.total + score.total };
      },
      { areaId, correct: 0, total: 0 },
    );
  });
}
