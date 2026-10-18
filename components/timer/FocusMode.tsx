"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { clockText, displaySeconds, isIdle } from "@/lib/timer";
import { studyTitle, parseStudyChoice } from "@/lib/sessions";
import { useStudyStore } from "@/store/study-store";
import { unlockAudio } from "./chime";
import { useNow } from "./use-now";

const overlayButton =
  "inline-flex h-12 items-center justify-center rounded-full px-7 font-semibold whitespace-nowrap transition-transform";

// Tela cheia só com o relógio: menos coisa para olhar, mais fácil deixar o celular de lado.
export function FocusMode({ onClose }: { onClose: () => void }) {
  const timer = useStudyStore((state) => state.timer);
  const topics = useStudyStore((state) => state.topics);
  const { pauseTimer, startTimer } = useStudyStore.getState();
  const now = useNow(timer.running) || timer.startedAt;
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeOnEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
  });

  useEffect(() => {
    closeButton.current?.focus();
    document.documentElement.requestFullscreen?.().catch(() => {});
    const handleKeyDown = (event: KeyboardEvent) => closeOnEscape(event);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  const choice = parseStudyChoice(timer.topicId, topics);
  const title = timer.topicId ? studyTitle(choice.topicId, choice.areaId, topics, choice.subjectId) : "";
  const onBreak = timer.phase === "break";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modo foco"
      className="fixed inset-0 z-50 grid place-items-center bg-hero px-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] text-white"
    >
      <div className="grid justify-items-center gap-6 text-center">
        <span className="text-xs font-semibold tracking-[0.14em] text-hero-soft uppercase">
          {onBreak ? "Pausa" : timer.running ? "Foco" : isIdle(timer) ? "Pronto para começar" : "Pausado"}
        </span>
        <div className="font-heading text-[clamp(72px,22vw,180px)] leading-none font-light font-stretch-120% italic tabular-nums">
          {clockText(displaySeconds(timer, now))}
        </div>
        {title && <p className="max-w-[600px] font-heading text-[22px] font-bold wrap-anywhere font-stretch-112%">{title}</p>}
        <p className="max-w-[420px] text-hero-soft">Deixe o celular longe e com as notificações desligadas. Uma coisa de cada vez.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (timer.running) return pauseTimer();
              unlockAudio();
              startTimer();
            }}
            className={`${overlayButton} border-2 border-hero-edge bg-white text-action shadow-[3px_3px_0_var(--hero-edge)] hover:-translate-x-px hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`}
          >
            {timer.running ? "Pausar" : isIdle(timer) ? "Iniciar" : "Continuar"}
          </button>
          <button ref={closeButton} type="button" onClick={onClose} className={`${overlayButton} border-2 border-white/60 hover:border-white`}>
            Sair do modo foco
          </button>
        </div>
      </div>
    </div>
  );
}
