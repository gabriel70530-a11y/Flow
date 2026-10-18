"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputStyles } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { COMPETENCIES, COMPETENCY_SCORES, ESSAY_TEXT_MAX, ESSAY_THEME_MAX, essayTotal } from "@/lib/essays";
import { useStudyStore } from "@/store/study-store";

export function EssayForm({ today, onDone }: { today: string; onDone: () => void }) {
  const addEssay = useStudyStore((state) => state.addEssay);
  const [date, setDate] = useState(today);
  const [theme, setTheme] = useState("");
  const [corrected, setCorrected] = useState<"sim" | "nao">("sim");
  const [scores, setScores] = useState<number[]>(COMPETENCIES.map(() => 120));
  const [corrector, setCorrector] = useState("");
  const [improve, setImprove] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = addEssay({ date, theme, scores: corrected === "sim" ? scores : null, corrector, improve });
    if (result) setError(result);
    else onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      <Field label="Tema" error={error}>
        <input
          value={theme}
          maxLength={ESSAY_THEME_MAX}
          onChange={(event) => {
            setTheme(event.target.value);
            setError(null);
          }}
          placeholder="Ex.: Desafios para a valorização de comunidades tradicionais"
          className={inputStyles}
          aria-invalid={Boolean(error)}
        />
      </Field>
      <Field label="Quando você escreveu?">
        <input type="date" max={today} value={date} onChange={(event) => setDate(event.target.value)} className={inputStyles} required />
      </Field>
      <div className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Já foi corrigida?</span>
        <Segmented
          options={[
            { value: "sim" as const, label: "Sim" },
            { value: "nao" as const, label: "Ainda não" },
          ]}
          value={corrected}
          onChange={setCorrected}
        />
      </div>
      {corrected === "sim" && (
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-[13px] font-semibold text-muted">
            Nota por competência · total <span className="tabular-nums">{essayTotal(scores)}</span>
          </legend>
          {COMPETENCIES.map((competency, index) => (
            <label key={competency.short} className="grid grid-cols-[minmax(0,1fr)_96px] items-center gap-3 text-sm">
              <span>
                <span className="font-semibold">{competency.short}</span> {competency.name}
              </span>
              <select
                value={scores[index]}
                onChange={(event) => setScores(scores.map((score, item) => (item === index ? Number(event.target.value) : score)))}
                className={`${inputStyles} tabular-nums`}
              >
                {COMPETENCY_SCORES.map((score) => (
                  <option key={score} value={score}>
                    {score}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>
      )}
      <Field label="Quem corrigiu? (opcional)">
        <input
          value={corrector}
          maxLength={120}
          onChange={(event) => setCorrector(event.target.value)}
          placeholder="Ex.: app MEC Enem, professora de português"
          className={inputStyles}
        />
      </Field>
      <Field label="O que melhorar na próxima (opcional)">
        <textarea
          value={improve}
          maxLength={ESSAY_TEXT_MAX}
          rows={3}
          onChange={(event) => setImprove(event.target.value)}
          placeholder="Ex.: proposta de intervenção sem o agente; repetir menos 'além disso'"
          className={`${inputStyles} h-auto resize-none py-2`}
        />
      </Field>
      <Button type="submit" variant="primary" size="lg">
        Salvar redação
      </Button>
    </form>
  );
}
