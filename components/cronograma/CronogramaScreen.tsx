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
import { ProNotice } from "@/components/ui/ProNotice";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { useStudyTopic } from "@/components/timer/use-study-topic";
import { dayLabel, toDateKey } from "@/lib/dates";
import {
  MAX_TOPICS_PER_DAY,
  generatePlan,
  planDays,
  isStudyDay,
  topicsOn,
  type PlanLeftover,
  type PlanTask,
} from "@/lib/planner";
import { findTopic } from "@/lib/topics";
import { useProAccess } from "@/store/pro";
import { useHydrated, useStudyStore } from "@/store/study-store";
import { PlannerSettingsForm } from "./planner-fields";
import { TaskDrawer } from "./TaskDrawer";
import { TaskForm } from "./TaskForm";
import { isMastered, taskDetails, taskStatusLabel, taskTitle } from "./task-format";

const SUBTITLE =
  "Até 2 matérias por dia, sem obrigação de fazer as duas: o que não der passa para o próximo dia. Estude o tempo que quiser.";

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
  const { regeneratePlan, savePlanner } = useStudyStore.getState();
  const studyTopic = useStudyTopic();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [addingOn, setAddingOn] = useState<string | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [preview, setPreview] = useState<{ added: number; removed: number } | null>(null);
  const [leftovers, setLeftovers] = useState<PlanLeftover[]>([]);
  const [showProNotice, setShowProNotice] = useState(false);
  const proAccess = useProAccess();
  const closeTask = useCallback(() => setOpenTaskId(null), []);

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Cronograma" subtitle={SUBTITLE} />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const today = toDateKey(new Date());
  const days = planDays(today);
  const postponed = tasks.filter((task) => task.status === "adiada");
  const hasPlan = tasks.some((task) => task.date !== null && task.date >= today);
  const hasStudyDays = planner.studyDays.some(Boolean);

  const apply = () => {
    const result = regeneratePlan();
    setPreview(null);
    setLeftovers(result.leftovers);
    showToast(result.added.length ? `Plano atualizado com ${result.added.length} tarefas.` : "Não havia espaço livre para novas tarefas.");
  };

  const requestPlan = () => {
    if (!proAccess) {
      setShowProNotice(true);
      return;
    }
    if (!topics.some((topic) => !topic.hidden)) {
      showToast("Crie seus tópicos em Matérias para gerar o plano.");
      return;
    }
    const result = generatePlan({ today, topics, progress, tasks, settings: planner, newId: () => "" });
    if (result.removed.length === 0) apply();
    else setPreview({ added: result.added.length, removed: result.removed.length });
  };

  const renderTask = (task: PlanTask) => {
    const done = task.status === "concluida";
    return (
      <ListRow
        key={task.id}
        title={<span className={isMastered(task) ? "text-muted line-through" : done ? "text-muted" : ""}>{taskTitle(task, topics)}</span>}
        subtitle={
          <span className="tabular-nums">
            {taskDetails(task)}
            {task.status !== "planejada" && ` · ${taskStatusLabel(task)}`}
          </span>
        }
        end={
          <>
            {!done && task.date === today && (
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
    <div className="grid gap-6">
      <PageHeader title="Cronograma" subtitle={SUBTITLE} />

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={requestPlan} disabled={!hasStudyDays}>
          <RefreshCw size={16} aria-hidden />
          {hasPlan ? "Atualizar plano" : "Gerar plano"}
        </Button>
        <Button onClick={() => setAddingOn(today)}>
          <CalendarPlus size={16} aria-hidden />
          Adicionar tarefa
        </Button>
        <Button onClick={() => setEditingSettings(true)}>
          <SlidersHorizontal size={16} aria-hidden />
          Dias de estudo
        </Button>
        <span className="self-center">
          <ProBadge />
        </span>
      </div>

      {!proAccess && showProNotice && (
        <ProNotice title="O Flow monta a semana por você no Pro" className="max-w-2xl">
          Ele escolhe as matérias de cada dia pelas suas prioridades, revisões e áreas difíceis. No gratuito, você adiciona as
          matérias à mão, e o que ficar sem estudar continua passando sozinho para o próximo dia.
        </ProNotice>
      )}

      {!hasStudyDays && (
        <p className="text-[13px] text-muted">
          Nenhum dia de estudo escolhido. Ajuste em Dias de estudo para organizar a semana.
        </p>
      )}

      {onboarding.status === "pendente" && !hasPlan && (
        <Card>
          <CardHeader title="Monte sua semana em 2 minutos" />
          <p className="mb-4 text-sm text-muted">
            Escolha seus dias de estudo e as áreas que pesam mais. O Flow organiza até 2 matérias por dia, sem limitar horas.
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
            Cada dia recebe no máximo 2 matérias. Estes entram nos próximos dias, conforme as matérias atuais forem dominadas,
            ou você pode incluir mais dias de estudo.
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

      {days.map((date) => {
        const dayTasks = tasks.filter((task) => task.date === date && task.status !== "adiada");
        const studyDay = isStudyDay(planner, date);
        return (
          <Card key={date} flush>
            <CardHeader flush title={capitalize(dayLabel(date, today))}>
              <span className="text-[13px] text-muted tabular-nums">
                {!studyDay && dayTasks.length === 0 ? "Dia livre" : `${topicsOn(tasks, date)} de ${MAX_TOPICS_PER_DAY} matérias`}
              </span>
            </CardHeader>
            {dayTasks.length > 0 ? (
              <ul>{dayTasks.map((task) => renderTask(task))}</ul>
            ) : (
              <p className="px-4 pb-4 text-[13px] text-muted md:px-5">
                {studyDay ? "Nada planejado. " : "Descanso também faz parte. "}
                <button type="button" onClick={() => setAddingOn(date)} className={linkStyles}>
                  Adicionar matéria
                </button>
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
      <Drawer open={editingSettings} onClose={() => setEditingSettings(false)} eyebrow="Cronograma" title="Dias de estudo e preferências">
        <PlannerSettingsForm
          initial={planner}
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
