"use client";

import Link from "next/link";
import { linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DueLabel } from "@/components/ui/DueLabel";
import { ListRow } from "@/components/ui/ListRow";
import { pendingReviews } from "@/lib/reviews";
import { focusName } from "@/lib/syllabus";
import { findTopic } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";

export function UpcomingReviews({ today }: { today: string }) {
  const progress = useStudyStore((state) => state.progress);
  const topics = useStudyStore((state) => state.topics);
  const upcoming = pendingReviews(progress, topics).slice(0, 4);

  return (
    <Card>
      <CardHeader title="Próximas revisões">
        <Link href="/revisoes" className={`${linkStyles} shrink-0 whitespace-nowrap`}>
          Ver todas
        </Link>
      </CardHeader>
      <ul>
        {upcoming.length === 0 ? (
          <li className="text-[13px] text-muted">Nenhuma revisão agendada.</li>
        ) : (
          upcoming.map(({ topicId, review }) => {
            const topic = findTopic(topics, topicId);
            return (
              <ListRow
                key={topicId}
                compact
                title={topic?.name}
                subtitle={topic && focusName(topic.areaId, topic.subjectId)}
                end={
                  <span className="text-[13px] text-muted tabular-nums">
                    <DueLabel due={review.due} today={today} />
                  </span>
                }
              />
            );
          })
        )}
      </ul>
    </Card>
  );
}
