/* eslint-disable @next/next/no-img-element -- alternativas em imagem, servidas como arquivos estáticos */
import type { ExamQuestion, Letter } from "@/lib/official-exams";
import { RichText } from "./RichText";

type Mode =
  | { kind: "answer"; marked: Letter | null; onAnswer: (letter: Letter | null) => void }
  | { kind: "review"; marked: Letter | null; correct: string };

function AlternativeBody({ letter, text, image, state }: { letter: Letter; text: string | null; image: string | null; state: string }) {
  return (
    <>
      <span
        className={`grid size-[34px] shrink-0 place-items-center rounded-full border-2 text-sm font-bold ${
          state === "marked"
            ? "border-action bg-action text-on-action"
            : state === "correct"
              ? "border-success bg-success text-surface"
              : state === "wrong"
                ? "border-danger bg-danger text-surface"
                : "border-line"
        }`}
      >
        {letter}
      </span>
      {image ? (
        <span className="rounded-[10px] border-2 border-line bg-white p-1.5">
          <img src={image} alt={`Alternativa ${letter}`} loading="lazy" className="block h-auto max-h-56 max-w-full" />
        </span>
      ) : (
        text && <RichText text={text} />
      )}
    </>
  );
}

export function QuestionView({ question, mode }: { question: ExamQuestion; mode: Mode }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3.5 text-base leading-relaxed">
        {question.text && <RichText text={question.text} />}
        {question.stem && <RichText text={question.stem} className="font-semibold" />}
      </div>
      <ul className="grid gap-2.5">
        {question.alternatives.map(({ letter, text, image }) => {
          const base = "flex min-h-[52px] w-full items-center gap-3.5 rounded-[14px] border-2 px-3.5 py-2.5 text-left text-base";
          if (mode.kind === "answer") {
            const marked = mode.marked === letter;
            return (
              <li key={letter}>
                <button
                  type="button"
                  aria-pressed={marked}
                  onClick={() => mode.onAnswer(marked ? null : letter)}
                  className={`${base} ${marked ? "border-edge bg-surface shadow-stamp" : "border-line bg-surface hover:border-edge"}`}
                >
                  <AlternativeBody letter={letter} text={text} image={image} state={marked ? "marked" : "none"} />
                </button>
              </li>
            );
          }
          const correct = mode.correct === letter;
          const wrong = !correct && mode.marked === letter;
          return (
            <li
              key={letter}
              className={`${base} ${correct ? "border-success bg-success-soft" : wrong ? "border-danger bg-danger-soft" : "border-line"}`}
            >
              <AlternativeBody letter={letter} text={text} image={image} state={correct ? "correct" : wrong ? "wrong" : "none"} />
              {(correct || wrong) && (
                <span className={`ml-auto shrink-0 text-[13px] font-semibold ${correct ? "text-success" : "text-danger"}`}>
                  {correct ? (mode.marked === letter ? "Sua resposta, certa" : "Resposta certa") : "Sua resposta"}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
