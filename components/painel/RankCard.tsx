"use client";

import { Check } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DAILY_COUNTED_SECONDS, achievementStatus, countedSeconds, rankProgress } from "@/lib/achievements";
import { formatHours } from "@/lib/stats";
import { useStudyStore } from "@/store/study-store";

export function RankCard() {
  const sessions = useStudyStore((state) => state.sessions);
  const total = countedSeconds(sessions);
  const { current, next, fraction, hoursToNext } = rankProgress(total);
  const achievements = achievementStatus(total);

  return (
    <Card>
      <CardHeader title="Seu ritmo" />
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-heading text-[22px] font-bold font-stretch-108%">{current.name}</span>
          <span className="text-[13px] text-muted tabular-nums">{formatHours(total)} h no total</span>
        </div>
        <ProgressBar value={fraction} label={next ? `Progresso até ${next.name}` : "Último nível"} />
        <p className="text-[13px] text-muted">
          {next
            ? `Faltam ${formatHours(hoursToNext * 3600)} h para ${next.name}.`
            : "Você chegou ao último nível. O que importa agora é o seu ritmo."}
        </p>
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2" aria-label="Conquistas">
        {achievements.map((achievement) => (
          <li
            key={achievement.id}
            className={`grid justify-items-center gap-0.5 rounded-[10px] border-2 px-1 py-2 text-center ${
              achievement.unlocked ? "border-edge bg-hover" : "border-line text-muted"
            }`}
          >
            <span className="font-heading text-[17px] font-bold tabular-nums">{achievement.hours} h</span>
            <span className="flex items-center gap-1 text-[12px]">
              {achievement.unlocked && <Check size={12} aria-hidden />}
              {achievement.unlocked ? "Conquistada" : `${Math.floor(achievement.fraction * 100)}%`}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] text-muted">
        Contam até {DAILY_COUNTED_SECONDS / 3600} h por dia: descansar também faz parte.
      </p>
    </Card>
  );
}
