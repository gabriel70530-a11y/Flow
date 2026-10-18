"use client";

import { useEffect, useState } from "react";
import { questionImages, questionsFor, type ExamQuestion, type ForeignLanguage, type OfficialExam } from "@/lib/official-exams";

type QuestionsState = { status: "carregando" } | { status: "erro" } | { status: "pronto"; questions: ExamQuestion[] };

// Busca as questões da prova e pede as imagens logo no começo: o service worker guarda tudo e a prova segue sem internet.
export function useExamQuestions(exam: OfficialExam, language: ForeignLanguage): [QuestionsState, () => void] {
  const [state, setState] = useState<QuestionsState>({ status: "carregando" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!exam.questionsUrl) return;
    let active = true;
    fetch(exam.questionsUrl)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data: { questions: ExamQuestion[] }) => {
        if (!active) return;
        const questions = questionsFor(data.questions, language);
        setState({ status: "pronto", questions });
        for (const url of new Set(questions.flatMap(questionImages))) fetch(url).catch(() => {});
      })
      .catch(() => {
        if (active) setState({ status: "erro" });
      });
    return () => {
      active = false;
    };
  }, [exam.questionsUrl, language, attempt]);

  const retry = () => {
    setState({ status: "carregando" });
    setAttempt((value) => value + 1);
  };
  return [state, retry];
}
