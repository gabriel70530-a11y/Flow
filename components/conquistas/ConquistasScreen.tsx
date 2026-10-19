"use client";

import {
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Grid3x3,
  Layers,
  ListChecks,
  Lock,
  PenLine,
  Play,
  RotateCcw,
  Target,
  TimerReset,
  Trophy,
  Brain,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { countedSeconds, rankProgress, type AchievementIcon } from "@/lib/achievements";
import { addDays, toDateKey } from "@/lib/dates";
import { formatHours, studyStreak } from "@/lib/stats";
import { useHydrated } from "@/store/study-store";
import { useAchievements } from "./use-achievements";

const ICONS: Record<AchievementIcon, LucideIcon> = {
  relogio: Clock,
  chama: Flame,
  play: Play,
  check: CheckCircle2,
  memoria: Brain,
  alvo: Target,
  virada: RotateCcw,
  cartoes: Layers,
  prova: TimerReset,
  lista: ListChecks,
  caneta: PenLine,
  tabuada: Grid3x3,
};

const hoursFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const WEEKDAY_LETTERS = ["D", "S", "T", "Q", "Q", "S", "S"];
const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export function ConquistasScreen() {
  const hydrated = useHydrated();
  const { sessions, status } = useAchievements();

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Conquistas" subtitle="Seu ritmo, no seu tempo." />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const today = toDateKey(new Date());
  const unlocked = status.filter((item) => item.unlocked).length;
  const streak = studyStreak(sessions, today);
  const studied = new Set(sessions.map((session) => session.date));
  const lastDays = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const total = countedSeconds(sessions);
  const { current, next, fraction } = rankProgress(total);

  return (
    <div className="grid gap-6">
      <PageHeader title="Conquistas" subtitle="Seu ritmo, no seu tempo." />

      <section className="grid gap-5 rounded-[18px] border-2 border-edge bg-hero p-[22px] text-white shadow-card md:rounded-[22px] md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 font-heading text-lg font-bold text-action tabular-nums">
            <Flame size={18} aria-hidden />
            {streak} {streak === 1 ? "dia" : "dias"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 font-heading text-lg font-bold text-action tabular-nums">
            <Trophy size={18} aria-hidden />
            {unlocked}
          </span>
          <span className="text-sm text-hero-soft">
            {current.name} · {formatHours(total)} h
          </span>
        </div>
        <div className="grid gap-2">
          <span className="text-sm text-hero-soft">Seus últimos 7 dias</span>
          <ul className="flex justify-between gap-1 md:justify-start md:gap-4">
            {lastDays.map((day) => {
              const weekday = new Date(`${day}T12:00:00`).getDay();
              const done = studied.has(day);
              return (
                <li key={day} className="grid justify-items-center gap-1">
                  <span
                    className={`grid size-10 place-items-center rounded-full border-2 ${done ? "border-white bg-hero-bright text-hero-edge" : "border-hero-soft/50"}`}
                  >
                    {done && <Check size={18} strokeWidth={3} aria-hidden />}
                  </span>
                  <span className="text-xs font-semibold">
                    <span aria-hidden>{WEEKDAY_LETTERS[weekday]}</span>
                    <span className="sr-only">
                      {WEEKDAY_NAMES[weekday]}: {done ? "estudou" : "sem estudo"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        {next && (
          <div className="grid gap-1.5">
            <ProgressBar value={fraction} thin label={`Progresso até ${next.name}`} />
            <span className="text-xs text-hero-soft">Próximo nível: {next.name}</span>
          </div>
        )}
      </section>

      <h2 className="tabular-nums">
        {unlocked} de {status.length} conquistas
      </h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {status.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <li
              key={item.id}
              className={`grid content-start gap-2 rounded-[16px] border p-4 ${
                item.unlocked ? "border-accent bg-surface" : "border-line bg-surface/60"
              }`}
            >
              <span
                className={`relative grid size-12 place-items-center rounded-[14px] ${
                  item.unlocked ? "bg-action text-on-action" : "bg-hover text-muted"
                }`}
              >
                <Icon size={24} aria-hidden />
                {!item.unlocked && (
                  <span className="absolute -right-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full border-2 border-surface bg-muted text-surface">
                    <Lock size={10} aria-hidden />
                  </span>
                )}
              </span>
              <h3 className={`font-heading text-[16px] leading-tight font-bold ${item.unlocked ? "" : "text-muted"}`}>{item.title}</h3>
              <p className="text-[13px] text-muted">{item.description}</p>
              {item.unlocked ? (
                <span className="text-xs font-semibold text-success">Conquistada</span>
              ) : (
                <div className="grid gap-1">
                  <ProgressBar value={item.fraction} thin />
                  <span className="text-xs text-muted tabular-nums">
                    {item.metric === "horas"
                      ? `${hoursFormat.format(Math.min(item.value, item.goal))} de ${item.goal} h`
                      : `${Math.floor(Math.min(item.value, item.goal))} de ${item.goal}`}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
