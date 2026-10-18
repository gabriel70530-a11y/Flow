"use client";

import { Button } from "@/components/ui/Button";
import { MOCK_DAY_AREAS } from "@/lib/mock-exams";
import { answeredCount, areaOfQuestion, questionNumber, scopeIndices, type ExamDraft, type OfficialExam } from "@/lib/official-exams";
import { findArea } from "@/lib/syllabus";

interface QuestionMapProps {
  draft: ExamDraft;
  exam: OfficialExam;
  confirming: boolean;
  onConfirm: (confirming: boolean) => void;
  onPick: (index: number) => void;
  onFinish: () => void;
  onLeave: () => void;
}

// Números das questões por área: respondida, em branco, a aberta agora e as marcadas para rever.
export function QuestionMap({ draft, exam, confirming, onConfirm, onPick, onFinish, onLeave }: QuestionMapProps) {
  const indices = scopeIndices(exam.day, draft.scope);
  const answered = answeredCount(draft, indices);
  const missing = indices.length - answered;
  const areas = MOCK_DAY_AREAS[exam.day].filter((areaId) => draft.scope === "dia" || draft.scope === areaId);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2>Questões</h2>
        <span className="text-[13px] text-muted tabular-nums">
          {answered} de {indices.length}
        </span>
      </div>
      {areas.map((areaId) => {
        const area = indices.filter((index) => areaOfQuestion(exam.day, index) === areaId);
        return (
          <section key={areaId} className="grid gap-2" aria-label={findArea(areaId).name}>
            <h3 className="text-xs font-bold tracking-[0.06em] text-muted uppercase tabular-nums">
              {findArea(areaId).shortName} · {questionNumber(exam.day, area[0])} a {questionNumber(exam.day, area[area.length - 1])}
            </h3>
            <ol className="grid grid-cols-[repeat(auto-fill,minmax(36px,1fr))] gap-1.5">
              {area.map((index) => {
                const number = questionNumber(exam.day, index);
                const done = draft.answers[index] !== null;
                const here = draft.current === index;
                const flagged = draft.flagged.includes(index);
                return (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => onPick(index)}
                      aria-current={here ? "step" : undefined}
                      aria-label={`Questão ${number}${done ? ", respondida" : ", em branco"}${flagged ? ", para rever" : ""}`}
                      className={`relative grid aspect-square w-full min-w-9 place-items-center rounded-full border-2 text-[11px] font-bold tabular-nums ${
                        done ? "border-action bg-action text-on-action" : "border-line"
                      } ${here ? "border-edge shadow-stamp-sm" : ""}`}
                    >
                      {number}
                      {flagged && (
                        <span aria-hidden className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface bg-danger" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      <div className="flex flex-wrap gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-3 rounded-full bg-action" aria-hidden />
          Respondida
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-3 rounded-full border-2 border-line" aria-hidden />
          Em branco
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-danger" aria-hidden />
          Rever depois
        </span>
      </div>
      <div className="grid gap-2 border-t border-line pt-4">
        {confirming ? (
          <>
            <p className="text-sm">
              {missing > 0 ? `Faltam ${missing} questões. As em branco contam como erro.` : "Tudo respondido. Corrigir agora?"}
            </p>
            <Button variant="primary" size="lg" onClick={onFinish} className="w-full">
              Corrigir agora
            </Button>
            <Button onClick={() => onConfirm(false)} className="w-full">
              Voltar
            </Button>
          </>
        ) : (
          <>
            {missing > 0 && <p className="text-[13px] text-muted tabular-nums">Faltam {missing} questões.</p>}
            <Button variant="primary" size="lg" onClick={() => onConfirm(true)} className="w-full">
              Terminar e corrigir
            </Button>
            <button type="button" onClick={onLeave} className="h-9 rounded-full text-sm font-semibold text-muted hover:text-text">
              Sair e continuar depois
            </button>
          </>
        )}
      </div>
    </div>
  );
}
