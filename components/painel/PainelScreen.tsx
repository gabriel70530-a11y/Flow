"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { addDays, mondayOf, toDateKey } from "@/lib/dates";
import { FREE_HISTORY_WEEKS } from "@/lib/plan";
import { useProAccess } from "@/store/pro";
import { useHydrated } from "@/store/study-store";
import { AreaCard } from "./AreaCard";
import { PrepCard } from "./PrepCard";
import { StudyTodayCard } from "./StudyTodayCard";
import { SummaryCard } from "./SummaryCard";
import { UpcomingReviews } from "./UpcomingReviews";
import { WeekCard } from "./WeekCard";

const longDate = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

function greeting(hour: number): string {
  if (hour < 5 || hour >= 18) return "Boa noite";
  return hour < 12 ? "Bom dia" : "Boa tarde";
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);
}

export function PainelScreen() {
  const hydrated = useHydrated();
  const [weekOffset, setWeekOffset] = useState(0);
  const pro = useProAccess();

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Painel" subtitle={" "} />
        <Skeleton className="h-40" />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-[420px]" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const today = toDateKey(now);
  const monday = addDays(mondayOf(today), weekOffset * 7);
  const locked = !pro && -weekOffset >= FREE_HISTORY_WEEKS;

  return (
    <div className="grid gap-6">
      <PageHeader title={greeting(now.getHours())} subtitle={capitalize(longDate.format(now))} />
      <StudyTodayCard today={today} />
      {/* No celular, a preparação vem logo depois do dia; no computador, abre a coluna da direita. */}
      <PrepCard today={today} className="lg:hidden" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <WeekCard
            today={today}
            monday={monday}
            onPreviousWeek={() => setWeekOffset(weekOffset - 1)}
            onNextWeek={weekOffset < 0 ? () => setWeekOffset(weekOffset + 1) : undefined}
            locked={locked}
          />
          {!locked && <SummaryCard today={today} monday={monday} />}
        </div>
        <div className="grid gap-6">
          <PrepCard today={today} className="hidden lg:block" />
          {!locked && <AreaCard monday={monday} />}
          <UpcomingReviews today={today} />
        </div>
      </div>
    </div>
  );
}
