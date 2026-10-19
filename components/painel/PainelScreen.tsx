"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { mondayOf, shortDate, toDateKey } from "@/lib/dates";
import { daysUntil, nextExamDay } from "@/lib/exam";
import { useHydrated, useStudyStore } from "@/store/study-store";
import { PrepShortcuts } from "./PrepShortcuts";
import { RankCard } from "./RankCard";
import { StudyTodayCard } from "./StudyTodayCard";
import { UpcomingReviews } from "./UpcomingReviews";
import { CompactWeekCard } from "./WeekCard";

const weekdayName = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });

function greeting(hour: number): string {
  if (hour < 5 || hour >= 18) return "Boa noite";
  return hour < 12 ? "Bom dia" : "Boa tarde";
}

function shortWeekday(date: Date): string {
  const name = weekdayName.format(date).replace("-feira", "");
  return name.charAt(0).toLocaleUpperCase("pt-BR") + name.slice(1);
}

function Countdown({ today }: { today: string }) {
  const targetDate = useStudyStore((state) => state.planner.targetDate);
  const upcoming = nextExamDay(targetDate, today);
  if (!upcoming) return null;
  const remaining = daysUntil(upcoming.date, today);
  const exam = upcoming.day === 1 ? "o Enem" : "o 2º dia do Enem";
  if (remaining === 0) return <> · <strong className="font-semibold text-text">hoje é o {upcoming.day}º dia do Enem</strong></>;
  return (
    <>
      {" "}
      · <strong className="font-semibold text-text tabular-nums">{remaining === 1 ? "falta 1 dia" : `faltam ${remaining} dias`}</strong> para {exam}
    </>
  );
}

export function PainelScreen() {
  const hydrated = useHydrated();
  const showStreak = useStudyStore((state) => state.showStreak);

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Painel" subtitle={" "} />
        <Skeleton className="h-40" />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Skeleton className="h-[260px]" />
          <Skeleton className="h-[260px]" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const today = toDateKey(now);

  return (
    <div className="grid gap-4 md:gap-6">
      <PageHeader
        title={greeting(now.getHours())}
        subtitle={
          <>
            <span className="tabular-nums">
              {shortWeekday(now)}, {shortDate(today)}
            </span>
            <Countdown today={today} />
          </>
        }
      />
      <StudyTodayCard today={today} />
      <PrepShortcuts />
      <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <CompactWeekCard today={today} monday={mondayOf(today)} />
        <div className="grid gap-4 md:gap-6">
          <UpcomingReviews today={today} />
          {showStreak && <RankCard />}
        </div>
      </div>
    </div>
  );
}
