"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, inputStyles } from "@/components/ui/Field";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { ProNotice } from "@/components/ui/ProNotice";
import { showToast } from "@/components/ui/Toast";
import { COMPETENCIES, ESSAY_TEXT_MAX, ESSAY_THEME_MAX, essayTotal } from "@/lib/essays";
import { correctEssay, type EssayCorrection, type ImagePayload } from "@/store/cloud";
import { useProAccess } from "@/store/pro";
import { useStudyStore } from "@/store/study-store";

const AI_LIMIT = 8;
const TEXT_MAX = 6000;

function Result({ result, theme, today, onSaved }: { result: EssayCorrection; theme: string; today: string; onSaved: () => void }) {
  const addEssay = useStudyStore((state) => state.addEssay);

  const save = () => {
    const error = addEssay({
      date: today,
      theme,
      scores: result.scores,
      corrector: "IA (estimativa)",
      improve: result.summary.slice(0, ESSAY_TEXT_MAX),
    });
    if (error) showToast(error);
    else onSaved();
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-5 gap-2">
        {COMPETENCIES.map((competency, index) => (
          <div key={competency.short} className="grid justify-items-center rounded-[12px] bg-hover px-1 py-2.5">
            <span className="text-[13px] text-muted">{competency.short}</span>
            <strong className="font-heading text-[20px] tabular-nums">{result.scores[index]}</strong>
          </div>
        ))}
      </div>
      <p>
        <strong className="font-heading text-[28px] font-extrabold tabular-nums">{essayTotal(result.scores)}</strong>{" "}
        <span className="text-muted">estimados</span>
      </p>
      <ul className="grid gap-2 rounded-[12px] bg-hover p-3.5 text-sm">
        {COMPETENCIES.map((competency, index) => (
          <li key={competency.short}>
            <strong>{competency.short}:</strong> {result.comments[index]}
          </li>
        ))}
      </ul>
      <p className="text-sm">
        <strong>Para a próxima:</strong> {result.summary}
      </p>
      <p className="text-[13px] text-muted tabular-nums">
        Estimativa feita por IA. Não é a nota oficial nem substitui um corretor. {result.remaining} de {AI_LIMIT} correções
        restantes neste mês.
      </p>
      <Button onClick={save} className="justify-self-start">
        Salvar nas minhas redações
      </Button>
    </div>
  );
}

export function AiEssayCard({ today, initialTheme = "" }: { today: string; initialTheme?: string }) {
  const pro = useProAccess();
  const [theme, setTheme] = useState(initialTheme);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<ImagePayload[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EssayCorrection | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!theme.trim()) return setError("Escreva o tema da redação.");
    if (!text.trim() && photos.length === 0) return setError("Envie as fotos ou cole o texto da redação.");
    setSending(true);
    setError(null);
    const response = await correctEssay({ theme: theme.trim(), text: text.trim(), images: photos });
    setSending(false);
    if ("error" in response) setError(response.error);
    else setResult(response.data);
  };

  const reset = () => {
    setResult(null);
    setTheme("");
    setText("");
    setPhotos([]);
  };

  return (
    <Card>
      <CardHeader title="Corrigir com IA">
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">Pro</span>
      </CardHeader>
      {!pro ? (
        <div className="grid gap-3">
          <ProNotice title="Corrija sua redação com IA no Pro">
            Fotografe a redação e receba a nota estimada por competência, com o que melhorar em cada uma. Até {AI_LIMIT} por mês.
          </ProNotice>
          <p className="text-[13px] text-muted">Você continua podendo registrar as notas que recebeu de um corretor.</p>
        </div>
      ) : result ? (
        <Result
          result={result}
          theme={theme.trim()}
          today={today}
          onSaved={() => {
            reset();
            showToast("Redação salva.");
          }}
        />
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Tema">
            <input
              value={theme}
              maxLength={ESSAY_THEME_MAX}
              onChange={(event) => setTheme(event.target.value)}
              placeholder="Ex.: Desafios para a valorização da herança africana no Brasil"
              className={inputStyles}
              disabled={sending}
            />
          </Field>
          <PhotoPicker label="Fotos da redação (até 2)" max={2} photos={photos} onChange={setPhotos} disabled={sending} />
          <Field label="Ou cole o texto">
            <textarea
              value={text}
              maxLength={TEXT_MAX}
              rows={4}
              onChange={(event) => setText(event.target.value)}
              className={`${inputStyles} h-auto resize-y py-2`}
              disabled={sending}
            />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" variant="primary" size="lg" disabled={sending} className="justify-self-start">
            {sending ? "Corrigindo…" : "Corrigir"}
          </Button>
          <p className="text-[13px] text-muted">
            A redação vai para a IA da Anthropic só para a correção. A nota é uma estimativa, não a oficial.
          </p>
        </form>
      )}
    </Card>
  );
}
