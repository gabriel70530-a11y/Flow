"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputStyles } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import type { PlanStrategy, PlannerSettings } from "@/lib/planner";
import { formatDuration } from "@/lib/stats";
import { AREAS, type AreaId } from "@/lib/syllabus";
import { MINUTE_OPTIONS, SESSION_OPTIONS, minutesLabel } from "./task-format";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const strategyOptions: { value: PlanStrategy; label: string }[] = [
  { value: "equilibrada", label: "Equilibrada" },
  { value: "prioridades", label: "Foco nas prioridades" },
];

export function AvailabilityFields({ value, onChange }: { value: number[]; onChange: (value: number[]) => void }) {
  const total = value.reduce((sum, minutes) => sum + minutes, 0);
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {WEEKDAYS.map((weekday, index) => {
          const options = MINUTE_OPTIONS.includes(value[index]) ? MINUTE_OPTIONS : [...MINUTE_OPTIONS, value[index]].sort((a, b) => a - b);
          return (
            <Field key={weekday} label={weekday}>
              <select
                value={value[index]}
                onChange={(event) => onChange(value.map((minutes, day) => (day === index ? Number(event.target.value) : minutes)))}
                className={`${inputStyles} px-1.5`}
              >
                {options.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutesLabel(minutes)}
                  </option>
                ))}
              </select>
            </Field>
          );
        })}
      </div>
      <p className="text-[13px] text-muted tabular-nums">
        {total ? `${formatDuration(total * 60)} por semana. Dias livres não recebem tarefas.` : "Escolha pelo menos um dia com tempo."}
      </p>
    </div>
  );
}

interface AreaChipsProps {
  label: string;
  hint?: string;
  value: AreaId[];
  onChange: (value: AreaId[]) => void;
}

export function AreaChips({ label, hint, value, onChange }: AreaChipsProps) {
  const toggle = (areaId: AreaId) =>
    onChange(value.includes(areaId) ? value.filter((id) => id !== areaId) : [...value, areaId]);
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-[13px] font-semibold text-muted">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {AREAS.map((area) => (
          <button
            key={area.id}
            type="button"
            aria-pressed={value.includes(area.id)}
            onClick={() => toggle(area.id)}
            className="min-h-9 rounded-full bg-hover px-3.5 text-sm font-semibold text-muted aria-pressed:bg-accent aria-pressed:text-on-accent"
          >
            {area.name}
          </button>
        ))}
      </div>
      {hint && <p className="text-[13px] text-muted">{hint}</p>}
    </fieldset>
  );
}

export function SessionLengthField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const options = SESSION_OPTIONS.includes(value) ? SESSION_OPTIONS : [...SESSION_OPTIONS, value].sort((a, b) => a - b);
  return (
    <Field label="Duração de cada sessão" hint="O cronograma não encolhe sessões para caber no dia.">
      <select value={value} onChange={(event) => onChange(Number(event.target.value))} className={inputStyles}>
        {options.map((minutes) => (
          <option key={minutes} value={minutes}>
            {minutes} min
          </option>
        ))}
      </select>
    </Field>
  );
}

interface PlannerSettingsFormProps {
  initial: PlannerSettings;
  today: string;
  submitLabel: string;
  onSubmit: (settings: PlannerSettings) => string | null;
}

export function PlannerSettingsForm({ initial, today, submitLabel, onSubmit }: PlannerSettingsFormProps) {
  const [settings, setSettings] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const update = (changes: Partial<PlannerSettings>) => {
    setSettings((current) => ({ ...current, ...changes }));
    setError(null);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(onSubmit(settings));
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Tempo disponível por dia</span>
        <AvailabilityFields value={settings.availability} onChange={(availability) => update({ availability })} />
      </div>
      <SessionLengthField value={settings.sessionMinutes} onChange={(sessionMinutes) => update({ sessionMinutes })} />
      <div className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Como distribuir</span>
        <Segmented options={strategyOptions} value={settings.strategy} onChange={(strategy) => update({ strategy })} />
      </div>
      <AreaChips
        label="Áreas prioritárias ou difíceis"
        hint="Recebem mais sessões, principalmente no foco nas prioridades."
        value={settings.difficultAreas}
        onChange={(difficultAreas) => update({ difficultAreas })}
      />
      <AreaChips
        label="Áreas em que você já vai bem"
        value={settings.strongAreas}
        onChange={(strongAreas) => update({ strongAreas })}
      />
      <Field label="Data da sua prova (opcional)" hint="Só para referência. Você pode mudar quando quiser.">
        <input
          type="date"
          min={today}
          value={settings.targetDate ?? ""}
          onChange={(event) => update({ targetDate: event.target.value || null })}
          className={inputStyles}
        />
      </Field>
      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg">
        {submitLabel}
      </Button>
    </form>
  );
}
