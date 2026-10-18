"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputStyles } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import type { ExamDay } from "@/lib/exam";
import { MOCK_DAY_AREAS, MOCK_NOTE_MAX, QUESTIONS_PER_AREA } from "@/lib/mock-exams";
import { findArea, type AreaId } from "@/lib/syllabus";
import { useStudyStore } from "@/store/study-store";

const dayOptions: { value: ExamDay; label: string }[] = [
  { value: 1, label: "1º dia" },
  { value: 2, label: "2º dia" },
];

// Campo vazio = área não feita neste simulado.
// Campos curtos, lado a lado: sem a largura total dos campos comuns.
const shortInput = inputStyles.replace("w-full", "");

type Answers = Partial<Record<AreaId, { correct: string; total: string }>>;

export function MockExamForm({ today, onDone }: { today: string; onDone: () => void }) {
  const addMockExam = useStudyStore((state) => state.addMockExam);
  const [day, setDay] = useState<ExamDay>(1);
  const [date, setDate] = useState(today);
  const [answers, setAnswers] = useState<Answers>({});
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const updateAnswer = (areaId: AreaId, field: "correct" | "total", value: string) => {
    setAnswers((current) => ({
      ...current,
      [areaId]: { correct: "", total: String(QUESTIONS_PER_AREA), ...current[areaId], [field]: value },
    }));
    setError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const sections = MOCK_DAY_AREAS[day].flatMap((areaId) => {
      const answer = answers[areaId];
      if (!answer || answer.correct === "") return [];
      return [{ areaId, correct: Number(answer.correct), total: Number(answer.total || QUESTIONS_PER_AREA) }];
    });
    const result = addMockExam({ date, day, minutes: minutes === "" ? null : Number(minutes), sections, note });
    if (result) setError(result);
    else onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Qual dia de prova?</span>
        <Segmented
          options={dayOptions}
          value={day}
          onChange={(value) => {
            setDay(value);
            setError(null);
          }}
        />
        <span className="text-[13px] text-muted">
          {day === 1 ? "Linguagens, Humanas e redação, em 5h30." : "Natureza e Matemática, em 5h."}
        </span>
      </div>
      <Field label="Quando você fez?">
        <input type="date" max={today} value={date} onChange={(event) => setDate(event.target.value)} className={inputStyles} required />
      </Field>
      {MOCK_DAY_AREAS[day].map((areaId) => (
        <fieldset key={areaId} className="grid gap-1.5">
          <legend className="mb-1.5 text-[13px] font-semibold text-muted">{findArea(areaId).name}</legend>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={QUESTIONS_PER_AREA}
              value={answers[areaId]?.correct ?? ""}
              onChange={(event) => updateAnswer(areaId, "correct", event.target.value)}
              aria-label={`Acertos em ${findArea(areaId).name}`}
              placeholder="Acertos"
              className={`${shortInput} w-24 tabular-nums`}
            />
            <span className="text-muted">de</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={QUESTIONS_PER_AREA}
              value={answers[areaId]?.total ?? String(QUESTIONS_PER_AREA)}
              onChange={(event) => updateAnswer(areaId, "total", event.target.value)}
              aria-label={`Questões de ${findArea(areaId).name}`}
              className={`${shortInput} w-[72px] tabular-nums`}
            />
            <span className="text-muted">questões</span>
          </div>
        </fieldset>
      ))}
      <Field label="Quanto tempo levou, em minutos? (opcional)" hint={day === 1 ? "Contando a redação, se você fez." : undefined}>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={600}
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          placeholder={day === 1 ? "Ex.: 320" : "Ex.: 290"}
          className={`${shortInput} w-40 tabular-nums`}
        />
      </Field>
      <Field label="Observação (opcional)">
        <textarea
          value={note}
          maxLength={MOCK_NOTE_MAX}
          rows={2}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ex.: cansei no fim, chutei as últimas 10"
          className={`${inputStyles} h-auto resize-none py-2`}
        />
      </Field>
      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg">
        Salvar simulado
      </Button>
    </form>
  );
}
