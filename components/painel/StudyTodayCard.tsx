"use client";

import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import { TaskDrawer } from "@/components/cronograma/TaskDrawer";
import { isMastered, taskDetails, taskStatusLabel, taskTitle } from "@/components/cronograma/task-format";
import { DueLabel } from "@/components/ui/DueLabel";
import { useStudyTopic } from "@/components/timer/use-study-topic";
import { addDays } from "@/lib/dates";
import { isStudyDay } from "@/lib/planner";
import { pendingReviews } from "@/lib/reviews";
import { formatDuration, secondsOn } from "@/lib/stats";
import { findTopic } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";

// Botões da faixa azul: branco com contorno e carimbo, ou só texto.
const solidButton =
  "inline-flex h-11 items-center justify-center rounded-full border-2 border-hero-edge bg-white px-6 font-semibold whitespace-nowrap text-action shadow-[3px_3px_0_var(--hero-edge)] transition-transform hover:-translate-x-px hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";
const ghostButton = "inline-flex h-11 items-center px-3 font-semibold whitespace-nowrap text-white/80 hover:text-white";

function Band({ children }: { children: ReactNode }) {
  return (
    <section
      aria-label="Estudar hoje"
      className="grid gap-6 rounded-[18px] border-2 border-edge bg-hero p-[22px] text-white shadow-card md:rounded-[22px] md:p-8"
    >
      {children}
    </section>
  );
}

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

  const header = (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <span className="text-xs font-semibold tracking-[0.08em] uppercase opacity-65">Estudar hoje</span>
      {todayTasks.length > 0 && (
        <span className="text-[13px] tabular-nums opacity-70">
          {doneCount} de {todayTasks.length} {todayTasks.length === 1 ? "dominada" : "dominadas"}
        </span>
      )}
    </div>
  );

  const reviewLine = reviewTopic && upcomingReview && (
    <p className="text-[13px] opacity-75">
      Próxima revisão: <span className="font-semibold">{reviewTopic.name}</span> ·{" "}
      <DueLabel due={upcomingReview.review.due} today={today} />.{" "}
      <Link href="/revisoes" className="font-semibold underline underline-offset-3">
        Ver revisões
      </Link>
    </p>
  );

  if (todayTasks.length === 0) {
    return (
      <Band>
        {header}
        <p className="max-w-[560px] font-heading text-[22px] leading-tight font-bold font-stretch-112% md:text-[26px]">
          {onboarding.status === "concluido" && !isStudyDay(planner, today)
            ? "Hoje não é dia de estudo no seu plano."
            : "Nada organizado para hoje."}
        </p>
        <p className="-mt-3 opacity-75">Monte a semana com as suas matérias ou estude por conta própria.</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={onboarding.status === "pendente" ? "/comecar" : "/cronograma"} className={solidButton}>
            {onboarding.status === "pendente" ? "Organizar minha semana" : "Abrir cronograma"}
          </Link>
          <Link href="/timer" className={ghostButton}>
            Estudar sem plano
          </Link>
        </div>
        {reviewLine}
      </Band>
    );
  }

  return (
    <Band>
      {header}
      <ul className="grid gap-2">
        {todayTasks.map((task, index) => {
          const done = task.status === "concluida";
          const title = taskTitle(task, topics);
          return (
            <li key={task.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <div className="min-w-0">
                <span
                  className={`block font-heading text-[24px] leading-tight font-bold wrap-anywhere font-stretch-115% md:text-[30px] ${
                    index > 0 || done ? "text-hero-soft" : ""
                  } ${isMastered(task) ? "line-through opacity-70" : ""}`}
                >
                  {title}
                </span>
                <span className="text-[13px] tabular-nums opacity-70">
                  {taskDetails(task)}
                  {task.status !== "planejada" && ` · ${taskStatusLabel(task)}`}
                </span>
              </div>
              {!done && (
                <button
                  type="button"
                  onClick={() => setOpenTaskId(task.id)}
                  aria-label={`Dominou ${title}?`}
                  className="h-9 rounded-full border-2 border-white/40 px-4 text-sm font-semibold hover:border-white"
                >
                  Dominei?
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="opacity-75 tabular-nums">
        {studiedSeconds > 0 && `${formatDuration(studiedSeconds)} estudados hoje · `}
        Estude o tempo que quiser, até sentir que dominou. O que não der passa para o próximo dia.
      </p>
      <div className="flex flex-wrap items-center gap-2.5">
        {next ? (
          <button type="button" onClick={() => studyTopic(next.topicId, next)} className={solidButton}>
            {next.status === "iniciada" ? "Continuar estudando" : "Começar a estudar"}
          </button>
        ) : (
          <Link href="/timer" className={solidButton}>
            Estudar mais
          </Link>
        )}
        <Link href="/cronograma" className={ghostButton}>
          Ver a semana
        </Link>
      </div>
      {reviewLine}

      <TaskDrawer task={tasks.find((task) => task.id === openTaskId)} today={today} onClose={closeTask} />
    </Band>
  );
}
