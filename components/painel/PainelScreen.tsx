"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { addDays, mondayOf, toDateKey } from "@/lib/dates";
import { useHydrated } from "@/store/study-store";
import { AreaCard } from "./AreaCard";
import { StudyTodayCard } from "./StudyTodayCard";
import { UpcomingReviews } from "./UpcomingReviews";
import { WeekCard } from "./WeekCard";

const longDate = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

export function PainelScreen() {
  const hydrated = useHydrated();
  const [weekOffset, setWeekOffset] = useState(0);

  if (!hydrated) {
    return (
      <div className="grid gap-5">
        <PageHeader title="Painel" subtitle={" "} />
        <Skeleton className="h-40" />
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-[420px]" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const today = toDateKey(now);
  const monday = addDays(mondayOf(today), weekOffset * 7);

  return (
    <div className="grid gap-5">
      <PageHeader title="Painel" subtitle={longDate.format(now)} />
      <StudyTodayCard today={today} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <WeekCard
          today={today}
          monday={monday}
          onPreviousWeek={() => setWeekOffset(weekOffset - 1)}
          onNextWeek={weekOffset < 0 ? () => setWeekOffset(weekOffset + 1) : undefined}
        />
        <div className="grid gap-5">
          <AreaCard monday={monday} />
          <UpcomingReviews today={today} />
        </div>
      </div>
    </div>
  );
}
