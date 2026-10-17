"use client";

import Link from "next/link";
import { Button, buttonStyles, linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DueLabel } from "@/components/ui/DueLabel";
import { ListRow } from "@/components/ui/ListRow";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { taskDetails, taskTitle } from "@/components/cronograma/task-format";
import { useStudyTopic } from "@/components/timer/use-study-topic";
import { addDays } from "@/lib/dates";
import { TASK_STATUS_LABELS, availableMinutes, missedTasks } from "@/lib/planner";
import { pendingReviews } from "@/lib/reviews";
import { formatDuration, secondsOn } from "@/lib/stats";
import { findTopic } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";

export function StudyTodayCard({ today }: { today: string }) {
  const tasks = useStudyStore((state) => state.tasks);
  const sessions = useStudyStore((state) => state.sessions);
  const topics = useStudyStore((state) => state.topics);
  const progress = useStudyStore((state) => state.progress);
  const planner = useStudyStore((state) => state.planner);
  const onboarding = useStudyStore((state) => state.onboarding);
  const studyTopic = useStudyTopic();

  const todayTasks = tasks.filter((task) => task.date === today && task.status !== "adiada");
  const plannedSeconds = todayTasks.reduce((sum, task) => sum + task.minutes * 60, 0);
  const studiedSeconds = secondsOn(sessions, today);
  const doneCount = todayTasks.filter((task) => task.status === "concluida").length;
  const next = todayTasks.find((task) => task.status === "iniciada") ?? todayTasks.find((task) => task.status === "planejada");
  const missed = missedTasks(tasks, today).length;
  const upcomingReview = pendingReviews(progress, topics).find(({ review }) => review.due <= addDays(today, 1));
  const reviewTopic = upcomingReview && findTopic(topics, upcomingReview.topicId);

  return (
    <Card>
      <CardHeader title="Estudar hoje">
        {todayTasks.length > 0 && (
          <span className="text-[13px] text-muted tabular-nums">
            {doneCount} de {todayTasks.length} {todayTasks.length === 1 ? "tarefa concluída" : "tarefas concluídas"}
          </span>
        )}
      </CardHeader>

      {todayTasks.length > 0 ? (
        <>
          <div className="mb-1 flex flex-wrap justify-between gap-2 text-[13px] text-muted tabular-nums">
            <span>
              {formatDuration(studiedSeconds)} estudados de {formatDuration(plannedSeconds)} planejados
            </span>
            {studiedSeconds >= plannedSeconds && <span className="text-success">Plano de hoje cumprido. Se quiser, siga estudando.</span>}
          </div>
          <ProgressBar value={studiedSeconds / plannedSeconds} label="Progresso do plano de hoje" />
          <ul className="mt-3">
            {todayTasks.map((task) => (
              <ListRow
                key={task.id}
                compact
                title={<span className={task.status === "concluida" ? "text-muted line-through" : ""}>{taskTitle(task, topics)}</span>}
                subtitle={
                  <span className="tabular-nums">
                    {taskDetails(task)}
                    {task.status !== "planejada" && ` · ${TASK_STATUS_LABELS[task.status]}`}
                  </span>
                }
                end={
                  task.status !== "concluida" && (
                    <Button onClick={() => studyTopic(task.topicId, task)} aria-label={`Começar ${taskTitle(task, topics)}`}>
                      Começar
                    </Button>
                  )
                }
              />
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {next ? (
              <Button variant="primary" onClick={() => studyTopic(next.topicId, next)}>
                Começar a estudar
              </Button>
            ) : (
              <Link href="/timer" className={buttonStyles("primary")}>
                Estudar mais
              </Link>
            )}
            <Link href="/cronograma" className={linkStyles}>
              Adiar ou reorganizar
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            {availableMinutes(planner, today) === 0 && onboarding.status === "concluido"
              ? "Hoje é dia livre no seu plano. Se quiser estudar mesmo assim, o timer está pronto."
              : "Nada planejado para hoje. Monte um plano que cabe na sua rotina ou estude por conta própria."}
          </p>
          <div className="flex flex-wrap gap-2">
            {onboarding.status === "pendente" ? (
              <Link href="/comecar" className={buttonStyles("primary")}>
                Montar meu cronograma
              </Link>
            ) : (
              <Link href="/cronograma" className={buttonStyles("primary")}>
                Abrir cronograma
              </Link>
            )}
            <Link href="/timer" className={buttonStyles()}>
              Estudar sem plano
            </Link>
          </div>
        </>
      )}

      {(missed > 0 || reviewTopic) && (
        <div className="mt-4 grid gap-1 border-t border-line pt-3 text-[13px] text-muted">
          {reviewTopic && upcomingReview && (
            <p>
              Próxima revisão: <span className="text-text">{reviewTopic.name}</span> ·{" "}
              <DueLabel due={upcomingReview.review.due} today={today} />.{" "}
              <Link href="/revisoes" className={linkStyles}>
                Ver revisões
              </Link>
            </p>
          )}
          {missed > 0 && (
            <p>
              {missed} {missed === 1 ? "tarefa ficou" : "tarefas ficaram"} para depois.{" "}
              <Link href="/cronograma" className={linkStyles}>
                Reorganizar
              </Link>
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
