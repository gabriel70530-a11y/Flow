"use client";

import { useEffect, useState } from "react";
import type { ExamDay } from "@/lib/exam";
import { OFFICIAL_EXAMS, questionImages, questionsFor, type ExamQuestion, type ForeignLanguage } from "@/lib/official-exams";
import { poolFromExam, type PoolQuestion } from "@/lib/question-blocks";

type PoolState = { status: "carregando" } | { status: "erro" } | { status: "pronto"; pool: PoolQuestion[] };

// Junta as questões de todas as provas que estão no app para o dia da área escolhida.
export function usePracticePool(day: ExamDay, language: ForeignLanguage): [PoolState, () => void] {
  const [state, setState] = useState<PoolState>({ status: "carregando" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const exams = OFFICIAL_EXAMS.filter((exam) => exam.day === day && exam.questionsUrl);
    Promise.all(
      exams.map((exam) =>
        fetch(exam.questionsUrl!)
          .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
          .then((data: { questions: ExamQuestion[] }) => poolFromExam(exam, questionsFor(data.questions, language), language)),
      ),
    )
      .then((pools) => {
        if (active) setState({ status: "pronto", pool: pools.flat() });
      })
      .catch(() => {
        if (active) setState({ status: "erro" });
      });
    return () => {
      active = false;
    };
  }, [day, language, attempt]);

  const retry = () => {
    setState({ status: "carregando" });
    setAttempt((value) => value + 1);
  };
  return [state, retry];
}

// Pede as imagens das questões escolhidas: o service worker guarda e o bloco segue sem internet.
export function prefetchImages(questions: readonly ExamQuestion[]) {
  for (const url of new Set(questions.flatMap(questionImages))) fetch(url).catch(() => {});
}
