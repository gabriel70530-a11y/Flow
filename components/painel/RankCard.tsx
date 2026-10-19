"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAchievements } from "@/components/conquistas/use-achievements";
import { ACHIEVEMENTS, countedSeconds, rankProgress } from "@/lib/achievements";

// Uma linha só: o nível pelas horas totais e quantas conquistas a pessoa tem. O resto fica em Conquistas.
export function RankCard() {
  const { sessions, status } = useAchievements();
  const { current, next, fraction } = rankProgress(countedSeconds(sessions));
  const unlocked = status.filter((item) => item.unlocked).length;

  return (
    <Link
      href="/conquistas"
      aria-label={`${current.name}: ${unlocked} de ${ACHIEVEMENTS.length} conquistas`}
      className="flex items-center gap-3.5 rounded-[16px] border border-line bg-surface px-[18px] py-3.5 hover:bg-hover"
    >
      <span className="font-semibold whitespace-nowrap">{current.name}</span>
      <ProgressBar thin value={fraction} label={next ? `Progresso até ${next.name}` : "Último nível"} className="flex-1" />
      <span className="text-[13px] whitespace-nowrap text-muted tabular-nums">
        {unlocked} de {ACHIEVEMENTS.length}
      </span>
      <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
