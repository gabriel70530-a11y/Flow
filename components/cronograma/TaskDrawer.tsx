"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerSection } from "@/components/ui/Drawer";
import { Field, inputStyles } from "@/components/ui/Field";
import { showToast } from "@/components/ui/Toast";
import { useStudyTopic } from "@/components/timer/use-study-topic";
import { dayLabel, isDateKey } from "@/lib/dates";
import { TASK_STATUS_LABELS, canSplit, freeMinutes, suggestDay, type PlanTask } from "@/lib/planner";
import { formatDuration } from "@/lib/stats";
import { useStudyStore } from "@/store/study-store";
import { taskDetails, taskTitle } from "./task-format";

interface TaskDrawerProps {
  task: PlanTask | undefined;
  today: string;
  onClose: () => void;
}

export function TaskDrawer({ task, today, onClose }: TaskDrawerProps) {
  const topics = useStudyStore((state) => state.topics);
  const tasks = useStudyStore((state) => state.tasks);
  const planner = useStudyStore((state) => state.planner);
  const { moveTask, setTaskDone, splitPlanTask, lowerTaskPriority, removeTask } = useStudyStore.getState();
  const studyTopic = useStudyTopic();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!task) return null;

  const close = () => {
    setConfirmingRemove(false);
    setError(null);
    onClose();
  };
  const done = task.status === "concluida";
  const suggestion = done ? null : suggestDay(tasks, planner, today, task.minutes, task.id);
  const act = (message: string, action: () => void) => {
    action();
    showToast(message);
    close();
  };

  const moveTo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const date = String(new FormData(event.currentTarget).get("date") ?? "");
    if (!isDateKey(date) || date < today) {
      setError("Escolha hoje ou uma data futura.");
      return;
    }
    // Mover à mão é escolha do estudante: avisa se passar da disponibilidade, mas não impede.
    const over = task.minutes - freeMinutes(tasks.filter((other) => other.id !== task.id), planner, date);
    act(
      over > 0
        ? `Tarefa movida. Esse dia passa ${formatDuration(over * 60)} da sua disponibilidade.`
        : `Tarefa movida para ${dayLabel(date, today).toLowerCase()}.`,
      () => moveTask(task.id, date),
    );
  };

  const remove = () => {
    if (!confirmingRemove) {
      setConfirmingRemove(true);
      return;
    }
    act("Tarefa removida do cronograma.", () => removeTask(task.id));
  };

  return (
    <Drawer
      open
      onClose={close}
      eyebrow={`${task.date ? dayLabel(task.date, today) : "Sem data"} · ${TASK_STATUS_LABELS[task.status]}`}
      title={taskTitle(task, topics)}
    >
      <p className="-mt-3 mb-4 text-sm text-muted tabular-nums">{taskDetails(task)}</p>

      {!done && (
        <DrawerSection title="Mudar a data">
          {suggestion && suggestion !== task.date && (
            <Button
              className="justify-self-start"
              onClick={() => act(`Tarefa movida para ${dayLabel(suggestion, today).toLowerCase()}.`, () => moveTask(task.id, suggestion))}
            >
              Mover para {dayLabel(suggestion, today).toLowerCase()} (tem espaço)
            </Button>
          )}
          {!suggestion && (
            <p className="text-[13px] text-muted">
              Não há espaço livre nas próximas duas semanas com a sua disponibilidade atual. Escolha uma data ou deixe para
              depois.
            </p>
          )}
          <form onSubmit={moveTo} className="flex flex-wrap items-end gap-2">
            <Field label="Outra data" error={error} className="flex-1">
              <input
                type="date"
                name="date"
                min={today}
                defaultValue={task.date && task.date >= today ? task.date : today}
                onChange={() => setError(null)}
                required
                className={inputStyles}
              />
            </Field>
            <Button type="submit">Mover</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {canSplit(task) && (
              <Button onClick={() => act("Tarefa dividida em duas sessões menores.", () => splitPlanTask(task.id))}>
                Dividir em duas
              </Button>
            )}
            {task.priority !== "baixa" && (
              <Button onClick={() => act("Prioridade reduzida.", () => lowerTaskPriority(task.id))}>Baixar prioridade</Button>
            )}
            {task.status !== "adiada" && (
              <Button onClick={() => act("Tarefa guardada para outra semana.", () => moveTask(task.id, null))}>
                Deixar para outra semana
              </Button>
            )}
          </div>
        </DrawerSection>
      )}

      <DrawerSection title="Tarefa">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => act(done ? "Tarefa reaberta." : "Tarefa concluída.", () => setTaskDone(task.id, !done))}>
            {done ? "Reabrir" : "Marcar como concluída"}
          </Button>
          <Button onClick={remove}>{confirmingRemove ? "Clique de novo para remover" : "Remover"}</Button>
        </div>
        <p className="text-[13px] text-muted">
          Concluir a tarefa não marca o tópico como concluído. Isso você decide em Matérias.
        </p>
      </DrawerSection>

      {!done && (
        <Button
          variant="primary"
          size="lg"
          className="mt-auto w-full"
          onClick={() => {
            if (studyTopic(task.topicId, task)) close();
          }}
        >
          Começar no timer
        </Button>
      )}
    </Drawer>
  );
}
