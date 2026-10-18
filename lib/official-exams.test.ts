import { describe, expect, it } from "vitest";
import {
  OFFICIAL_EXAMS,
  QUESTIONS_PER_DAY,
  answerDraft,
  correctAnswer,
  draftSeconds,
  examMistakeText,
  findOfficialExam,
  gradeExam,
  moveDraft,
  parseRichText,
  pauseDraft,
  questionImages,
  questionNumber,
  questionsFor,
  resumeDraft,
  scopeIndices,
  startDraft,
  toggleFlag,
  type ExamQuestion,
  type Letter,
} from "./official-exams";

const appOptions = { language: "ingles" as const, format: "app" as const, scope: "dia" as const };

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
    const draft = startDraft(findOfficialExam("2024-1")!, appOptions, 1_000);
    expect(draft.answers).toHaveLength(QUESTIONS_PER_DAY);
    expect(draftSeconds(draft, 61_000)).toBe(60);
    const paused = pauseDraft(draft, 61_000);
    expect(draftSeconds(paused, 999_000)).toBe(60);
    expect(draftSeconds(resumeDraft(paused, 100_000), 130_000)).toBe(90);
  });

  it("marks and clears an answer", () => {
    const draft = answerDraft(startDraft(findOfficialExam("2024-1")!, appOptions, 0), 3, "C");
    expect(draft.answers[3]).toBe("C");
    expect(answerDraft(draft, 3, null).answers[3]).toBeNull();
    expect(answerDraft(draft, 90, "A")).toBe(draft);
  });
});

describe("one area only", () => {
  const exam = findOfficialExam("2023-2")!;

  it("keeps only the 45 questions of the chosen area", () => {
    expect(scopeIndices(2, "mat")).toHaveLength(45);
    expect(scopeIndices(2, "mat")[0]).toBe(45);
    expect(scopeIndices(2, "dia")).toHaveLength(90);
  });

  it("grades only that area and starts on its first question", () => {
    const graded = gradeExam(exam, Array(90).fill(null), "ingles", "nat");
    expect(graded.sections).toEqual([{ areaId: "nat", correct: 0, total: 45 }]);
    expect(graded.wrong).toHaveLength(45);
    expect(startDraft(exam, { ...appOptions, scope: "mat" }, 0).current).toBe(45);
  });
});

describe("navigation and flags", () => {
  const draft = startDraft(findOfficialExam("2023-1")!, appOptions, 0);

  it("moves only inside the day", () => {
    expect(moveDraft(draft, 10).current).toBe(10);
    expect(moveDraft(draft, 90)).toBe(draft);
  });

  it("flags and unflags a question in order", () => {
    const flagged = toggleFlag(toggleFlag(draft, 12), 3);
    expect(flagged.flagged).toEqual([3, 12]);
    expect(toggleFlag(flagged, 12).flagged).toEqual([3]);
  });
});

describe("question text", () => {
  it("turns a paragraph with only an image into a figure", () => {
    expect(parseRichText("Texto um.\n\n![](/provas/a.png)\n\nFonte")).toEqual([
      { kind: "paragraph", parts: [{ kind: "text", text: "Texto um.", bold: false, italic: false }] },
      { kind: "figure", src: "/provas/a.png" },
      { kind: "paragraph", parts: [{ kind: "text", text: "Fonte", bold: false, italic: false }] },
    ]);
  });

  it("keeps formulas inline and reads bold, italic and line breaks", () => {
    expect(parseRichText("**TEXTO I**\nsendo ![](/f.png) a _intensidade_ em *Gira*")).toEqual([
      {
        kind: "paragraph",
        parts: [
          { kind: "text", text: "TEXTO I", bold: true, italic: false },
          { kind: "break" },
          { kind: "text", text: "sendo ", bold: false, italic: false },
          { kind: "image", src: "/f.png" },
          { kind: "text", text: " a ", bold: false, italic: false },
          { kind: "text", text: "intensidade", bold: false, italic: true },
          { kind: "text", text: " em ", bold: false, italic: false },
          { kind: "text", text: "Gira", bold: false, italic: true },
        ],
      },
    ]);
  });

  it("removes markdown escapes and reads bold inside italics", () => {
    expect(parseRichText("_**\\]cultura\\[**_")).toEqual([
      { kind: "paragraph", parts: [{ kind: "text", text: "]cultura[", bold: true, italic: true }] },
    ]);
  });

  const question = (number: number, language: ExamQuestion["language"]): ExamQuestion => ({
    number,
    areaId: "lin",
    language,
    text: `![](/q${number}.png)`,
    stem: "",
    alternatives: [{ letter: "A", text: null, image: "/alt.png" }],
  });

  it("picks the chosen foreign language version", () => {
    const picked = questionsFor([question(1, "ingles"), question(1, "espanhol"), question(6, null)], "espanhol");
    expect(picked.map((item) => [item.number, item.language])).toEqual([
      [1, "espanhol"],
      [6, null],
    ]);
  });

  it("lists every image to save for offline use", () => {
    expect(questionImages(question(6, null))).toEqual(["/q6.png", "/alt.png"]);
  });
});

describe("examMistakeText", () => {
  const wrong = { number: 137, areaId: "mat" as const, marked: "B" as const, correct: "C" };

  it("uses the stem as the question and keeps the answer for the review", () => {
    expect(examMistakeText(wrong, "A **média** dos salários ![](/x.png) é")).toEqual({
      question: "Questão 137: A média dos salários [figura] é",
      lesson: "Você marcou B; a resposta certa é C.",
    });
  });

  it("fits the mistake log limit", () => {
    expect(examMistakeText(wrong, "a".repeat(500)).question).toHaveLength(300);
  });

  it("falls back to the answer when there is no text", () => {
    expect(examMistakeText({ ...wrong, marked: null }, null)).toEqual({
      question: "Questão 137: ficou em branco, a resposta é C. Refaça e descubra onde errou.",
      lesson: "",
    });
  });
});
