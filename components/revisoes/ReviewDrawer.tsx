"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerSection } from "@/components/ui/Drawer";
import { Field, inputStyles } from "@/components/ui/Field";
import { showToast } from "@/components/ui/Toast";
import { useStudyTopic } from "@/components/timer/use-study-topic";
import { addDays, dueLabel, shortDate } from "@/lib/dates";
import { nextReview, progressOf, reviewLabel } from "@/lib/reviews";
import { focusName } from "@/lib/syllabus";
import type { TopicRecord } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";

interface ReviewDrawerProps {
  topic: TopicRecord | undefined;
  today: string;
  onClose: () => void;
  onComplete: (topicId: string) => void;
}

export function ReviewDrawer({ topic, today, onClose, onComplete }: ReviewDrawerProps) {
  const review = useStudyStore((state) => (topic ? nextReview(progressOf(state.progress, topic.id)) : undefined));
  const { postponeReview, rescheduleReview } = useStudyStore.getState();
  const studyTopic = useStudyTopic();
  const [error, setError] = useState<string | null>(null);

  if (!topic || !review) return null;

  const postpone = () => {
    postponeReview(topic.id);
    showToast("Revisão adiada.");
    onClose();
  };

  const reschedule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const date = String(new FormData(event.currentTarget).get("date") ?? "");
    if (!rescheduleReview(topic.id, date)) {
      setError("Escolha hoje ou uma data futura.");
      return;
    }
    showToast(`Revisão reagendada para ${shortDate(date)}.`);
    onClose();
  };

  return (
    <Drawer open onClose={onClose} eyebrow={`${focusName(topic.areaId, topic.subjectId)} · ${reviewLabel(review)}`} title={topic.name}>
      <DrawerSection title="Data">
        <p className={review.due < today ? "text-danger" : ""}>{dueLabel(review.due, today)}</p>
        {review.reschedules && review.reschedules.length > 0 && (
          <ul className="grid gap-1 text-[13px] text-muted tabular-nums">
            {review.reschedules.map((change) => (
              <li key={`${change.at}-${change.to}`}>
                Em {shortDate(change.at)}: de {shortDate(change.from)} para {shortDate(change.to)}
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>

      <DrawerSection title="Mudar a data">
        <p className="text-[13px] text-muted">Só esta revisão muda. As próximas etapas continuam nas datas delas.</p>
        <Button className="justify-self-start" onClick={postpone}>
          Adiar para {shortDate(addDays(review.due < today ? today : review.due, 1))}
        </Button>
        <form onSubmit={reschedule} className="flex flex-wrap items-end gap-2">
          <Field label="Outra data" error={error} className="flex-1">
            <input
              type="date"
              name="date"
              min={today}
              defaultValue={review.due < today ? today : review.due}
              required
              onChange={() => setError(null)}
              className={inputStyles}
            />
          </Field>
          <Button type="submit">Reagendar</Button>
        </form>
      </DrawerSection>

      <div className="mt-auto grid gap-2 pt-4">
        {review.due <= today && (
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              onComplete(topic.id);
              onClose();
            }}
          >
            Concluir revisão
          </Button>
        )}
        <Button
          size="lg"
          onClick={() => {
            if (studyTopic(topic.id)) onClose();
          }}
        >
          Estudar no timer
        </Button>
      </div>
    </Drawer>
  );
}
