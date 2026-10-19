"use client";

import { Ellipsis } from "lucide-react";
import { useCallback, useState } from "react";
import { Button, linkStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { DueLabel } from "@/components/ui/DueLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProNotice } from "@/components/ui/ProNotice";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { toDateKey } from "@/lib/dates";
import { groupReviews, nextReview, pendingReviews, progressOf, shortReviewLabel, type PendingReview } from "@/lib/reviews";
import { focusName } from "@/lib/syllabus";
import { findTopic } from "@/lib/topics";
import { useProAccess } from "@/store/pro";
import { useHydrated, useStudyStore } from "@/store/study-store";
import { ManualReviewForm } from "./ManualReviewForm";
import { ReviewDrawer } from "./ReviewDrawer";
import { ReviewFeedbackPrompt } from "./ReviewFeedbackPrompt";
import { RevisoesTabs } from "./RevisoesTabs";
import { ScheduleReviewsForm } from "./ScheduleReviewsForm";

const LATER_PREVIEW = 8;

const SCHEDULE_OPTIONS: { value: "estudados" | "manual"; label: string }[] = [
  { value: "estudados", label: "O que já estudei" },
  { value: "manual", label: "Uma data" },
];

export function RevisoesScreen() {
  const hydrated = useHydrated();
  const progress = useStudyStore((state) => state.progress);
  const topics = useStudyStore((state) => state.topics);
  const completeReview = useStudyStore((state) => state.completeReview);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<{ topicId: string; stage: number } | null>(null);
  const [showAllLater, setShowAllLater] = useState(false);
  const [scheduling, setScheduling] = useState<"manual" | "estudados" | null>(null);
  const pro = useProAccess();
  const closeDrawer = useCallback(() => setOpenTopicId(null), []);

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Revisões" subtitle={" "} />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const today = toDateKey(new Date());
  const pending = pendingReviews(progress, topics);
  const groups = groupReviews(pending, today);
  const dueCount = groups.late.length + groups.today.length;
  const subtitle =
    pending.length === 0
      ? "Nenhuma revisão agendada"
      : dueCount === 0
        ? "Tudo em dia"
        : `${dueCount} para hoje${groups.upcoming.length ? `, ${groups.upcoming.length} nos próximos dias` : ""}`;
  const later = showAllLater ? groups.later : groups.later.slice(0, LATER_PREVIEW);
  const sections: [string, PendingReview[]][] = [
    ["Atrasadas", groups.late],
    ["Hoje", groups.today],
    ["Próximos 7 dias", groups.upcoming],
    ["Futuras", later],
  ];
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
      <PageHeader title="Revisões" subtitle={subtitle} />
      <RevisoesTabs current="/revisoes" />

      <div>
        <Button variant="primary" size="lg" onClick={() => setScheduling(pro ? "estudados" : "manual")}>
          {pro ? "Agendar revisões" : "Agendar revisão"}
        </Button>
      </div>

      {completed && completedTopic && (
        <ReviewFeedbackPrompt topic={completedTopic} stage={completed.stage} onClose={() => setCompleted(null)} />
      )}

      {pending.length === 0 && (
        <Card flush>
          <EmptyState title="Nenhuma revisão agendada">Agende o que você já estudou.</EmptyState>
        </Card>
      )}

      {sections
        .filter(([, items]) => items.length > 0)
        .map(([title, items]) => (
          <Card key={title}>
            <p className={`mb-1 text-[13px] font-bold ${title === "Atrasadas" ? "text-danger" : "text-muted"}`}>
              {title}
              {title === "Futuras" && groups.later.length > LATER_PREVIEW && ` · ${groups.later.length}`}
            </p>
            <ul>
              {items.map(({ topicId, review }) => {
                const topic = findTopic(topics, topicId);
                const due = review.due <= today;
                return (
                  <li key={topicId} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold wrap-anywhere">{topic?.name}</div>
                      <div className="text-[13px] text-muted tabular-nums">
                        {topic && focusName(topic.areaId, topic.subjectId)} · {shortReviewLabel(review)}
                        {review.due < today && (
                          <span className="text-danger">
                            {" "}
                            · <DueLabel due={review.due} today={today} />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {due ? (
                        <Button onClick={() => complete(topicId)}>Concluir</Button>
                      ) : (
                        <span className="text-[13px] text-muted tabular-nums">
                          <DueLabel due={review.due} today={today} />
                        </span>
                      )}
                      <IconButton onClick={() => setOpenTopicId(topicId)} aria-label={`Opções da revisão de ${topic?.name}`} className="size-9">
                        <Ellipsis size={18} aria-hidden />
                      </IconButton>
                    </div>
                  </li>
                );
              })}
            </ul>
            {title === "Futuras" && groups.later.length > LATER_PREVIEW && (
              <button type="button" onClick={() => setShowAllLater(!showAllLater)} className={`${linkStyles} mt-3`}>
                {showAllLater ? "Mostrar menos" : `Mostrar todas (${groups.later.length})`}
              </button>
            )}
          </Card>
        ))}

      <Drawer open={scheduling === "estudados"} onClose={() => setScheduling(null)} eyebrow="Revisões" title="Agendar revisões">
        {scheduling === "estudados" && (
          <Segmented className="mb-5" options={SCHEDULE_OPTIONS} value="estudados" onChange={setScheduling} />
        )}
        {scheduling === "estudados" && (
          <ScheduleReviewsForm
            onDone={(count) => {
              setScheduling(null);
              showToast(count === 1 ? "Revisões agendadas para 1 tópico." : `Revisões agendadas para ${count} tópicos.`);
            }}
          />
        )}
      </Drawer>

      <Drawer
        open={scheduling === "manual"}
        onClose={() => setScheduling(null)}
        eyebrow="Revisões"
        title={pro ? "Agendar revisões" : "Agendar revisão"}
      >
        {scheduling === "manual" && (
          <div className="grid gap-5">
            {pro && <Segmented options={SCHEDULE_OPTIONS} value="manual" onChange={setScheduling} />}
            <ManualReviewForm
              today={today}
              onDone={(message) => {
                setScheduling(null);
                showToast(message);
              }}
            />
            {!pro && (
              <ProNotice title="Deixe o Flow agendar por você com o Pro">
                Ao concluir um tópico, as 4 revisões (amanhã, 7, 15 e 30 dias) entram sozinhas, no tempo certo para não esquecer.
              </ProNotice>
            )}
          </div>
        )}
      </Drawer>

      <ReviewDrawer
        topic={findTopic(topics, openTopicId)}
        today={today}
        onClose={closeDrawer}
        onComplete={complete}
      />
    </div>
  );
}
