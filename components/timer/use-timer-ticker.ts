"use client";

import { useEffect } from "react";
import { showToast } from "@/components/ui/Toast";
import { clockText, displaySeconds, isIdle } from "@/lib/timer";
import { useStudyStore } from "@/store/study-store";
import { chime } from "./chime";
import { useNow } from "./use-now";

// Roda no AppShell para o Pomodoro avançar de fase em qualquer tela. Devolve o texto do relógio para a navegação.
export function useTimerTicker(hydrated: boolean): string | null {
  const timer = useStudyStore((state) => state.timer);
  const tick = useStudyStore((state) => state.tick);
  const now = useNow(hydrated && timer.running);
  const text = hydrated && !isIdle(timer) ? clockText(displaySeconds(timer, now || timer.startedAt)) : null;

  useEffect(() => {
    if (!hydrated) return;
    const result = tick();
    if (!result) return;
    chime();
    showToast(result === "focus-done" ? "Bloco de foco registrado. Pausa iniciada." : "Pausa encerrada.");
  }, [hydrated, now, tick]);

  useEffect(() => {
    document.title = text && timer.running ? `${text} · ENEM Flow` : "ENEM Flow";
  }, [text, timer.running]);

  return text;
}
