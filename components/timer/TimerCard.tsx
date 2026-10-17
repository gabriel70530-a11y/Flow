"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NumberInput } from "@/components/ui/NumberInput";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Segmented } from "@/components/ui/Segmented";
import { showToast } from "@/components/ui/Toast";
import { formatDuration } from "@/lib/stats";
import { AREAS, TOPICS } from "@/lib/syllabus";
import { clockText, displaySeconds, elapsed, isIdle, phaseSeconds, type TimerMode } from "@/lib/timer";
import { useStudyStore } from "@/store/study-store";
import { unlockAudio } from "./chime";
import { useNow } from "./use-now";

const modeOptions: { value: TimerMode; label: string }[] = [
  { value: "pomodoro", label: "Pomodoro" },
  { value: "cronometro", label: "Cronômetro" },
];

export function TimerCard() {
  const timer = useStudyStore((state) => state.timer);
  const actions = useStudyStore.getState();
  const now = useNow(timer.running) || timer.startedAt;
  const topicSelect = useRef<HTMLSelectElement>(null);

  const idle = isIdle(timer);
  const pomodoro = timer.mode === "pomodoro";
  const phaseLabel = pomodoro ? (timer.phase === "focus" ? "Foco" : "Pausa") : "Cronômetro";

  const toggle = () => {
    if (timer.running) {
      actions.pauseTimer();
      return;
    }
    if (!timer.topicId) {
      showToast("Escolha o que você vai estudar.");
      topicSelect.current?.focus();
      return;
    }
    unlockAudio();
    actions.startTimer();
  };

  const finish = () => {
    const seconds = actions.finishTimer();
    showToast(
      seconds === null
        ? "Sessões com menos de 1 minuto não são registradas."
        : `Sessão de ${formatDuration(seconds)} registrada.`,
    );
  };

  return (
    <Card className="grid gap-6 md:p-7">
      <Segmented options={modeOptions} value={timer.mode} onChange={actions.setTimerMode} disabled={!idle} />

      <div className="grid gap-1.5 text-center">
        <span className="text-[13px] text-muted">{phaseLabel}</span>
        <div className="font-heading text-[clamp(60px,14vw,92px)] leading-[1.05] font-light font-stretch-120% italic tabular-nums">
          {clockText(displaySeconds(timer, now))}
        </div>
        <ProgressBar
          thin
          value={pomodoro ? elapsed(timer, now) / phaseSeconds(timer) : 0}
          className={pomodoro ? "" : "invisible"}
        />
      </div>

      <label className="grid gap-1.5 text-[13px] font-semibold text-muted">
        O que você vai estudar
        <select
          ref={topicSelect}
          value={timer.topicId}
          disabled={timer.running}
          onChange={(event) => actions.setTimerTopic(event.target.value)}
          className="h-[42px] w-full rounded-lg border border-line bg-surface px-2.5 text-[15px] font-normal text-text"
        >
          <option value="">Escolha um tópico</option>
          {AREAS.map((area) => (
            <optgroup key={area.id} label={area.name}>
              {TOPICS.filter((topic) => topic.area === area).map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      {pomodoro && (
        <fieldset disabled={!idle} className="flex gap-3">
          <label className="grid flex-1 gap-1.5 text-[13px] font-semibold text-muted">
            Foco (min)
            <NumberInput
              value={timer.focus}
              min={1}
              max={120}
              onCommit={actions.setFocusMinutes}
              disabled={!idle}
              className="w-full font-normal"
            />
          </label>
          <label className="grid flex-1 gap-1.5 text-[13px] font-semibold text-muted">
            Pausa (min)
            <NumberInput
              value={timer.brk}
              min={1}
              max={60}
              onCommit={actions.setBreakMinutes}
              disabled={!idle}
              className="w-full font-normal"
            />
          </label>
        </fieldset>
      )}

      <div className="flex gap-2">
        <Button variant="primary" size="lg" className="flex-1" onClick={toggle}>
          {timer.running ? "Pausar" : idle ? "Iniciar" : "Continuar"}
        </Button>
        {timer.phase === "break" ? (
          <Button size="lg" className="flex-1" onClick={actions.skipBreak}>
            Pular pausa
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={finish} disabled={idle}>
            Finalizar
          </Button>
        )}
      </div>
    </Card>
  );
}
