"use client";

import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import { TaskDrawer } from "@/components/cronograma/TaskDrawer";
import { isMastered, taskDetails, taskStatusLabel, taskTitle } from "@/components/cronograma/task-format";
import { useStudyTopic } from "@/components/timer/use-study-topic";
import { showToast } from "@/components/ui/Toast";
import { addDays, dayLabel } from "@/lib/dates";
import { isStudyDay } from "@/lib/planner";
import { dueMistakes } from "@/lib/mistakes";
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
      className="grid gap-5 rounded-[18px] border-2 border-edge bg-hero p-5 text-white shadow-card md:rounded-[22px] md:p-7"
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
  const mistakes = useStudyStore((state) => state.mistakes);
  const planner = useStudyStore((state) => state.planner);
  const onboarding = useStudyStore((state) => state.onboarding);
  const lightenToday = useStudyStore((state) => state.lightenToday);
  const studyTopic = useStudyTopic();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const closeTask = useCallback(() => setOpenTaskId(null), []);

  const todayTasks = tasks.filter((task) => task.date === today && task.status !== "adiada");
  const studiedSeconds = secondsOn(sessions, today);
  const doneCount = todayTasks.filter(isMastered).length;
  const next = todayTasks.find((task) => task.status === "iniciada") ?? todayTasks.find((task) => task.status === "planejada");
  const upcomingReview = pendingReviews(progress, topics).find(({ review }) => review.due <= addDays(today, 1));
  const reviewTopic = upcomingReview && findTopic(topics, upcomingReview.topicId);
  const openTasks = todayTasks.filter((task) => task.status === "planejada" || task.status === "iniciada");
  const canLighten = openTasks.length > 1 && openTasks.some((task, index) => index > 0 && task.status === "planejada");

  // Dia cansativo: fica uma matéria hoje e a outra passa para o próximo dia de estudo, sem culpa.
  const lighten = () => {
    const moved = lightenToday();
    const [first] = moved;
    if (!first) return;
    showToast(
      first.date
        ? `Dia leve. ${taskTitle(first, topics)} foi para ${dayLabel(first.date, today).toLowerCase()}.`
        : `Dia leve. ${taskTitle(first, topics)} ficou para outra semana.`,
    );
  };

  const header = (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <span className="text-xs font-semibold tracking-[0.08em] text-hero-soft uppercase">Estudar hoje</span>
      {todayTasks.length > 0 && (
        <span className="text-[13px] text-hero-soft tabular-nums">
          {doneCount} de {todayTasks.length} {todayTasks.length === 1 ? "dominada" : "dominadas"}
          {studiedSeconds > 0 && ` · ${formatDuration(studiedSeconds)} hoje`}
        </span>
      )}
    </div>
  );

  const mistakesDue = dueMistakes(mistakes, today).length;
  const reviewDue = upcomingReview?.review.due;
  const reviewLabel = !reviewDue ? "" : reviewDue < today ? "Revisão atrasada" : reviewDue === today ? "Revisão de hoje" : "Revisão de amanhã";
  const footer = (reviewTopic || mistakesDue > 0) && (
    <p className="text-[13px] text-hero-soft">
      {reviewTopic && (
        <>
          {reviewLabel}: <span className="font-semibold text-white">{reviewTopic.name}</span>
        </>
      )}
      {reviewTopic && mistakesDue > 0 && " · "}
      {mistakesDue > 0 && (mistakesDue === 1 ? "1 erro para rever" : `${mistakesDue} erros para rever`)}
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
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={onboarding.status === "pendente" ? "/comecar" : "/cronograma"} className={solidButton}>
            {onboarding.status === "pendente" ? "Organizar minha semana" : "Abrir cronograma"}
          </Link>
          <Link href="/timer" className={ghostButton}>
            Estudar sem plano
          </Link>
        </div>
        {footer}
      </Band>
    );
  }

  return (
    <Band>
      {header}
      <ul className="grid">
        {todayTasks.map((task) => {
          const done = task.status === "concluida";
          const title = taskTitle(task, topics);
          return (
            <li key={task.id} className="flex items-center gap-3 border-t border-white/15 py-3 first:border-t-0 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <span
                  className={`block font-heading text-[20px] leading-tight font-bold wrap-anywhere font-stretch-110% md:text-[24px] ${
                    isMastered(task) ? "line-through opacity-70" : ""
                  }`}
                >
                  {title}
                </span>
                <span className="text-[13px] text-hero-soft tabular-nums">
                  {taskDetails(task)}
                  {task.status !== "planejada" && ` · ${taskStatusLabel(task)}`}
                </span>
              </div>
              {!done && (
                <button
                  type="button"
                  onClick={() => setOpenTaskId(task.id)}
                  aria-label={`Dominou ${title}?`}
                  className="h-[34px] shrink-0 rounded-full border-[1.5px] border-white/55 px-3.5 text-[13px] font-semibold hover:border-white"
                >
                  Dominei?
                </button>
              )}
            </li>
          );
        })}
      </ul>
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
        {canLighten && (
          <button type="button" onClick={lighten} className={ghostButton} title="Fica só uma matéria hoje; a outra passa para o próximo dia de estudo.">
            Dia leve
          </button>
        )}
      </div>
      {footer}

      <TaskDrawer task={tasks.find((task) => task.id === openTaskId)} today={today} onClose={closeTask} />
    </Band>
  );
}
