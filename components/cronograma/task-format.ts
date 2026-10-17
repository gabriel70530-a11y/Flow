import type { PlanTask } from "@/lib/planner";
import { formatDuration } from "@/lib/stats";
import { findArea } from "@/lib/syllabus";
import { PRIORITY_LABELS, findTopic, type TopicRecord } from "@/lib/topics";

export function taskTitle(task: PlanTask, topics: readonly TopicRecord[]): string {
  if (!task.topicId) return "Estudo geral";
  return findTopic(topics, task.topicId)?.name ?? "Tópico excluído";
}

export function taskDetails(task: PlanTask): string {
  return [
    task.kind === "revisao" ? "Revisão" : null,
    task.areaId ? findArea(task.areaId).name : "Sem área",
    formatDuration(task.minutes * 60),
    task.priority !== "media" ? `Prioridade ${PRIORITY_LABELS[task.priority].toLowerCase()}` : null,
    task.status === "iniciada" ? `${formatDuration(task.focusSec)} feitos` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export const MINUTE_OPTIONS = [0, 15, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360, 480];
export const SESSION_OPTIONS = [25, 30, 45, 50, 60, 90];

export function minutesLabel(minutes: number): string {
  return minutes === 0 ? "Livre" : formatDuration(minutes * 60);
}
