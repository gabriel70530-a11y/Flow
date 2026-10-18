"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputStyles } from "@/components/ui/Field";
import { ProNotice } from "@/components/ui/ProNotice";
import { Segmented } from "@/components/ui/Segmented";
import { useProAccess } from "@/store/pro";
import { hasTopicNamed, topicSuggestions } from "@/lib/suggestions";
import { AREAS, findArea, findSubject, subjectsOf, type AreaId, type SubjectId } from "@/lib/syllabus";
import {
  PRIORITY_LABELS,
  TOPIC_DESCRIPTION_MAX,
  TOPIC_NAME_MAX,
  type Priority,
  type TopicInput,
} from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";

export const priorityOptions = (Object.keys(PRIORITY_LABELS) as Priority[]).map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
}));

interface TopicFormProps {
  initial: TopicInput;
  submitLabel: string;
  onSubmit: (input: TopicInput) => string | null;
  onCancel?: () => void;
  // Só ao criar: mostra o que mais cai na área ou matéria escolhida, como atalho para o nome.
  suggest?: boolean;
}

function Suggestions({ input, onPick }: { input: TopicInput; onPick: (name: string) => void }) {
  const topics = useStudyStore((state) => state.topics);
  const pro = useProAccess();
  if (!pro) {
    return (
      <ProNotice title="Veja o que mais cai em cada matéria com o Pro" className="-mt-1">
        Até 10 sugestões por matéria, pelo que mais apareceu no Enem de 2014 a 2024. Tocar só preenche o nome.
      </ProNotice>
    );
  }
  const list = topicSuggestions(input.areaId, input.subjectId);
  if (!list) return <p className="-mt-1 text-[13px] text-muted">Escolha a matéria para ver o que mais cai.</p>;
  const scope = input.subjectId ? findSubject(input.subjectId)?.name : findArea(input.areaId).name;
  return (
    <div className="-mt-1 grid gap-2" aria-live="polite">
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="font-semibold text-text">O que mais cai em {scope}</span>
        <span className="text-muted">toque para usar</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {list.map((name) => {
          const exists = hasTopicNamed(topics, input.areaId, name);
          return (
            <button
              key={name}
              type="button"
              disabled={exists}
              aria-pressed={input.name.trim() === name}
              aria-label={exists ? `${name}, já criado` : undefined}
              onClick={() => onPick(name)}
              className="min-h-[34px] rounded-full border-2 border-transparent bg-hover px-3.5 text-sm font-semibold text-text hover:border-edge aria-pressed:border-edge aria-pressed:bg-action aria-pressed:text-on-action disabled:border-dashed disabled:border-line disabled:bg-transparent disabled:font-semibold disabled:text-muted disabled:opacity-100 disabled:hover:border-line"
            >
              {exists && (
                <span className="mr-1 text-success" aria-hidden>
                  ✓
                </span>
              )}
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TopicForm({ initial, submitLabel, onSubmit, onCancel, suggest = false }: TopicFormProps) {
  const pro = useProAccess();
  const [input, setInput] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const update = (changes: Partial<TopicInput>) => {
    setInput((current) => ({ ...current, ...changes }));
    setError(null);
  };

  const subjects = subjectsOf(input.areaId);

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
          placeholder={suggest ? "Ex.: Porcentagem" : undefined}
          className={inputStyles}
          required
          aria-invalid={Boolean(error)}
        />
      </Field>
      {suggest && <Suggestions input={input} onPick={(name) => update({ name })} />}
      <Field label="Área">
        <select
          value={input.areaId}
          onChange={(event) => update({ areaId: event.target.value as AreaId, subjectId: null })}
          className={inputStyles}
        >
          {AREAS.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </Field>
      {subjects.length > 0 && (
        <Field label="Matéria">
          <select
            value={input.subjectId ?? ""}
            onChange={(event) => update({ subjectId: (event.target.value || null) as SubjectId | null })}
            className={inputStyles}
            required
          >
            <option value="">Escolha a matéria</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </Field>
      )}
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
      {suggest && pro && (
        <p className="text-xs text-muted">
          Sugestões a partir de levantamentos do que caiu no Enem de 2014 a 2024. Elas não dizem o que vai cair.
        </p>
      )}
    </form>
  );
}
