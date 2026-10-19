"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { addDays, mondayOf, toDateKey } from "@/lib/dates";
import { FREE_HISTORY_WEEKS } from "@/lib/plan";
import { useProAccess } from "@/store/pro";
import { useHydrated } from "@/store/study-store";
import { AreaCard } from "./AreaCard";
import { SummaryCard } from "./SummaryCard";
import { WeekCard } from "./WeekCard";

export function ResumoScreen() {
  const hydrated = useHydrated();
  const [weekOffset, setWeekOffset] = useState(0);
  const pro = useProAccess();

  const header = (
    <div className="grid gap-3">
      <Link href="/painel" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-text">
        <ChevronLeft size={16} aria-hidden />
        Painel
      </Link>
      <PageHeader title="Sua semana" subtitle="Horas, meta e o que você estudou em cada área." />
    </div>
  );

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        {header}
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  const today = toDateKey(new Date());
  const monday = addDays(mondayOf(today), weekOffset * 7);
  const locked = !pro && -weekOffset >= FREE_HISTORY_WEEKS;

  return (
    <div className="grid gap-6">
      {header}
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
        {!locked && <AreaCard monday={monday} />}
      </div>
    </div>
  );
}
