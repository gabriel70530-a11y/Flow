"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputStyles } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { AREAS, type AreaId } from "@/lib/syllabus";
import {
  PRIORITY_LABELS,
  TOPIC_DESCRIPTION_MAX,
  TOPIC_NAME_MAX,
  type Priority,
  type TopicInput,
} from "@/lib/topics";

export const priorityOptions = (Object.keys(PRIORITY_LABELS) as Priority[]).map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
}));

interface TopicFormProps {
  initial: TopicInput;
  submitLabel: string;
  onSubmit: (input: TopicInput) => string | null;
  onCancel?: () => void;
}

export function TopicForm({ initial, submitLabel, onSubmit, onCancel }: TopicFormProps) {
  const [input, setInput] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const update = (changes: Partial<TopicInput>) => {
    setInput((current) => ({ ...current, ...changes }));
    setError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(onSubmit(input));
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Nome" error={error}>
        <input
          value={input.name}
          maxLength={TOPIC_NAME_MAX}
          onChange={(event) => update({ name: event.target.value })}
          className={inputStyles}
          required
          aria-invalid={Boolean(error)}
        />
      </Field>
      <Field label="Área">
        <select value={input.areaId} onChange={(event) => update({ areaId: event.target.value as AreaId })} className={inputStyles}>
          {AREAS.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Descrição (opcional)" hint={`${input.description.length}/${TOPIC_DESCRIPTION_MAX}`}>
        <textarea
          value={input.description}
          maxLength={TOPIC_DESCRIPTION_MAX}
          rows={3}
          onChange={(event) => update({ description: event.target.value })}
          className={`${inputStyles} h-auto resize-none py-2`}
        />
      </Field>
      <div className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Prioridade</span>
        <Segmented options={priorityOptions} value={input.priority} onChange={(priority) => update({ priority })} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="lg" className="flex-1">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button size="lg" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
