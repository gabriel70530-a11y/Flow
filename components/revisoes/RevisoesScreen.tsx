"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Button, linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DueLabel } from "@/components/ui/DueLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListRow } from "@/components/ui/ListRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { toDateKey } from "@/lib/dates";
import { groupReviews, nextReview, pendingReviews, progressOf, type PendingReview } from "@/lib/reviews";
import { focusName } from "@/lib/syllabus";
import { findTopic } from "@/lib/topics";
import { useHydrated, useStudyStore } from "@/store/study-store";
import { ReviewDrawer } from "./ReviewDrawer";
import { ReviewFeedbackPrompt } from "./ReviewFeedbackPrompt";

const LATER_PREVIEW = 8;

export function RevisoesScreen() {
  const hydrated = useHydrated();
  const progress = useStudyStore((state) => state.progress);
  const topics = useStudyStore((state) => state.topics);
  const completeReview = useStudyStore((state) => state.completeReview);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<{ topicId: string; stage: number } | null>(null);
  const [showAllLater, setShowAllLater] = useState(false);
  const closeDrawer = useCallback(() => setOpenTopicId(null), []);

  const header = (
    <PageHeader title="Revisões" subtitle="Agendadas para 1, 7, 15 e 30 dias depois de concluir um tópico." />
  );

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        {header}
        <Skeleton className="h-64" />
      </div>
    );
  }

  const today = toDateKey(new Date());
  const pending = pendingReviews(progress, topics);
  const groups = groupReviews(pending, today);
  const later = showAllLater ? groups.later : groups.later.slice(0, LATER_PREVIEW);
  const sections: [string, PendingReview[]][] = [
    ["Atrasadas", groups.late],
    ["Hoje", groups.today],
    ["Próximos 7 dias", groups.upcoming],
    ["Futuras", later],
  ];
  const nothingDue = groups.late.length + groups.today.length === 0;
  const completedTopic = completed && findTopic(topics, completed.topicId);

  const complete = (topicId: string) => {
    const stage = nextReview(progressOf(progress, topicId))?.stage;
    if (!stage) return;
    const updated = completeReview(topicId);
    setCompleted({ topicId, stage });
    showToast(nextReview(updated) ? "Revisão concluída." : "Ciclo de revisões completo.");
  };

  return (
    <div className="grid gap-6">
      {header}

      {completed && completedTopic && (
        <ReviewFeedbackPrompt topic={completedTopic} stage={completed.stage} onClose={() => setCompleted(null)} />
      )}

      {nothingDue && (
        <Card flush>
          <EmptyState title="Tudo em dia">
            {pending.length > 0 ? (
              "Nenhuma revisão para hoje. As próximas estão abaixo."
            ) : (
              <>
                Nenhuma revisão agendada. Ao concluir um tópico em{" "}
                <Link href="/materias" className={linkStyles}>
                  Matérias
                </Link>
                , as revisões aparecem aqui.
              </>
            )}
          </EmptyState>
        </Card>
      )}

      {sections
        .filter(([, items]) => items.length > 0)
        .map(([title, items]) => (
          <Card key={title} flush>
            <CardHeader flush title={title}>
              <span className="text-[13px] text-muted tabular-nums">
                {title === "Futuras" ? groups.later.length : items.length}
              </span>
            </CardHeader>
            <ul>
              {items.map(({ topicId, review }) => {
                const topic = findTopic(topics, topicId);
                const due = review.due <= today;
                return (
                  <ListRow
                    key={topicId}
                    title={topic?.name}
                    subtitle={
                      <span className="tabular-nums">
                        {topic && focusName(topic.areaId, topic.subjectId)} · Revisão {review.stage} de 4 ·{" "}
                        <DueLabel due={review.due} today={today} />
                        {review.reschedules?.length ? " · Reagendada" : ""}
                      </span>
                    }
                    end={
                      <>
                        <Button onClick={() => setOpenTopicId(topicId)} aria-label={`Opções da revisão de ${topic?.name}`}>
                          {due ? "Opções" : "Reagendar"}
                        </Button>
                        {due && (
                          <Button variant="primary" onClick={() => complete(topicId)}>
                            Concluir
                          </Button>
                        )}
                      </>
                    }
                  />
                );
              })}
            </ul>
            {title === "Futuras" && groups.later.length > LATER_PREVIEW && (
              <div className="border-t border-line px-4 py-3 md:px-5">
                <button type="button" onClick={() => setShowAllLater(!showAllLater)} className={linkStyles}>
                  {showAllLater ? "Mostrar menos" : `Mostrar todas (${groups.later.length})`}
                </button>
              </div>
            )}
          </Card>
        ))}

      <ReviewDrawer
        topic={findTopic(topics, openTopicId)}
        today={today}
        onClose={closeDrawer}
        onComplete={complete}
      />
    </div>
  );
}
