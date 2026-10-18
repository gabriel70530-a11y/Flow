"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputStyles } from "@/components/ui/Field";
import { addDays, shortDate } from "@/lib/dates";
import { nextReview, progressOf } from "@/lib/reviews";
import { AREAS, focusName } from "@/lib/syllabus";
import { visibleTopics } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";

const SHORTCUTS = [
  { days: 1, label: "Amanhã" },
  { days: 7, label: "Em 7 dias" },
  { days: 15, label: "Em 15 dias" },
  { days: 30, label: "Em 30 dias" },
];

// A pessoa escolhe o tópico e a data. Se o tópico já tem revisão pendente, ela só muda de data.
export function ManualReviewForm({ today, onDone }: { today: string; onDone: (message: string) => void }) {
  const topics = useStudyStore((state) => state.topics);
  const progress = useStudyStore((state) => state.progress);
  const scheduleReview = useStudyStore((state) => state.scheduleReview);
  const [topicId, setTopicId] = useState("");
  const [date, setDate] = useState(addDays(today, 1));
  const [error, setError] = useState<string | null>(null);
  const shown = visibleTopics(topics);
  const pending = topicId ? nextReview(progressOf(progress, topicId)) : undefined;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const failure = scheduleReview(topicId, date);
    setError(failure);
    if (!failure) onDone(`Revisão agendada para ${shortDate(date)}.`);
  };

  if (shown.length === 0) {
    return <p className="text-muted">Crie seus tópicos em Matérias para agendar revisões.</p>;
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Tópico" hint={pending ? `Já tem revisão em ${shortDate(pending.due)}. Ela muda para a nova data.` : undefined}>
        <select
          value={topicId}
          onChange={(event) => {
            setTopicId(event.target.value);
            setError(null);
          }}
          className={inputStyles}
        >
          <option value="">Escolha o tópico</option>
          {AREAS.map((area) => {
            const list = shown.filter((topic) => topic.areaId === area.id);
            return list.length ? (
              <optgroup key={area.id} label={area.name}>
                {list.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.subjectId ? `${focusName(topic.areaId, topic.subjectId)} · ${topic.name}` : topic.name}
                  </option>
                ))}
              </optgroup>
            ) : null;
          })}
        </select>
      </Field>
      <Field label="Data">
        <input type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} required className={inputStyles} />
      </Field>
      <div className="flex flex-wrap gap-2">
        {SHORTCUTS.map(({ days, label }) => (
          <Button key={days} onClick={() => setDate(addDays(today, days))} aria-pressed={date === addDays(today, days)}>
            {label}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg">
        Agendar
      </Button>
    </form>
  );
}
