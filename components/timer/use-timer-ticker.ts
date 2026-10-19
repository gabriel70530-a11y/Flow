"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { showToast } from "@/components/ui/Toast";
import { unlockMessage, unlockedBySession } from "@/lib/achievements";
import { clockText, displaySeconds, isIdle } from "@/lib/timer";
import { useStudyStore } from "@/store/study-store";
import { chime } from "./chime";
import { useNow } from "./use-now";

const CLOCK_PREFIX = /^(\d+:)?\d{2}:\d{2} · /;

// Roda no AppShell para o Pomodoro avançar de fase em qualquer tela. Devolve o texto do relógio para a navegação.
export function useTimerTicker(hydrated: boolean): string | null {
  const timer = useStudyStore((state) => state.timer);
  const tick = useStudyStore((state) => state.tick);
  const sound = useStudyStore((state) => state.sound);
  const pathname = usePathname();
  const now = useNow(hydrated && timer.running);
  const text = hydrated && !isIdle(timer) ? clockText(displaySeconds(timer, now || timer.startedAt)) : null;

  useEffect(() => {
    if (!hydrated) return;
    const result = tick();
    if (!result) return;
    if (sound) chime();
    showToast(
      result.kind === "focus-done"
        ? `Bloco de foco registrado.${result.session ? unlockMessage(unlockedBySession(useStudyStore.getState().sessions, result.session)) : ""} Comece a pausa quando quiser.`
        : "Pausa encerrada. Comece o próximo bloco quando quiser.",
    );
  }, [hydrated, now, tick, sound]);

  // Com o timer rodando, o relógio vai na frente do título da página (que continua dizendo onde a pessoa está).
  useEffect(() => {
    const pageTitle = document.title.replace(CLOCK_PREFIX, "");
    document.title = text && timer.running ? `${text} · ${pageTitle}` : pageTitle;
  }, [text, timer.running, pathname]);

  return text;
}
