"use client";

import { useCallback, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { DueLabel } from "@/components/ui/DueLabel";
import { ListRow } from "@/components/ui/ListRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { toDateKey } from "@/lib/dates";
import { nextReview, progressOf } from "@/lib/reviews";
import { AREAS, TOPICS, findTopic, type AreaId } from "@/lib/syllabus";
import { useHydrated, useStudyStore } from "@/store/study-store";
import { TopicDrawer } from "./TopicDrawer";

const HINT = "Clique em um tópico para atualizar.";

export function MateriasScreen() {
  const hydrated = useHydrated();
  const progress = useStudyStore((state) => state.progress);
  const [areaFilter, setAreaFilter] = useState<AreaId | "all">("all");
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const closeDrawer = useCallback(() => setOpenTopicId(null), []);

  if (!hydrated) {
    return (
      <div className="grid gap-5">
        <PageHeader title="Matérias" subtitle={HINT} />
        <Skeleton className="h-[34px] w-2/3" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const today = toDateKey(new Date());
  const concluded = TOPICS.filter((topic) => progressOf(progress, topic.id).status === "concluido").length;
  const filters = [{ id: "all" as const, name: "Todas" }, ...AREAS];

  return (
    <div className="grid gap-5">
      <PageHeader title="Matérias" subtitle={`${concluded} de ${TOPICS.length} tópicos concluídos. ${HINT}`} />

      <div className="flex max-w-full gap-1.5 overflow-x-auto">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-pressed={areaFilter === filter.id}
            onClick={() => setAreaFilter(filter.id)}
            className="h-[34px] rounded-full bg-surface px-3.5 text-sm font-semibold whitespace-nowrap text-muted shadow-card aria-pressed:bg-accent-soft aria-pressed:text-accent aria-pressed:shadow-none"
          >
            {filter.name}
          </button>
        ))}
      </div>

      {AREAS.filter((area) => areaFilter === "all" || area.id === areaFilter).map((area) => {
        const topics = TOPICS.filter((topic) => topic.area === area);
        const done = topics.filter((topic) => progressOf(progress, topic.id).status === "concluido").length;
        return (
          <Card key={area.id} flush>
            <CardHeader flush title={area.name} className="border-b border-line">
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-muted tabular-nums">
                  {done}/{topics.length}
                </span>
                <ProgressBar thin value={done / topics.length} className="hidden w-[120px] md:block" />
              </div>
            </CardHeader>
            <ul>
              {topics.map((topic) => {
                const topicProgress = progressOf(progress, topic.id);
                const review = nextReview(topicProgress);
                return (
                  <ListRow
                    key={topic.id}
                    onClick={() => setOpenTopicId(topic.id)}
                    title={topic.name}
                    subtitle={
                      review && (
                        <>
                          Revisão {review.stage}: <DueLabel due={review.due} today={today} />
                        </>
                      )
                    }
                    end={
                      <>
                        <span className="hidden w-16 text-right text-[13px] text-muted tabular-nums md:inline">
                          {topicProgress.mastery > 0 && `Nível ${topicProgress.mastery}`}
                        </span>
                        <Pill status={topicProgress.status} />
                      </>
                    }
                  />
                );
              })}
            </ul>
          </Card>
        );
      })}

      <TopicDrawer topic={openTopicId ? findTopic(openTopicId) : undefined} today={today} onClose={closeDrawer} />
    </div>
  );
}
