"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerSection } from "@/components/ui/Drawer";
import { Segmented, type SegmentedOption } from "@/components/ui/Segmented";
import { showToast } from "@/components/ui/Toast";
import { useStudyTopic } from "@/components/timer/use-study-topic";
import { shortDate } from "@/lib/dates";
import {
  FEEDBACK_LABELS,
  MASTERY_LABELS,
  REVIEW_DAYS,
  STATUS_LABELS,
  nextReview,
  progressOf,
  type Mastery,
  type TopicStatus,
} from "@/lib/reviews";
import { findArea } from "@/lib/syllabus";
import type { TopicRecord } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";
import { TopicForm, priorityOptions } from "./TopicForm";

const statusOptions = (Object.keys(STATUS_LABELS) as TopicStatus[]).map((status) => ({
  value: status,
  label: STATUS_LABELS[status],
}));

const masteryOptions: SegmentedOption<Mastery>[] = ([1, 2, 3, 4, 5] as const).map((level) => ({
  value: level,
  label: level,
  ariaLabel: MASTERY_LABELS[level],
}));

interface TopicDrawerProps {
  topic: TopicRecord | undefined;
  today: string;
  onClose: () => void;
}

export function TopicDrawer({ topic, today, onClose }: TopicDrawerProps) {
  const progress = useStudyStore((state) => (topic ? progressOf(state.progress, topic.id) : undefined));
  const { setStatus, toggleMastery, editTopic, setTopicHidden, removeTopic } = useStudyStore.getState();
  const studyTopic = useStudyTopic();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!topic || !progress) return null;

  const close = () => {
    setEditing(false);
    setConfirmingDelete(false);
    onClose();
  };

  const handleStatus = (status: TopicStatus) => {
    if (status === progress.status) return;
    const updated = setStatus(topic.id, status);
    if (status === "concluido" && nextReview(updated)) showToast("Revisões agendadas para 1, 7, 15 e 30 dias.");
  };

  const toggleHidden = () => {
    setTopicHidden(topic.id, !topic.hidden);
    showToast(topic.hidden ? "Tópico de volta à lista." : "Tópico oculto. Sessões e revisões continuam guardadas.");
    if (!topic.hidden) close();
  };

  const remove = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    removeTopic(topic.id);
    showToast("Tópico excluído. As sessões dele continuam no histórico.");
    close();
  };

  const input = { name: topic.name, areaId: topic.areaId, description: topic.description, priority: topic.priority };

  if (editing) {
    return (
      <Drawer open onClose={close} eyebrow="Editar tópico" title={topic.name}>
        <TopicForm
          initial={input}
          submitLabel="Salvar"
          onCancel={() => setEditing(false)}
          onSubmit={(changes) => {
            const error = editTopic(topic.id, changes);
            if (!error) {
              setEditing(false);
              showToast("Tópico atualizado.");
            }
            return error;
          }}
        />
      </Drawer>
    );
  }

  return (
    <Drawer
      open
      onClose={close}
      eyebrow={`${findArea(topic.areaId).name}${topic.origin === "personalizado" ? " · Personalizado" : ""}${topic.hidden ? " · Oculto" : ""}`}
      title={topic.name}
    >
      {topic.description && <p className="-mt-3 mb-4 text-sm text-muted whitespace-pre-line">{topic.description}</p>}

      <DrawerSection title="Status">
        <Segmented options={statusOptions} value={progress.status} onChange={handleStatus} wrap />
        {progress.status !== "concluido" && (
          <p className="text-[13px] text-muted">
            Ao concluir, as revisões de 1, 7, 15 e 30 dias são agendadas automaticamente.
          </p>
        )}
      </DrawerSection>

      <DrawerSection title="Prioridade">
        <Segmented
          options={priorityOptions}
          value={topic.priority}
          onChange={(priority) => editTopic(topic.id, { ...input, priority })}
        />
      </DrawerSection>

      <DrawerSection title={`Nível de domínio · ${MASTERY_LABELS[progress.mastery]}`}>
        <Segmented
          options={masteryOptions}
          value={progress.mastery}
          onChange={(level: Mastery) => toggleMastery(topic.id, level)}
        />
      </DrawerSection>

      {progress.reviews.length > 0 && (
        <DrawerSection title="Revisões">
          <div className="grid gap-2 text-sm tabular-nums">
            {progress.reviews.map((review) => (
              <div key={review.stage} className="grid gap-0.5">
                <div className="flex justify-between gap-3">
                  <span>
                    Revisão {review.stage} · {REVIEW_DAYS[review.stage - 1]} {review.stage === 1 ? "dia" : "dias"}
                  </span>
                  {review.done ? (
                    <span className="text-muted">Feita em {shortDate(review.done)}</span>
                  ) : review.due < today ? (
                    <span className="text-danger">Atrasada · {shortDate(review.due)}</span>
                  ) : (
                    <span className="text-muted">{shortDate(review.due)}</span>
                  )}
                </div>
                {Boolean(review.feedback || review.reschedules?.length) && (
                  <span className="text-xs text-muted">
                    {[
                      review.feedback && FEEDBACK_LABELS[review.feedback],
                      review.reschedules?.length &&
                        `Reagendada ${review.reschedules.length}x (era ${shortDate(review.reschedules[0].from)})`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </DrawerSection>
      )}

      <DrawerSection title="Organizar">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setEditing(true)}>Editar</Button>
          <Button onClick={toggleHidden}>{topic.hidden ? "Reexibir" : "Ocultar"}</Button>
          {topic.origin === "personalizado" && (
            <Button onClick={remove} className={confirmingDelete ? "text-danger" : ""}>
              {confirmingDelete ? "Clique de novo para excluir" : "Excluir"}
            </Button>
          )}
        </div>
        <p className="text-[13px] text-muted">
          {confirmingDelete
            ? "Excluir apaga o tópico, o progresso e as revisões dele. As sessões já registradas continuam no histórico."
            : "Ocultar tira o tópico das listas e do cronograma sem apagar nada."}
        </p>
      </DrawerSection>

      <Button
        variant="primary"
        size="lg"
        className="mt-auto w-full"
        onClick={() => {
          if (studyTopic(topic.id)) close();
        }}
      >
        Estudar no timer
      </Button>
    </Drawer>
  );
}
