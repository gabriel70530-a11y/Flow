"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { inputStyles } from "@/components/ui/Field";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { analyzeMistake, type ImagePayload, type MistakeAnalysis } from "@/store/cloud";

const AI_LIMIT = 60;
const TEXT_MAX = 4000;
const LETTERS = ["A", "B", "C", "D", "E"];

// Só preenche o formulário: a pessoa confere, ajusta e salva.
export function AiMistakeHelper({ onResult }: { onResult: (analysis: MistakeAnalysis) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<ImagePayload[]>([]);
  const [marked, setMarked] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="justify-self-start">
        <Sparkles size={16} aria-hidden />
        Analisar com IA
      </Button>
    );
  }

  const analyze = async () => {
    if (!text.trim() && photos.length === 0) return setError("Envie a foto ou cole o texto da questão.");
    setSending(true);
    setError(null);
    const response = await analyzeMistake({ text: text.trim(), images: photos, marked });
    setSending(false);
    if ("error" in response) return setError(response.error);
    setRemaining(response.data.remaining);
    onResult(response.data);
  };

  return (
    <div className="grid gap-3 rounded-[12px] bg-hover p-3.5">
      <strong className="text-sm">Analisar com IA</strong>
      <PhotoPicker label="Foto da questão" max={1} photos={photos} onChange={setPhotos} disabled={sending} />
      <textarea
        value={text}
        maxLength={TEXT_MAX}
        rows={3}
        onChange={(event) => setText(event.target.value)}
        placeholder="Ou cole o enunciado e as alternativas"
        aria-label="Texto da questão"
        className={`${inputStyles} h-auto resize-y py-2`}
        disabled={sending}
      />
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Alternativa que você marcou">
        <span className="mr-1 text-[13px] text-muted">Você marcou:</span>
        {LETTERS.map((letter) => (
          <button
            key={letter}
            type="button"
            aria-pressed={marked === letter}
            onClick={() => setMarked(marked === letter ? null : letter)}
            disabled={sending}
            className={`size-9 rounded-full border-2 text-sm font-semibold ${marked === letter ? "border-edge bg-action text-on-action" : "border-line bg-surface"}`}
          >
            {letter}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button variant="primary" onClick={analyze} disabled={sending} className="justify-self-start">
        {sending ? "Analisando…" : "Analisar"}
      </Button>
      <p className="text-[13px] text-muted tabular-nums">
        {remaining === null
          ? `Análise feita pela IA da Anthropic, pode errar. Até ${AI_LIMIT} por mês.`
          : `Pronto: confira os campos abaixo antes de salvar. A IA pode errar. ${remaining} de ${AI_LIMIT} restantes neste mês.`}
      </p>
    </div>
  );
}
