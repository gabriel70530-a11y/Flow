"use client";

import { ChevronLeft, ChevronRight, Flag, LayoutGrid, Pause, PencilLine } from "lucide-react";
import { useEffect, useState } from "react";
import { useNow } from "@/components/timer/use-now";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import {
  answeredCount,
  areaOfQuestion,
  draftSeconds,
  officialExamTitle,
  questionNumber,
  scopeIndices,
  type ExamDraft,
  type ExamQuestion,
  type ForeignLanguage,
  type GradedExam,
  type Letter,
  type OfficialExam,
} from "@/lib/official-exams";
import { findArea } from "@/lib/syllabus";
import { clockText } from "@/lib/timer";
import { useStudyStore } from "@/store/study-store";
import { QuestionMap } from "./QuestionMap";
import { QuestionView } from "./QuestionView";
import { ScratchPanel, ScratchSheet } from "./ScratchPad";
import { useExamQuestions } from "./use-exam-questions";

export interface ExamResult {
  graded: GradedExam;
  exam: OfficialExam;
  answers: (Letter | null)[];
  language: ForeignLanguage;
  // Presente quando o simulado foi feito com as questões no app: permite rever cada erro.
  questions: ExamQuestion[] | null;
}

// Prova com as questões na tela: barra com o tempo, uma questão por vez e o mapa das questões ao lado (no celular, num botão).
export function ExamRunner({ draft, exam, onFinish }: { draft: ExamDraft; exam: OfficialExam; onFinish: (result: ExamResult) => void }) {
  const { answerExam, goToQuestion, toggleExamFlag, pauseExam, finishExam } = useStudyStore.getState();
  const [questionsState, retry] = useExamQuestions(exam, draft.language);
  const [showMap, setShowMap] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [side, setSide] = useState<"mapa" | "rascunho">("mapa");
  const [sketching, setSketching] = useState(false);
  const now = useNow(true);
  const seconds = draftSeconds(draft, Math.max(now, draft.startedAt ?? 0));
  const indices = scopeIndices(exam.day, draft.scope);
  const position = indices.indexOf(draft.current);
  const answered = answeredCount(draft, indices);
  const number = questionNumber(exam.day, draft.current);

  const currentIndex = draft.current;
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentIndex]);

  const leave = () => {
    pauseExam();
    showToast("Simulado pausado. Continue quando quiser.");
  };

  const finish = () => {
    const result = finishExam();
    if ("error" in result) return showToast(result.error);
    onFinish({ ...result, exam, questions: questionsState.status === "pronto" ? questionsState.questions : null });
  };

  const pick = (index: number) => {
    goToQuestion(index);
    setShowMap(false);
  };

  const map = (
    <QuestionMap
      draft={draft}
      exam={exam}
      confirming={confirming}
      onConfirm={setConfirming}
      onPick={pick}
      onFinish={finish}
      onLeave={leave}
    />
  );

  const question = questionsState.status === "pronto" ? questionsState.questions[draft.current] : null;
  const last = position === indices.length - 1;
  const sketchKey = `simulado:${exam.id}:${draft.current}`;

  return (
    <div className="grid gap-5">
      <div className="sticky top-[calc(60px+env(safe-area-inset-top,0px))] z-10 -mt-1 overflow-hidden rounded-[16px] border border-line bg-surface md:top-4">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="hidden min-w-0 md:grid">
            <strong className="truncate font-heading text-base font-semibold font-stretch-108%">{officialExamTitle(exam)}</strong>
            <span className="text-[13px] text-muted tabular-nums">
              {answered} de {indices.length} respondidas
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-heading text-[24px] leading-none font-light tabular-nums italic font-stretch-120% md:text-[28px]">
              {clockText(seconds)}
            </span>
            <button
              type="button"
              onClick={leave}
              aria-label="Pausar"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-hover text-text"
            >
              <Pause size={18} aria-hidden />
            </button>
          </div>
          <Button onClick={() => setShowMap(!showMap)} aria-pressed={showMap} className="lg:hidden">
            <LayoutGrid size={16} aria-hidden />
            <span className="tabular-nums">
              {answered}/{indices.length}
            </span>
          </Button>
        </div>
        <div className="h-1 bg-track">
          <div className="h-full bg-mid" style={{ width: `${(answered / indices.length) * 100}%` }} />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {showMap ? (
          <Card className="grid gap-4 lg:hidden">
            <Button onClick={() => setShowMap(false)} className="justify-self-start">
              <ChevronLeft size={16} aria-hidden />
              Questão {number}
            </Button>
            {map}
          </Card>
        ) : (
          <Card className="grid gap-4">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-3.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="tabular-nums">Questão {number}</h2>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                  {findArea(areaOfQuestion(exam.day, draft.current)).shortName}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button onClick={() => setSketching(true)} aria-label="Rascunho" className="lg:hidden">
                  <PencilLine size={16} aria-hidden />
                </Button>
                <button
                  type="button"
                  aria-pressed={draft.flagged.includes(draft.current)}
                  onClick={() => toggleExamFlag(draft.current)}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 border-line px-3 text-sm font-semibold text-muted aria-pressed:border-danger aria-pressed:bg-danger-soft aria-pressed:text-danger"
                >
                  <Flag size={16} aria-hidden />
                  Rever depois
                </button>
              </div>
            </div>

            {questionsState.status === "carregando" && <Skeleton className="h-80" />}
            {questionsState.status === "erro" && (
              <div className="grid gap-3 rounded-[12px] bg-hover p-3.5 text-sm">
                <p>Não foi possível abrir as questões. Confira a internet e tente de novo.</p>
                <Button onClick={retry} className="justify-self-start">
                  Tentar de novo
                </Button>
              </div>
            )}
            {question && (
              <QuestionView
                question={question}
                mode={{ kind: "answer", marked: draft.answers[draft.current], onAnswer: (letter) => answerExam(draft.current, letter) }}
              />
            )}

            <p className="text-xs text-muted">
              Enem {exam.year} · {exam.day}º dia · caderno azul · questão {number}. Prova e gabarito oficiais do Inep.
            </p>

            <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom,0px))] -mx-5 -mb-5 grid grid-cols-2 gap-3 rounded-b-[16px] border-t-2 border-edge bg-surface px-4 py-3 md:static md:mx-0 md:mb-0 md:border-0 md:p-0">
              <Button size="lg" disabled={position <= 0} onClick={() => goToQuestion(indices[position - 1])}>
                <ChevronLeft size={18} aria-hidden />
                Anterior
              </Button>
              {last ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setConfirming(true);
                    setShowMap(true);
                  }}
                >
                  Terminar
                </Button>
              ) : (
                <Button variant="primary" size="lg" onClick={() => goToQuestion(indices[position + 1])}>
                  Próxima
                  <ChevronRight size={18} aria-hidden />
                </Button>
              )}
            </div>
          </Card>
        )}

        <div className="sticky top-28 hidden h-[calc(100vh-8rem)] flex-col gap-3 lg:flex">
          <Segmented
            options={[
              { value: "mapa", label: "Questões" },
              { value: "rascunho", label: "Rascunho" },
            ]}
            value={side}
            onChange={setSide}
          />
          {side === "mapa" ? (
            <Card className="min-h-0 overflow-y-auto">{map}</Card>
          ) : (
            <ScratchPanel sketchKey={sketchKey} className="flex min-h-0 flex-1" />
          )}
        </div>
      </div>
      {sketching && <ScratchSheet sketchKey={sketchKey} title={`questão ${number}`} onClose={() => setSketching(false)} />}
    </div>
  );
}
