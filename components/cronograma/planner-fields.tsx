"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { fromDateKey, shortDate } from "@/lib/dates";
import { ENEM_DATES } from "@/lib/exam";
import type { PlanStrategy, PlannerSettings } from "@/lib/planner";
import { AREAS, type AreaId } from "@/lib/syllabus";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const strategyOptions: { value: PlanStrategy; label: string }[] = [
  { value: "equilibrada", label: "Equilibrada" },
  { value: "prioridades", label: "Foco nas prioridades" },
];

export function StudyDaysFields({ value, onChange }: { value: boolean[]; onChange: (value: boolean[]) => void }) {
  const count = value.filter(Boolean).length;
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((weekday, index) => (
          <button
            key={weekday}
            type="button"
            aria-pressed={value[index]}
            onClick={() => onChange(value.map((studies, day) => (day === index ? !studies : studies)))}
            className="min-h-11 rounded-full bg-hover text-sm font-semibold text-muted aria-pressed:bg-action aria-pressed:text-on-action"
          >
            {weekday}
          </button>
        ))}
      </div>
      <p className="text-[13px] text-muted">
        {count
          ? `${count} ${count === 1 ? "dia" : "dias"} de estudo, com até 2 matérias por dia. Estude quanto tempo quiser.`
          : "Escolha pelo menos um dia para estudar."}
      </p>
    </div>
  );
}

// Dias corridos (escola integral, trabalho) recebem uma matéria só. Só os dias de estudo aparecem.
export function LightDaysField({
  studyDays,
  value,
  onChange,
}: {
  studyDays: boolean[];
  value: boolean[];
  onChange: (value: boolean[]) => void;
}) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-[13px] font-semibold text-muted">Dias corridos (opcional)</legend>
      <div className="flex flex-wrap gap-1.5">
        {WEEKDAYS.map((weekday, index) =>
          studyDays[index] ? (
            <button
              key={weekday}
              type="button"
              aria-pressed={value[index]}
              onClick={() => onChange(value.map((light, day) => (day === index ? !light : light)))}
              className="min-h-9 min-w-12 rounded-full bg-hover px-3 text-sm font-semibold text-muted aria-pressed:bg-action aria-pressed:text-on-action"
            >
              {weekday}
            </button>
          ) : null,
        )}
      </div>
      <p className="text-[13px] text-muted">Nesses dias o plano coloca só uma matéria. Bom para dias de escola integral ou trabalho.</p>
    </fieldset>
  );
}

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });

// O Enem tem data oficial: o Flow mostra os dois dias em vez de pedir uma data.
export function ExamDates() {
  const days = [
    { date: ENEM_DATES.first, label: "1º dia", content: "Linguagens, Humanas e Redação" },
    { date: ENEM_DATES.second, label: "2º dia", content: "Natureza e Matemática" },
  ];
  return (
    <div className="grid gap-1.5">
      <span className="text-[13px] font-semibold text-muted">Data da prova</span>
      <ul className="grid gap-2 rounded-[12px] bg-hover p-3.5 text-sm">
        {days.map((day) => (
          <li key={day.date} className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-semibold tabular-nums">
              {day.label} · {weekday.format(fromDateKey(day.date))}, {shortDate(day.date)}
            </span>
            <span className="text-muted">{day.content}</span>
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-muted">
        Datas oficiais do Enem {ENEM_DATES.first.slice(0, 4)}. O Flow usa para a reta final e o checklist do dia da prova.
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
            className="min-h-9 rounded-full bg-hover px-3.5 text-sm font-semibold text-muted aria-pressed:bg-action aria-pressed:text-on-action"
          >
            {area.name}
          </button>
        ))}
      </div>
      {hint && <p className="text-[13px] text-muted">{hint}</p>}
    </fieldset>
  );
}

interface PlannerSettingsFormProps {
  initial: PlannerSettings;
  submitLabel: string;
  onSubmit: (settings: PlannerSettings) => string | null;
}

export function PlannerSettingsForm({ initial, submitLabel, onSubmit }: PlannerSettingsFormProps) {
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
        <span className="text-[13px] font-semibold text-muted">Em quais dias você quer estudar?</span>
        <StudyDaysFields value={settings.studyDays} onChange={(studyDays) => update({ studyDays })} />
      </div>
      <LightDaysField
        studyDays={settings.studyDays}
        value={settings.lightDays}
        onChange={(lightDays) => update({ lightDays })}
      />
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
      <ExamDates />
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
