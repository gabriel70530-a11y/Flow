/* eslint-disable @next/next/no-img-element -- figuras da prova em tamanhos variados, servidas como arquivos estáticos */
import { Fragment } from "react";
import { parseRichText } from "@/lib/official-exams";

// As figuras da prova têm fundo branco: ficam numa moldura branca também no tema escuro.
export function QuestionFigure({ src, alt = "Figura da questão" }: { src: string; alt?: string }) {
  return (
    <div className="max-w-full justify-self-start overflow-x-auto rounded-[12px] border-2 border-line bg-white p-2.5">
      <img src={src} alt={alt} loading="lazy" className="block h-auto max-w-full" />
    </div>
  );
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`grid gap-3.5 ${className}`}>
      {parseRichText(text).map((block, index) =>
        block.kind === "figure" ? (
          <QuestionFigure key={index} src={block.src} />
        ) : (
          <p key={index} className="max-w-[68ch] wrap-anywhere">
            {block.parts.map((part, partIndex) =>
              part.kind === "break" ? (
                <br key={partIndex} />
              ) : part.kind === "image" ? (
                <img
                  key={partIndex}
                  src={part.src}
                  alt="Fórmula"
                  className="mx-0.5 inline-block max-h-[2em] max-w-full rounded-[4px] bg-white px-0.5 align-middle"
                />
              ) : (
                <Fragment key={partIndex}>
                  {part.bold && part.italic ? (
                    <strong>
                      <em>{part.text}</em>
                    </strong>
                  ) : part.bold ? (
                    <strong>{part.text}</strong>
                  ) : part.italic ? (
                    <em>{part.text}</em>
                  ) : (
                    part.text
                  )}
                </Fragment>
              ),
            )}
          </p>
        ),
      )}
    </div>
  );
}
