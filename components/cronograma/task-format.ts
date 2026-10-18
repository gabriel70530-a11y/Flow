import { TASK_STATUS_LABELS, type PlanTask } from "@/lib/planner";
import { studyTitle } from "@/lib/sessions";
import { formatDuration } from "@/lib/stats";
import { findArea } from "@/lib/syllabus";
import { PRIORITY_LABELS, type TopicRecord } from "@/lib/topics";

export function taskTitle(task: PlanTask, topics: readonly TopicRecord[]): string {
  return studyTitle(task.topicId, task.areaId, topics);
}

const ORIGIN_LABELS: Partial<Record<PlanTask["origin"], string>> = {
  repeticao: "Repetição",
  transferida: "Veio de outro dia",
};

export function taskDetails(task: PlanTask): string {
  return [
    task.kind === "revisao" ? "Revisão" : null,
    ORIGIN_LABELS[task.origin] ?? null,
    task.areaId ? findArea(task.areaId).name : "Sem área",
    task.priority !== "media" ? `Prioridade ${PRIORITY_LABELS[task.priority].toLowerCase()}` : null,
    task.focusSec > 0 ? `${formatDuration(task.focusSec)} estudados` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

// Tarefa fechada com "Ainda não dominei" não aparece como dominada: a matéria volta em outro dia.
export function taskStatusLabel(task: PlanTask): string {
  if (task.status !== "concluida") return TASK_STATUS_LABELS[task.status];
  return task.outcome === "repetir" ? "Vai repetir em outro dia" : "Dominada";
}

export function isMastered(task: PlanTask): boolean {
  return task.status === "concluida" && task.outcome !== "repetir";
}
