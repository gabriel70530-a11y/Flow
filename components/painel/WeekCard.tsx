"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { inputStyles } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { NumberInput } from "@/components/ui/NumberInput";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { shortDate } from "@/lib/dates";
import {
  GOAL_LIMITS,
  GOAL_UNITS,
  formatHours,
  goalProgress,
  secondsByDay,
  studyStreak,
  weekDays,
  type GoalType,
} from "@/lib/stats";
import { useStudyStore } from "@/store/study-store";

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const CHART_HEIGHT = 140;
// Altura do rótulo do dia (18px) mais o gap (8px): a linha da meta parte da base das barras.
const BAR_BASELINE = 26;

interface WeekCardProps {
  today: string;
  monday: string;
  onPreviousWeek: () => void;
  onNextWeek?: () => void;
}

export function WeekCard({ today, monday, onPreviousWeek, onNextWeek }: WeekCardProps) {
  const sessions = useStudyStore((state) => state.sessions);
  const progress = useStudyStore((state) => state.progress);
  const goal = useStudyStore((state) => state.goal);
  const showStreak = useStudyStore((state) => state.showStreak);
  const setGoal = useStudyStore((state) => state.setGoal);

  const days = weekDays(monday);
  const perDay = secondsByDay(sessions, days);
  const total = perDay.reduce((sum, seconds) => sum + seconds, 0);
  const inHours = goal.type === "horas";
  // A meta diária e a linha tracejada só existem quando a meta é em horas.
  const dailyGoal = inHours ? (goal.value * 3600) / 7 : 0;
  const scale = Math.max(dailyGoal * 1.25, ...perDay, 3600);
  const { done, target } = goalProgress(goal, sessions, progress, days[0], days[6]);
  const percent = Math.round((done / target) * 100);
  const streak = studyStreak(sessions, today);
  const currentWeek = !onNextWeek;

  return (
    <Card>
      <CardHeader title={currentWeek ? "Esta semana" : "Semana"}>
        <div className="flex items-center gap-1">
          <span className="text-[13px] text-muted tabular-nums">
            {shortDate(days[0])} – {shortDate(days[6])}
          </span>
          <IconButton aria-label="Semana anterior" onClick={onPreviousWeek}>
            <ChevronLeft size={18} strokeWidth={2.2} aria-hidden />
          </IconButton>
          <IconButton aria-label="Próxima semana" disabled={!onNextWeek} onClick={onNextWeek}>
            <ChevronRight size={18} strokeWidth={2.2} aria-hidden />
          </IconButton>
        </div>
      </CardHeader>

      <div className="flex flex-wrap items-baseline gap-2">
        <strong className="font-heading text-5xl leading-none font-extrabold tracking-[-0.01em] font-stretch-120% italic tabular-nums">
          {inHours ? formatHours(total) : done}
        </strong>
        <span className="inline-flex flex-wrap items-center gap-1.5 text-muted">
          de
          <NumberInput
            value={goal.value}
            min={1}
            max={GOAL_LIMITS[goal.type].max}
            onCommit={(value) => setGoal({ type: goal.type, value })}
            aria-label={`Meta semanal em ${GOAL_UNITS[goal.type].label}`}
            className="h-[30px] w-16"
          />
          <select
            value={goal.type}
            onChange={(event) => {
              const type = event.target.value as GoalType;
              setGoal({ type, value: GOAL_LIMITS[type].fallback });
            }}
            aria-label="Unidade da meta semanal"
            className={`${inputStyles} h-[30px] w-auto`}
          >
            {(Object.keys(GOAL_UNITS) as GoalType[]).map((type) => (
              <option key={type} value={type}>
                {GOAL_UNITS[type].label}
              </option>
            ))}
          </select>
        </span>
      </div>
      <ProgressBar value={done / target} label="Progresso da meta semanal" className="mt-3.5" />
      <div className="mt-2 flex flex-wrap justify-between gap-3 text-[13px] text-muted tabular-nums">
        <span>{percent}% da meta</span>
        {showStreak && streak > 0 && (
          <span>
            {streak} {streak === 1 ? "dia seguido" : "dias seguidos"} estudando
          </span>
        )}
      </div>

      {total === 0 && (
        <p className="mt-4 text-sm text-muted">
          {currentWeek ? "Nenhuma sessão registrada nesta semana ainda. " : "Nenhuma sessão registrada nesta semana. "}
          {currentWeek && (
            <>
              Use o{" "}
              <Link href="/timer" className={linkStyles}>
                Timer
              </Link>
              : o tempo de foco entra aqui sozinho.
            </>
          )}
        </p>
      )}

      <div className="relative mt-7 grid h-[210px] grid-cols-7 items-end gap-1.5 md:gap-3" role="img"
        aria-label={`Horas estudadas por dia: ${days.map((date, index) => `${WEEKDAY_LABELS[index]} ${formatHours(perDay[index])} h`).join(", ")}`}
      >
        {days.map((date, index) => {
          const seconds = perDay[index];
          return (
            <div key={date} className="flex h-full flex-col items-center justify-end gap-2">
              <span className="h-4 text-xs leading-4 text-muted tabular-nums">
                {seconds > 0 && `${formatHours(seconds)}h`}
              </span>
              <div
                className={`w-full max-w-11 rounded-t-md rounded-b-[2px] transition-[height] duration-300 ${inHours && seconds >= dailyGoal ? "bg-accent" : "bg-bar"}`}
                style={{ height: (seconds / scale) * CHART_HEIGHT }}
              />
              <span
                className={`h-[18px] text-[13px] leading-[18px] ${date === today ? "font-bold text-text" : "text-muted"}`}
              >
                {WEEKDAY_LABELS[index]}
              </span>
            </div>
          );
        })}
        {inHours && (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted opacity-70"
            style={{ bottom: BAR_BASELINE + (dailyGoal / scale) * CHART_HEIGHT }}
          >
            <span className="absolute right-0 bottom-1 bg-surface pl-1.5 text-xs text-muted tabular-nums">
              Meta diária {formatHours(dailyGoal)}h
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
