import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OFFICIAL_EXAMS, areaOfQuestion, questionImages, questionNumber, questionsFor, type ExamQuestion } from "./official-exams";

const publicFile = (url: string) => join(process.cwd(), "public", url);

describe.each(OFFICIAL_EXAMS.filter((exam) => exam.questionsUrl))("questions of $id", (exam) => {
  const { examId, questions } = JSON.parse(readFileSync(publicFile(exam.questionsUrl!), "utf8")) as {
    examId: string;
    questions: ExamQuestion[];
  };

  it("has the 90 questions of the day in order, in both languages when there is a foreign language", () => {
    expect(examId).toBe(exam.id);
    for (const language of ["ingles", "espanhol"] as const) {
      const day = questionsFor(questions, language);
      expect(day.map((question) => question.number)).toEqual(day.map((_, index) => questionNumber(exam.day, index)));
      expect(day.every((question, index) => question.areaId === areaOfQuestion(exam.day, index))).toBe(true);
      if (exam.day === 1) expect(day.slice(0, 5).every((question) => question.language === language)).toBe(true);
    }
  });

  it("has five alternatives with text or image in every question", () => {
    for (const question of questions) {
      expect(question.alternatives.map((alternative) => alternative.letter)).toEqual(["A", "B", "C", "D", "E"]);
      expect(question.alternatives.every((alternative) => alternative.text || alternative.image)).toBe(true);
    }
  });

  it("ships every image it points to", () => {
    const missing = questions.flatMap(questionImages).filter((url) => !existsSync(publicFile(url)));
    expect(missing).toEqual([]);
  });
});
