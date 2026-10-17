"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DueLabel } from "@/components/ui/DueLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListRow } from "@/components/ui/ListRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { useStudyTopic } from "@/components/timer/use-study-topic";
import { toDateKey } from "@/lib/dates";
import { groupReviews, nextReview, pendingReviews, type PendingReview } from "@/lib/reviews";
import { findArea } from "@/lib/syllabus";
import { findTopic } from "@/lib/topics";
import { useHydrated, useStudyStore } from "@/store/study-store";

export function RevisoesScreen() {
  const hydrated = useHydrated();
  const progress = useStudyStore((state) => state.progress);
  const topics = useStudyStore((state) => state.topics);
  const completeReview = useStudyStore((state) => state.completeReview);
  const studyTopic = useStudyTopic();

  const header = (
    <PageHeader title="Revisões" subtitle="Agendadas para 1, 7, 15 e 30 dias depois de concluir um tópico." />
  );

  if (!hydrated) {
    return (
      <div className="grid gap-5">
        {header}
        <Skeleton className="h-64" />
      </div>
    );
  }

  const today = toDateKey(new Date());
  const groups = groupReviews(pendingReviews(progress, topics), today);
  const sections: [string, PendingReview[]][] = [
    ["Atrasadas", groups.late],
    ["Hoje", groups.today],
    ["Próximos 7 dias", groups.upcoming],
  ];
  const nothingDue = groups.late.length + groups.today.length === 0;

  const complete = (topicId: string) => {
    const updated = completeReview(topicId);
    showToast(nextReview(updated) ? "Revisão concluída." : "Ciclo de revisões completo.");
  };

  return (
    <div className="grid gap-5">
      {header}

      {nothingDue && (
        <Card flush>
          <EmptyState title="Tudo em dia">Nenhuma revisão para hoje.</EmptyState>
        </Card>
      )}

      {sections
        .filter(([, items]) => items.length > 0)
        .map(([title, items]) => (
          <Card key={title} flush>
            <CardHeader flush title={title}>
              <span className="text-[13px] text-muted tabular-nums">{items.length}</span>
            </CardHeader>
            <ul>
              {items.map(({ topicId, review }) => {
                const topic = findTopic(topics, topicId);
                return (
                  <ListRow
                    key={topicId}
                    title={topic?.name}
                    subtitle={
                      <span className="tabular-nums">
                        {topic && findArea(topic.areaId).name} · Revisão {review.stage} de 4 · <DueLabel due={review.due} today={today} />
                      </span>
                    }
                    end={
                      review.due <= today && (
                        <>
                          <Button onClick={() => studyTopic(topicId)}>Estudar</Button>
                          <Button variant="primary" onClick={() => complete(topicId)}>
                            Concluir
                          </Button>
                        </>
                      )
                    }
                  />
                );
              })}
            </ul>
          </Card>
        ))}
    </div>
  );
}
