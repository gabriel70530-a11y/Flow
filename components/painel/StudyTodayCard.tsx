"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Button, buttonStyles, linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DueLabel } from "@/components/ui/DueLabel";
import { ListRow } from "@/components/ui/ListRow";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TaskDrawer } from "@/components/cronograma/TaskDrawer";
import { isMastered, taskDetails, taskStatusLabel, taskTitle } from "@/components/cronograma/task-format";
import { useStudyTopic } from "@/components/timer/use-study-topic";
import { addDays } from "@/lib/dates";
import { isStudyDay } from "@/lib/planner";
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
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const closeTask = useCallback(() => setOpenTaskId(null), []);

  const todayTasks = tasks.filter((task) => task.date === today && task.status !== "adiada");
  const studiedSeconds = secondsOn(sessions, today);
  const doneCount = todayTasks.filter(isMastered).length;
  const next = todayTasks.find((task) => task.status === "iniciada") ?? todayTasks.find((task) => task.status === "planejada");
  const upcomingReview = pendingReviews(progress, topics).find(({ review }) => review.due <= addDays(today, 1));
  const reviewTopic = upcomingReview && findTopic(topics, upcomingReview.topicId);

  return (
    <Card>
      <CardHeader title="Estudar hoje">
        {todayTasks.length > 0 && (
          <span className="text-[13px] text-muted tabular-nums">
            {doneCount} de {todayTasks.length} {todayTasks.length === 1 ? "matéria dominada" : "matérias dominadas"}
          </span>
        )}
      </CardHeader>

      {todayTasks.length > 0 ? (
        <>
          <ProgressBar value={doneCount / todayTasks.length} label="Matérias de hoje dominadas" />
          <p className="mt-2 text-[13px] text-muted tabular-nums">
            {studiedSeconds > 0 ? `${formatDuration(studiedSeconds)} estudados hoje. ` : ""}
            Estude cada matéria o tempo que quiser, até sentir que dominou. Não precisa fazer as duas: o que não der passa para o
            próximo dia.
          </p>
          <ul className="mt-3">
            {todayTasks.map((task) => {
              const done = task.status === "concluida";
              return (
                <ListRow
                  key={task.id}
                  compact
                  title={<span className={isMastered(task) ? "text-muted line-through" : done ? "text-muted" : ""}>{taskTitle(task, topics)}</span>}
                  subtitle={
                    <span className="tabular-nums">
                      {taskDetails(task)}
                      {task.status !== "planejada" && ` · ${taskStatusLabel(task)}`}
                    </span>
                  }
                  end={
                    !done && (
                      <>
                        <Button onClick={() => setOpenTaskId(task.id)} aria-label={`Dominou ${taskTitle(task, topics)}?`}>
                          Dominei?
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => studyTopic(task.topicId, task)}
                          aria-label={`Estudar ${taskTitle(task, topics)}`}
                        >
                          {task.status === "iniciada" ? "Continuar" : "Começar"}
                        </Button>
                      </>
                    )
                  }
                />
              );
            })}
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
              Ver a semana
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            {onboarding.status === "concluido" && !isStudyDay(planner, today)
              ? "Hoje não é dia de estudo no seu plano. Se quiser estudar mesmo assim, o timer está pronto."
              : "Nada organizado para hoje. Monte a semana com as suas matérias ou estude por conta própria."}
          </p>
          <div className="flex flex-wrap gap-2">
            {onboarding.status === "pendente" ? (
              <Link href="/comecar" className={buttonStyles("primary")}>
                Organizar minha semana
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

      {reviewTopic && upcomingReview && (
        <p className="mt-4 border-t border-line pt-3 text-[13px] text-muted">
          Próxima revisão: <span className="text-text">{reviewTopic.name}</span> ·{" "}
          <DueLabel due={upcomingReview.review.due} today={today} />.{" "}
          <Link href="/revisoes" className={linkStyles}>
            Ver revisões
          </Link>
        </p>
      )}

      <TaskDrawer task={tasks.find((task) => task.id === openTaskId)} today={today} onClose={closeTask} />
    </Card>
  );
}
