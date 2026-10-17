"use client";

import { CalendarPlus, RefreshCw, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Button, buttonStyles, linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { ListRow } from "@/components/ui/ListRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProBadge } from "@/components/ui/ProBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { useStudyTopic } from "@/components/timer/use-study-topic";
import { dayLabel, toDateKey } from "@/lib/dates";
import {
  TASK_STATUS_LABELS,
  availableMinutes,
  generatePlan,
  missedTasks,
  planDays,
  plannedMinutes,
  suggestDay,
  type PlanLeftover,
  type PlanTask,
} from "@/lib/planner";
import { hasProAccess } from "@/lib/plan";
import { findTopic } from "@/lib/topics";
import { useHydrated, useStudyStore } from "@/store/study-store";
import { PlannerSettingsForm } from "./planner-fields";
import { TaskDrawer } from "./TaskDrawer";
import { TaskForm } from "./TaskForm";
import { taskDetails, taskTitle } from "./task-format";

const SUBTITLE = "Seus próximos 7 dias, dentro do tempo que você tem.";

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function CronogramaScreen() {
  const hydrated = useHydrated();
  const tasks = useStudyStore((state) => state.tasks);
  const topics = useStudyStore((state) => state.topics);
  const progress = useStudyStore((state) => state.progress);
  const planner = useStudyStore((state) => state.planner);
  const onboarding = useStudyStore((state) => state.onboarding);
  const { regeneratePlan, savePlanner, moveTask } = useStudyStore.getState();
  const studyTopic = useStudyTopic();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [addingOn, setAddingOn] = useState<string | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [preview, setPreview] = useState<{ added: number; removed: number } | null>(null);
  const [leftovers, setLeftovers] = useState<PlanLeftover[]>([]);
  const closeTask = useCallback(() => setOpenTaskId(null), []);

  if (!hydrated) {
    return (
      <div className="grid gap-5">
        <PageHeader title="Cronograma" subtitle={SUBTITLE} />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const today = toDateKey(new Date());
  const days = planDays(today);
  const missed = missedTasks(tasks, today);
  const postponed = tasks.filter((task) => task.status === "adiada");
  const hasPlan = tasks.some((task) => task.date !== null && task.date >= today);
  const proAccess = hasProAccess();
  const weekCapacity = days.reduce((sum, date) => sum + availableMinutes(planner, date), 0);

  const apply = () => {
    const result = regeneratePlan();
    setPreview(null);
    setLeftovers(result.leftovers);
    showToast(result.added.length ? `Plano atualizado com ${result.added.length} tarefas.` : "Não havia espaço livre para novas tarefas.");
  };

  const requestPlan = () => {
    const result = generatePlan({ today, topics, progress, tasks, settings: planner, newId: () => "" });
    if (result.removed.length === 0) apply();
    else setPreview({ added: result.added.length, removed: result.removed.length });
  };

  const renderTask = (task: PlanTask, missedRow = false) => {
    const done = task.status === "concluida";
    const suggestion = missedRow ? suggestDay(tasks, planner, today, task.minutes, task.id) : null;
    return (
      <ListRow
        key={task.id}
        title={<span className={done ? "text-muted line-through" : ""}>{taskTitle(task, topics)}</span>}
        subtitle={
          <span className="tabular-nums">
            {taskDetails(task)}
            {task.status !== "planejada" && ` · ${TASK_STATUS_LABELS[task.status]}`}
            {missedRow && task.date && ` · era ${dayLabel(task.date, today).toLowerCase()}`}
          </span>
        }
        end={
          <>
            {suggestion && (
              <Button
                onClick={() => {
                  moveTask(task.id, suggestion);
                  showToast(`Tarefa movida para ${dayLabel(suggestion, today).toLowerCase()}.`);
                }}
              >
                Mover p/ {dayLabel(suggestion, today).toLowerCase()}
              </Button>
            )}
            {!done && !missedRow && task.date === today && (
              <Button variant="primary" onClick={() => studyTopic(task.topicId, task)}>
                Começar
              </Button>
            )}
            <Button onClick={() => setOpenTaskId(task.id)} aria-label={`Opções de ${taskTitle(task, topics)}`}>
              Opções
            </Button>
          </>
        }
      />
    );
  };

  return (
    <div className="grid gap-5">
      <PageHeader title="Cronograma" subtitle={SUBTITLE} />

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={requestPlan} disabled={weekCapacity === 0 || !proAccess}>
          <RefreshCw size={16} aria-hidden />
          {hasPlan ? "Atualizar plano" : "Gerar plano"}
        </Button>
        <Button onClick={() => setAddingOn(today)}>
          <CalendarPlus size={16} aria-hidden />
          Adicionar tarefa
        </Button>
        <Button onClick={() => setEditingSettings(true)}>
          <SlidersHorizontal size={16} aria-hidden />
          Disponibilidade
        </Button>
        <span className="self-center">
          <ProBadge />
        </span>
      </div>

      {!proAccess && (
        <p className="text-[13px] text-muted">
          O plano sugerido faz parte do Pro. Você ainda pode adicionar e organizar tarefas à mão.{" "}
          <Link href="/planos" className={linkStyles}>
            Ver planos
          </Link>
        </p>
      )}

      {weekCapacity === 0 && (
        <p className="text-[13px] text-muted">
          Sua disponibilidade está zerada. Ajuste em Disponibilidade para gerar um plano.
        </p>
      )}

      {onboarding.status === "pendente" && !hasPlan && (
        <Card>
          <CardHeader title="Monte sua semana em 2 minutos" />
          <p className="mb-4 text-sm text-muted">
            Conte quanto tempo você tem em cada dia e quais áreas pesam mais. O ENEM Flow sugere um plano que cabe na sua rotina.
            Você pode mudar tudo depois, ou montar sozinho.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/comecar" className={buttonStyles("primary")}>
              Começar
            </Link>
            <Button onClick={() => setAddingOn(today)}>Montar sozinho</Button>
          </div>
        </Card>
      )}

      {preview && (
        <Card>
          <CardHeader title="Atualizar o plano?" />
          <p className="mb-4 text-sm">
            {preview.removed} {preview.removed === 1 ? "tarefa planejada sai" : "tarefas planejadas saem"} e {preview.added}{" "}
            {preview.added === 1 ? "nova entra" : "novas entram"}. Tarefas concluídas, iniciadas, de dias anteriores e as que você
            criou ficam como estão.
          </p>
          <div className="flex gap-2">
            <Button variant="primary" onClick={apply}>
              Atualizar
            </Button>
            <Button onClick={() => setPreview(null)}>Cancelar</Button>
          </div>
        </Card>
      )}

      {leftovers.length > 0 && (
        <Card>
          <CardHeader title="Não coube nesta semana">
            <button type="button" onClick={() => setLeftovers([])} className="text-[13px] text-muted underline underline-offset-3">
              Fechar
            </button>
          </CardHeader>
          <p className="mb-2 text-sm text-muted">
            Para incluir estes, aumente o tempo de algum dia ou use sessões mais curtas em Disponibilidade. Nada foi espremido para
            caber.
          </p>
          <ul className="grid gap-1 text-sm">
            {leftovers.slice(0, 6).map((leftover) => (
              <li key={`${leftover.kind}-${leftover.topicId}`}>
                {findTopic(topics, leftover.topicId)?.name}
                {leftover.kind === "revisao" && <span className="text-muted"> · revisão</span>}
              </li>
            ))}
          </ul>
          {leftovers.length > 6 && <p className="mt-1 text-[13px] text-muted">E mais {leftovers.length - 6}.</p>}
        </Card>
      )}

      {missed.length > 0 && (
        <Card flush>
          <CardHeader flush title="Ficou para depois">
            <span className="text-[13px] text-muted tabular-nums">{missed.length}</span>
          </CardHeader>
          <p className="px-4 pb-2 text-[13px] text-muted md:px-5">
            Acontece. Escolha um dia com espaço, divida em sessões menores ou deixe para outra semana.
          </p>
          <ul>{missed.map((task) => renderTask(task, true))}</ul>
        </Card>
      )}

      {days.map((date) => {
        const dayTasks = tasks.filter((task) => task.date === date && task.status !== "adiada");
        const available = availableMinutes(planner, date);
        const planned = plannedMinutes(tasks, date);
        return (
          <Card key={date} flush>
            <CardHeader flush title={capitalize(dayLabel(date, today))}>
              <span className={`text-[13px] tabular-nums ${planned > available ? "text-danger" : "text-muted"}`}>
                {available === 0 && planned === 0 ? "Dia livre" : `${planned} de ${available} min`}
              </span>
            </CardHeader>
            {dayTasks.length > 0 ? (
              <ul>{dayTasks.map((task) => renderTask(task))}</ul>
            ) : (
              <p className="px-4 pb-4 text-[13px] text-muted md:px-5">
                {available === 0 ? "Descanso também faz parte." : "Nada planejado. "}
                {available > 0 && (
                  <button type="button" onClick={() => setAddingOn(date)} className={linkStyles}>
                    Adicionar tarefa
                  </button>
                )}
              </p>
            )}
          </Card>
        );
      })}

      {postponed.length > 0 && (
        <Card flush>
          <CardHeader flush title="Para outra semana">
            <span className="text-[13px] text-muted tabular-nums">{postponed.length}</span>
          </CardHeader>
          <ul>{postponed.map((task) => renderTask(task))}</ul>
        </Card>
      )}

      <TaskDrawer task={tasks.find((task) => task.id === openTaskId)} today={today} onClose={closeTask} />
      <Drawer open={addingOn !== null} onClose={() => setAddingOn(null)} eyebrow="Cronograma" title="Nova tarefa">
        {addingOn && (
          <TaskForm
            today={today}
            initialDate={addingOn}
            onDone={() => {
              setAddingOn(null);
              showToast("Tarefa adicionada.");
            }}
          />
        )}
      </Drawer>
      <Drawer open={editingSettings} onClose={() => setEditingSettings(false)} eyebrow="Cronograma" title="Disponibilidade e preferências">
        <PlannerSettingsForm
          initial={planner}
          today={today}
          submitLabel="Salvar"
          onSubmit={(settings) => {
            const error = savePlanner(settings);
            if (!error) {
              setEditingSettings(false);
              showToast("Preferências salvas. Use Atualizar plano para aplicar.");
            }
            return error;
          }}
        />
      </Drawer>
    </div>
  );
}
