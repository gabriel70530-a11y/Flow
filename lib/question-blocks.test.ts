import { describe, expect, it } from "vitest";
import { findOfficialExam, type ExamQuestion } from "./official-exams";
import {
  BLOCK_SIZE,
  answerBlock,
  blockScore,
  blockWrongAnswers,
  createBlock,
  dayOfArea,
  matchingQuestions,
  moveBlock,
  pickBlock,
  poolFromExam,
  practiceStats,
  seenQuestions,
  themeWords,
} from "./question-blocks";

function question(number: number, text: string, areaId: ExamQuestion["areaId"] = "mat"): ExamQuestion {
  return {
    number,
    areaId,
    language: null,
    text,
    stem: "Qual é a resposta?",
    alternatives: (["A", "B", "C", "D", "E"] as const).map((letter) => ({ letter, text: `opção ${letter}`, image: null })),
  };
}

const exam = findOfficialExam("2023-2")!;
const questions = [
  question(136, "Uma loja deu 20% de desconto. Qual a porcentagem final?"),
  question(137, "A função f(x) = 2x + 1 representa o custo."),
  question(138, "As funções do segundo grau têm gráfico em parábola."),
  question(139, "Um triângulo retângulo tem catetos 3 e 4."),
  question(140, "Calcule a probabilidade de tirar cara."),
  question(141, "A porcentagem de alunos aprovados subiu."),
  question(164, "Questão anulada pelo Inep, com porcentagem."),
  question(91, "A célula realiza fotossíntese.", "nat"),
];
const pool = poolFromExam(exam, questions, "ingles");

describe("poolFromExam", () => {
  it("leva a resposta do gabarito oficial e deixa a anulada de fora", () => {
    expect(pool.find((item) => item.question.number === 136)?.correct).toBe(exam.key[45]);
    expect(pool.find((item) => item.question.number === 91)?.correct).toBe(exam.key[0]);
    expect(pool.some((item) => item.question.number === 164)).toBe(false);
  });
});

describe("themes", () => {
  it("reduz o tema a começos de palavra, sem acento e sem palavras curtas", () => {
    expect(themeWords("Funções e Porcentagens")).toEqual(["funcao", "porcen"]);
    expect(themeWords("  ")).toEqual([]);
  });

  it("acha as questões da área pelo tema, as que casam mais primeiro", () => {
    expect(matchingQuestions(pool, "mat", "porcentagem").map((item) => item.question.number)).toEqual([136, 141]);
    expect(matchingQuestions(pool, "mat", "funções").map((item) => item.question.number)).toEqual([137, 138]);
    expect(matchingQuestions(pool, "mat", "")).toHaveLength(6);
    expect(matchingQuestions(pool, "nat", "porcentagem")).toEqual([]);
  });

  it("separa o dia de cada área", () => {
    expect(dayOfArea("lin")).toBe(1);
    expect(dayOfArea("hum")).toBe(1);
    expect(dayOfArea("nat")).toBe(2);
    expect(dayOfArea("mat")).toBe(2);
  });
});

describe("pickBlock", () => {
  const matches = matchingQuestions(pool, "mat", "");

  it("escolhe 5 questões e prefere as que a pessoa ainda não fez", () => {
    const seen = new Set(["2023-2:136", "2023-2:137"]);
    const picked = pickBlock(matches, seen, () => 0.5);
    expect(picked).toHaveLength(BLOCK_SIZE);
    expect(picked.slice(0, 4).map((item) => item.question.number).sort()).toEqual([138, 139, 140, 141]);
    expect([136, 137]).toContain(picked[4].question.number);
  });

  it("devolve menos de 5 quando o tema tem poucas questões", () => {
    expect(pickBlock(matchingQuestions(pool, "mat", "porcentagem"), new Set())).toHaveLength(2);
  });
});

describe("blocks", () => {
  const picked = pickBlock(matchingQuestions(pool, "mat", ""), new Set(), () => 0.5);
  const block = createBlock({ id: "b1", areaId: "mat", theme: "  Geral  ", language: "ingles", date: "2026-10-19", picked });

  it("começa na primeira questão, sem respostas", () => {
    expect(block.theme).toBe("Geral");
    expect(block.items.every((item) => item.marked === null)).toBe(true);
    expect(seenQuestions([block]).size).toBe(BLOCK_SIZE);
  });

  it("marca respostas, navega e corrige", () => {
    let answered = block;
    answered = answerBlock(answered, 0, answered.items[0].correct);
    answered = answerBlock(answered, 1, answered.items[1].correct === "A" ? "B" : "A");
    answered = moveBlock(answered, 4);
    expect(answered.current).toBe(4);
    expect(moveBlock(answered, 9).current).toBe(4);
    expect(blockScore(answered)).toEqual({ correct: 1, total: 5 });
    expect(blockWrongAnswers(answered)).toHaveLength(4);
    expect(blockWrongAnswers(answered)[0]).toMatchObject({ examId: "2023-2", areaId: "mat", number: answered.items[1].number });
  });

  it("não muda respostas depois de terminado e soma os acertos por área", () => {
    const finished = { ...answerBlock(block, 0, block.items[0].correct), finished: true };
    expect(answerBlock(finished, 1, "A")).toBe(finished);
    const stats = practiceStats([finished, block]);
    expect(stats.find((item) => item.areaId === "mat")).toEqual({ areaId: "mat", correct: 1, total: 5 });
    expect(stats.find((item) => item.areaId === "lin")).toEqual({ areaId: "lin", correct: 0, total: 0 });
  });
});
