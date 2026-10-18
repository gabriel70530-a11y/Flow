"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerSection } from "@/components/ui/Drawer";
import { Field, inputStyles } from "@/components/ui/Field";
import { showToast } from "@/components/ui/Toast";
import { useStudyTopic } from "@/components/timer/use-study-topic";
import { dayLabel } from "@/lib/dates";
import { suggestDay, type PlanTask } from "@/lib/planner";
import { useStudyStore } from "@/store/study-store";
import { taskDetails, taskStatusLabel, taskTitle } from "./task-format";
import { useAnswerMastery } from "./use-answer-mastery";

interface TaskDrawerProps {
  task: PlanTask | undefined;
  today: string;
  onClose: () => void;
}

export function TaskDrawer({ task, today, onClose }: TaskDrawerProps) {
  const topics = useStudyStore((state) => state.topics);
  const tasks = useStudyStore((state) => state.tasks);
  const planner = useStudyStore((state) => state.planner);
  const { moveTask, setTaskDone, lowerTaskPriority, removeTask } = useStudyStore.getState();
  const answerMastery = useAnswerMastery();
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
  const suggestion = done ? null : suggestDay(tasks, planner, today, task, task.id);
  const act = (message: string, action: () => void) => {
    action();
    showToast(message);
    close();
  };

  const moveTo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const date = String(new FormData(event.currentTarget).get("date") ?? "");
    const problem = moveTask(task.id, date);
    if (problem) {
      setError(problem);
      return;
    }
    showToast(`Tarefa movida para ${dayLabel(date, today).toLowerCase()}.`);
    close();
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
      eyebrow={`${task.date ? dayLabel(task.date, today) : "Sem data"} · ${taskStatusLabel(task)}`}
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
              Os próximos dias de estudo já estão cheios ou são de outra área. Escolha uma data ou deixe para
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

      {!done && (
        <DrawerSection title="Você sente que dominou este conteúdo?">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => {
                answerMastery(task, true);
                close();
              }}
            >
              Dominei
            </Button>
            <Button
              onClick={() => {
                answerMastery(task, false);
                close();
              }}
            >
              Ainda não dominei
            </Button>
          </div>
          <p className="text-[13px] text-muted">
            O tempo é só uma sugestão: estude o quanto conseguir. Se ainda não dominou, a matéria volta no dia seguinte.
          </p>
        </DrawerSection>
      )}

      <DrawerSection title="Tarefa">
        <div className="flex flex-wrap gap-2">
          {done && <Button onClick={() => act("Tarefa reaberta.", () => setTaskDone(task.id, false))}>Reabrir</Button>}
          <Button onClick={remove}>{confirmingRemove ? "Clique de novo para remover" : "Remover"}</Button>
        </div>
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
