"use client";

import Link from "next/link";
import { linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAchievements } from "@/components/conquistas/use-achievements";
import { ACHIEVEMENTS, countedSeconds, rankProgress } from "@/lib/achievements";
import { formatHours } from "@/lib/stats";

export function RankCard() {
  const { sessions, status } = useAchievements();
  const total = countedSeconds(sessions);
  const { current, next, fraction, hoursToNext } = rankProgress(total);
  const unlocked = status.filter((item) => item.unlocked).length;

  return (
    <Card>
      <CardHeader title="Seu ritmo">
        <Link href="/conquistas" className={`${linkStyles} shrink-0 whitespace-nowrap`}>
          Conquistas
        </Link>
      </CardHeader>
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-heading text-[22px] font-bold font-stretch-108%">{current.name}</span>
          <span className="text-[13px] text-muted tabular-nums">{formatHours(total)} h</span>
        </div>
        <ProgressBar value={fraction} label={next ? `Progresso até ${next.name}` : "Último nível"} />
        <p className="text-[13px] text-muted tabular-nums">
          {next ? `Faltam ${formatHours(hoursToNext * 3600)} h para ${next.name}. ` : ""}
          {unlocked} de {ACHIEVEMENTS.length} conquistas.
        </p>
      </div>
    </Card>
  );
}
