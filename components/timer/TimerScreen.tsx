"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { toDateKey } from "@/lib/dates";
import { useHydrated } from "@/store/study-store";
import { ReflectionPrompt } from "./ReflectionPrompt";
import { TimerCard } from "./TimerCard";
import { TodaySessions } from "./TodaySessions";

export function TimerScreen() {
  const hydrated = useHydrated();

  return (
    <div className="grid gap-5">
      <PageHeader title="Timer" subtitle="O tempo de foco entra sozinho no painel da semana." />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {hydrated ? (
          <>
            <TimerCard />
            <div className="grid gap-5">
              <ReflectionPrompt />
              <TodaySessions today={toDateKey(new Date())} />
            </div>
          </>
        ) : (
          <>
            <Skeleton className="h-[520px]" />
            <Skeleton className="h-40" />
          </>
        )}
      </div>
    </div>
  );
}
