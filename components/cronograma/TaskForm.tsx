"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputStyles } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { priorityOptions } from "@/components/materias/TopicForm";
import type { TaskInput } from "@/lib/planner";
import { AREAS } from "@/lib/syllabus";
import { visibleTopics } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";

interface TaskFormProps {
  today: string;
  initialDate: string;
  onDone: () => void;
}

export function TaskForm({ today, initialDate, onDone }: TaskFormProps) {
  const topics = useStudyStore((state) => state.topics);
  const addTask = useStudyStore((state) => state.addTask);
  const [input, setInput] = useState<TaskInput>({ topicId: null, date: initialDate, priority: "media" });
  const [error, setError] = useState<string | null>(null);
  const update = (changes: Partial<TaskInput>) => {
    setInput((current) => ({ ...current, ...changes }));
    setError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = addTask(input);
    setError(result);
    if (!result) onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="O que estudar">
        <select
          value={input.topicId ?? ""}
          onChange={(event) => update({ topicId: event.target.value || null })}
          className={inputStyles}
        >
          <option value="">Estudo geral (sem tópico)</option>
          {AREAS.map((area) => (
            <optgroup key={area.id} label={area.name}>
              {visibleTopics(topics)
                .filter((topic) => topic.areaId === area.id)
                .map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <Field label="Dia" hint="Cada dia tem no máximo 2 matérias.">
        <input
          type="date"
          min={today}
          value={input.date}
          onChange={(event) => update({ date: event.target.value })}
          required
          className={inputStyles}
        />
      </Field>
      <div className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Prioridade</span>
        <Segmented options={priorityOptions} value={input.priority} onChange={(priority) => update({ priority })} />
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg">
        Adicionar ao cronograma
      </Button>
    </form>
  );
}
