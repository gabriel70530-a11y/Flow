"use client";

import { Button } from "@/components/ui/Button";
import { Drawer, DrawerSection } from "@/components/ui/Drawer";
import { Segmented, type SegmentedOption } from "@/components/ui/Segmented";
import { showToast } from "@/components/ui/Toast";
import { useStudyTopic } from "@/components/timer/use-study-topic";
import { shortDate } from "@/lib/dates";
import {
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
  const setStatus = useStudyStore((state) => state.setStatus);
  const toggleMastery = useStudyStore((state) => state.toggleMastery);
  const studyTopic = useStudyTopic();

  if (!topic || !progress) return null;

  const handleStatus = (status: TopicStatus) => {
    if (status === progress.status) return;
    const updated = setStatus(topic.id, status);
    if (status === "concluido" && nextReview(updated)) showToast("Revisões agendadas para 1, 7, 15 e 30 dias.");
  };

  return (
    <Drawer open onClose={onClose} eyebrow={findArea(topic.areaId).name} title={topic.name}>
      <DrawerSection title="Status">
        <Segmented options={statusOptions} value={progress.status} onChange={handleStatus} wrap />
        {progress.status !== "concluido" && (
          <p className="text-[13px] text-muted">
            Ao concluir, as revisões de 1, 7, 15 e 30 dias são agendadas automaticamente.
          </p>
        )}
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
              <div key={review.stage} className="flex justify-between gap-3">
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
            ))}
          </div>
        </DrawerSection>
      )}

      <Button variant="primary" size="lg" className="mt-auto w-full" onClick={() => studyTopic(topic.id)}>
        Estudar no timer
      </Button>
    </Drawer>
  );
}
