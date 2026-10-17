"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { NumberInput } from "@/components/ui/NumberInput";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { shortDate } from "@/lib/dates";
import { formatHours, secondsByDay, studyStreak, weekDays } from "@/lib/stats";
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
  const goal = useStudyStore((state) => state.goal);
  const setGoal = useStudyStore((state) => state.setGoal);

  const days = weekDays(monday);
  const perDay = secondsByDay(sessions, days);
  const total = perDay.reduce((sum, seconds) => sum + seconds, 0);
  const dailyGoal = (goal * 3600) / 7;
  const scale = Math.max(dailyGoal * 1.25, ...perDay);
  const percent = Math.round((total / 3600 / goal) * 100);
  const streak = studyStreak(sessions, today);

  return (
    <Card>
      <CardHeader title={onNextWeek ? "Semana" : "Esta semana"}>
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
          {formatHours(total)}
        </strong>
        <span className="inline-flex items-center gap-1.5 text-muted">
          horas de
          <NumberInput
            value={goal}
            min={1}
            max={100}
            onCommit={setGoal}
            aria-label="Meta semanal em horas"
            className="h-[30px] w-16"
          />
          h
        </span>
      </div>
      <ProgressBar value={percent / 100} label="Progresso da meta semanal" className="mt-3.5" />
      <div className="mt-2 flex flex-wrap justify-between gap-3 text-[13px] text-muted tabular-nums">
        <span>{percent}% da meta</span>
        {streak > 0 && (
          <span>
            {streak} {streak === 1 ? "dia seguido" : "dias seguidos"} estudando
          </span>
        )}
      </div>

      <div className="relative mt-7 grid h-[210px] grid-cols-7 items-end gap-1.5 md:gap-3">
        {days.map((date, index) => {
          const seconds = perDay[index];
          return (
            <div key={date} className="flex h-full flex-col items-center justify-end gap-2">
              <span className="h-4 text-xs leading-4 text-muted tabular-nums">
                {seconds > 0 && `${formatHours(seconds)}h`}
              </span>
              <div
                className={`w-full max-w-11 rounded-t-md rounded-b-[2px] transition-[height] duration-300 ${seconds >= dailyGoal ? "bg-accent" : "bg-bar"}`}
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
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted opacity-70"
          style={{ bottom: BAR_BASELINE + (dailyGoal / scale) * CHART_HEIGHT }}
        >
          <span className="absolute right-0 bottom-1 bg-surface pl-1.5 text-xs text-muted tabular-nums">
            Meta diária {formatHours(dailyGoal)}h
          </span>
        </div>
      </div>
    </Card>
  );
}
