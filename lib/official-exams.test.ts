import { describe, expect, it } from "vitest";
import {
  OFFICIAL_EXAMS,
  QUESTIONS_PER_DAY,
  answerDraft,
  correctAnswer,
  draftSeconds,
  findOfficialExam,
  gradeExam,
  pauseDraft,
  questionNumber,
  resumeDraft,
  startDraft,
  type Letter,
} from "./official-exams";

describe("official answer keys", () => {
  it("has 90 answers per day and Spanish keys only on day 1", () => {
    for (const exam of OFFICIAL_EXAMS) {
      expect(exam.key).toMatch(/^[A-E*]{90}$/);
      expect(exam.spanishKey).toMatch(exam.day === 1 ? /^[A-E]{5}$/ : /^$/);
    }
  });

  it("links to the official INEP files", () => {
    const exam = findOfficialExam("2024-2");
    expect(exam?.examUrl).toBe("https://download.inep.gov.br/enem/provas_e_gabaritos/2024_PV_impresso_D2_CD7.pdf");
    expect(exam?.keyUrl).toBe("https://download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D2_CD7.pdf");
  });

  it("numbers day 2 from 91", () => {
    expect(questionNumber(1, 0)).toBe(1);
    expect(questionNumber(2, 0)).toBe(91);
    expect(questionNumber(2, 89)).toBe(180);
  });

  it("uses the Spanish key for the first 5 questions when chosen", () => {
    const exam = findOfficialExam("2024-1")!;
    expect(correctAnswer(exam, 1, "ingles")).toBe("A");
    expect(correctAnswer(exam, 1, "espanhol")).toBe("D");
    expect(correctAnswer(exam, 5, "espanhol")).toBe("E");
  });
});

describe("gradeExam", () => {
  const exam = findOfficialExam("2024-2")!;
  const perfect = [...exam.key].map((letter) => (letter === "*" ? null : (letter as Letter)));

  it("counts every right answer and drops the annulled question from the total", () => {
    const graded = gradeExam(exam, perfect, "ingles");
    expect(graded.sections).toEqual([
      { areaId: "nat", correct: 44, total: 44 },
      { areaId: "mat", correct: 45, total: 45 },
    ]);
    expect(graded.annulled).toEqual([129]);
    expect(graded.wrong).toEqual([]);
  });

  it("lists wrong and blank answers with the correct letter", () => {
    const answers = perfect.map((answer, index) => (index === 0 ? "A" : index === 50 ? null : answer));
    const graded = gradeExam(exam, answers, "ingles");
    expect(graded.wrong).toEqual([
      { number: 91, areaId: "nat", marked: "A", correct: "B" },
      { number: 141, areaId: "mat", marked: null, correct: "B" },
    ]);
    expect(graded.sections.map((section) => section.correct)).toEqual([43, 44]);
  });
});

describe("exam draft timer", () => {
  it("counts time from the clock and keeps it while paused", () => {
    const draft = startDraft("2024-1", "ingles", 1_000);
    expect(draft.answers).toHaveLength(QUESTIONS_PER_DAY);
    expect(draftSeconds(draft, 61_000)).toBe(60);
    const paused = pauseDraft(draft, 61_000);
    expect(draftSeconds(paused, 999_000)).toBe(60);
    expect(draftSeconds(resumeDraft(paused, 100_000), 130_000)).toBe(90);
  });

  it("marks and clears an answer", () => {
    const draft = answerDraft(startDraft("2024-1", "ingles", 0), 3, "C");
    expect(draft.answers[3]).toBe("C");
    expect(answerDraft(draft, 3, null).answers[3]).toBeNull();
    expect(answerDraft(draft, 90, "A")).toBe(draft);
  });
});
