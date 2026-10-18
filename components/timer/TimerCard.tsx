"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NumberInput } from "@/components/ui/NumberInput";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Segmented } from "@/components/ui/Segmented";
import { showToast } from "@/components/ui/Toast";
import { GENERAL_STUDY, areaStudyValue, parseStudyChoice } from "@/lib/sessions";
import { formatDuration } from "@/lib/stats";
import { AREAS } from "@/lib/syllabus";
import { clockText, displaySeconds, elapsed, isIdle, phaseSeconds, type TimerMode } from "@/lib/timer";
import { findTopic, visibleTopics } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";
import { unlockAudio } from "./chime";
import { useNow } from "./use-now";

const modeOptions: { value: TimerMode; label: string }[] = [
  { value: "pomodoro", label: "Pomodoro" },
  { value: "cronometro", label: "Cronômetro" },
];

export function TimerCard() {
  const timer = useStudyStore((state) => state.timer);
  const topics = useStudyStore((state) => state.topics);
  const tasks = useStudyStore((state) => state.tasks);
  const sound = useStudyStore((state) => state.sound);
  const actions = useStudyStore.getState();
  const now = useNow(timer.running) || timer.startedAt;
  const topicSelect = useRef<HTMLSelectElement>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const idle = isIdle(timer);
  const pomodoro = timer.mode === "pomodoro";
  const onBreak = timer.phase === "break";
  const breakOffered = onBreak && !timer.running && timer.banked === 0;
  const phaseLabel = pomodoro ? (onBreak ? (breakOffered ? "Bloco concluído. Hora da pausa?" : "Pausa") : "Foco") : "Cronômetro";
  const task = tasks.find((candidate) => candidate.id === timer.taskId);
  // Um tópico oculto ou excluído que já estava no timer continua aparecendo na lista até ser trocado.
  const selectable = visibleTopics(topics);
  const selected = findTopic(topics, timer.topicId);
  if (selected && selected.hidden) selectable.push(selected);

  const toggle = () => {
    setConfirmingDiscard(false);
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
    const session = actions.finishTimer();
    showToast(
      session
        ? `Sessão de ${formatDuration(session.sec)} registrada.`
        : "Sessões com menos de 1 minuto não são registradas.",
    );
  };

  const discard = () => {
    if (!confirmingDiscard) {
      setConfirmingDiscard(true);
      return;
    }
    setConfirmingDiscard(false);
    actions.discardTimer();
    showToast("Tempo descartado. Nada foi registrado.");
  };

  const toggleLabel = timer.running ? "Pausar" : breakOffered ? "Iniciar pausa" : idle ? "Iniciar" : "Continuar";

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
          <option value="">Escolha uma área ou tópico</option>
          <option value={GENERAL_STUDY}>Estudo geral (sem área)</option>
          {timer.topicId && parseStudyChoice(timer.topicId, topics).topicId && !selected && (
            <option value={timer.topicId}>Tópico excluído</option>
          )}
          {AREAS.map((area) => (
            <optgroup key={area.id} label={area.name}>
              <option value={areaStudyValue(area.id)}>{area.name} (geral)</option>
              {selectable
                .filter((topic) => topic.areaId === area.id)
                .map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        {task && (
          <span className="font-normal">
            Matéria do dia{task.focusSec > 0 && ` · ${formatDuration(task.focusSec)} já estudados`}. Sem limite de tempo:
            estude o quanto quiser, até sentir que dominou o conteúdo.
          </span>
        )}
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

      <div className="grid gap-2">
        <div className="flex gap-2">
          <Button variant="primary" size="lg" className="flex-1" onClick={toggle}>
            {toggleLabel}
          </Button>
          {onBreak ? (
            <Button size="lg" className="flex-1" onClick={actions.skipBreak}>
              Pular pausa
            </Button>
          ) : (
            <Button size="lg" className="flex-1" onClick={finish} disabled={idle}>
              Finalizar
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px] text-muted">
          <button
            type="button"
            aria-pressed={sound}
            onClick={() => actions.setSound(!sound)}
            className="inline-flex min-h-9 items-center gap-1.5"
          >
            {sound ? <Volume2 size={16} aria-hidden /> : <VolumeX size={16} aria-hidden />}
            Aviso sonoro {sound ? "ligado" : "desligado"}
          </button>
          {!idle && !onBreak && (
            <button type="button" onClick={discard} className="min-h-9 underline underline-offset-3">
              {confirmingDiscard ? "Clique de novo para descartar sem registrar" : "Descartar este tempo"}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
