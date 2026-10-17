"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { addDays } from "@/lib/dates";
import { formatHours, secondsByArea } from "@/lib/stats";
import { AREAS } from "@/lib/syllabus";
import { useStudyStore } from "@/store/study-store";

export function AreaCard({ monday }: { monday: string }) {
  const sessions = useStudyStore((state) => state.sessions);
  const totals = secondsByArea(sessions, monday, addDays(monday, 6));
  const max = Math.max(1, ...Object.values(totals));

  return (
    <Card>
      <CardHeader title="Por área" />
      <div className="grid gap-3.5">
        {AREAS.map((area) => (
          <div key={area.id}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span>{area.name}</span>
              <span className="text-[13px] text-muted tabular-nums">{formatHours(totals[area.id])} h</span>
            </div>
            <ProgressBar thin value={totals[area.id] / max} />
          </div>
        ))}
      </div>
    </Card>
  );
}
