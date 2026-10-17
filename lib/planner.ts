import { addDays, isDateKey, weekdayIndex } from "./dates";
import { pendingReviews, progressOf, type ProgressMap, type TopicStatus } from "./reviews";
import type { AreaId } from "./syllabus";
import { PRIORITY_WEIGHT, findTopic, visibleTopics, type Priority, type TopicRecord } from "./topics";

export type TaskStatus = "planejada" | "iniciada" | "concluida" | "adiada";
export type PlanStrategy = "equilibrada" | "prioridades";

export interface PlanTask {
  id: string;
  topicId: string | null;
  areaId: AreaId | null;
  kind: "estudo" | "revisao";
  date: string | null;
  minutes: number;
  priority: Priority;
  status: TaskStatus;
  origin: "gerada" | "manual";
  focusSec: number;
}

export interface PlannerSettings {
  availability: number[];
  sessionMinutes: number;
  priorityAreas: AreaId[];
  difficultAreas: AreaId[];
  strongAreas: AreaId[];
  targetDate: string | null;
  strategy: PlanStrategy;
  course: string;
}

export interface PlanContext {
  today: string;
  topics: readonly TopicRecord[];
  progress: ProgressMap;
  tasks: readonly PlanTask[];
  settings: PlannerSettings;
  newId: () => string;
}

export interface PlanLeftover {
  topicId: string;
  kind: PlanTask["kind"];
}

export interface PlanResult {
  tasks: PlanTask[];
  added: PlanTask[];
  removed: PlanTask[];
  leftovers: PlanLeftover[];
}

export interface TaskInput {
  topicId: string | null;
  date: string;
  minutes: number;
  priority: Priority;
}

export const DEFAULT_PLANNER: PlannerSettings = {
  availability: [120, 120, 120, 120, 120, 60, 0],
  sessionMinutes: 50,
  priorityAreas: [],
  difficultAreas: [],
  strongAreas: [],
  targetDate: null,
  strategy: "equilibrada",
  course: "",
};

export const PLAN_DAYS = 7;
export const REVIEW_TASK_MINUTES = 25;
export const MIN_TASK_MINUTES = 10;
export const MAX_TASK_MINUTES = 240;
export const MAX_DAY_MINUTES = 16 * 60;
// Para encontrar espaço ao reagendar, olha duas semanas à frente.
const SUGGESTION_DAYS = 14;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  planejada: "Planejada",
  iniciada: "Iniciada",
  concluida: "Concluída",
  adiada: "Adiada",
};

const STATUS_SCORE: Partial<Record<TopicStatus, number>> = { revisar: 30, and: 20, nao: 10 };

export function planDays(today: string, count = PLAN_DAYS): string[] {
  return Array.from({ length: count }, (_, index) => addDays(today, index));
}

export function availableMinutes(settings: PlannerSettings, date: string): number {
  return Math.max(0, settings.availability[weekdayIndex(date)] ?? 0);
}

// Tarefas concluídas também ocupam o dia: o tempo delas já foi usado.
export function plannedMinutes(tasks: readonly PlanTask[], date: string): number {
  return tasks
    .filter((task) => task.date === date && task.status !== "adiada")
    .reduce((total, task) => total + task.minutes, 0);
}

export function freeMinutes(tasks: readonly PlanTask[], settings: PlannerSettings, date: string): number {
  return Math.max(0, availableMinutes(settings, date) - plannedMinutes(tasks, date));
}

function isRegenerable(task: PlanTask, today: string): boolean {
  return task.origin === "gerada" && task.status === "planejada" && task.date !== null && task.date >= today;
}

export function regenerableTasks(tasks: readonly PlanTask[], today: string): PlanTask[] {
  return tasks.filter((task) => isRegenerable(task, today));
}

function topicScore(topic: TopicRecord, status: TopicStatus, settings: PlannerSettings): number {
  const focusAreas = new Set([...settings.priorityAreas, ...settings.difficultAreas]);
  const areaBonus = focusAreas.has(topic.areaId) ? (settings.strategy === "prioridades" ? 15 : 5) : 0;
  const strongPenalty = settings.strongAreas.includes(topic.areaId) ? 3 : 0;
  return (STATUS_SCORE[status] ?? 0) + PRIORITY_WEIGHT[topic.priority] * 6 + areaBonus - strongPenalty;
}

/*
 * Monta os próximos 7 dias sem passar da disponibilidade de cada dia e sem encolher sessões.
 * Primeiro entram as revisões vencidas ou da semana, depois os tópicos por pontuação.
 * Na estratégia equilibrada, áreas que já têm muito tempo planejado perdem pontos a cada sessão.
 * Tarefas concluídas, iniciadas, manuais ou de dias passados nunca são trocadas.
 */
export function generatePlan({ today, topics, progress, tasks, settings, newId }: PlanContext): PlanResult {
  const removed = regenerableTasks(tasks, today);
  const kept = tasks.filter((task) => !isRegenerable(task, today));
  const days = planDays(today);
  const free = new Map(days.map((date) => [date, freeMinutes(kept, settings, date)]));
  const added: PlanTask[] = [];
  const leftovers: PlanLeftover[] = [];
  const visible = visibleTopics(topics);
  // Um tópico que já tem tarefa nestes dias, mesmo concluída, não ganha outra: evita duplicar ao regenerar.
  const scheduled = new Set(
    kept
      .filter((task) => task.topicId && task.date !== null && task.date >= today)
      .map((task) => `${task.kind}:${task.topicId}`),
  );
  const areaMinutes = new Map<AreaId, number>();
  const addAreaMinutes = (areaId: AreaId | null, minutes: number) => {
    if (areaId) areaMinutes.set(areaId, (areaMinutes.get(areaId) ?? 0) + minutes);
  };
  kept.filter((task) => task.date && days.includes(task.date)).forEach((task) => addAreaMinutes(task.areaId, task.minutes));

  const place = (topic: TopicRecord, kind: PlanTask["kind"], minutes: number, date: string) => {
    const task: PlanTask = {
      id: newId(),
      topicId: topic.id,
      areaId: topic.areaId,
      kind,
      date,
      minutes,
      priority: topic.priority,
      status: "planejada",
      origin: "gerada",
      focusSec: 0,
    };
    added.push(task);
    free.set(date, (free.get(date) ?? 0) - minutes);
    addAreaMinutes(topic.areaId, minutes);
  };

  const reviewMinutes = Math.min(REVIEW_TASK_MINUTES, settings.sessionMinutes);
  for (const { topicId, review } of pendingReviews(progress, visible)) {
    if (review.due > days[days.length - 1] || scheduled.has(`revisao:${topicId}`)) continue;
    const topic = findTopic(visible, topicId);
    const date = days.find((day) => day >= review.due && (free.get(day) ?? 0) >= reviewMinutes);
    if (topic && date) place(topic, "revisao", reviewMinutes, date);
    else leftovers.push({ topicId, kind: "revisao" });
  }

  const candidates = visible
    .map((topic, order) => ({ topic, order, status: progressOf(progress, topic.id).status }))
    .filter(({ topic, status }) => status !== "concluido" && !scheduled.has(`estudo:${topic.id}`))
    .map((candidate) => ({ ...candidate, score: topicScore(candidate.topic, candidate.status, settings) }));
  const loadPenalty = settings.strategy === "equilibrada" ? 4 : 1.5;

  for (const date of days) {
    while ((free.get(date) ?? 0) >= settings.sessionMinutes && candidates.length > 0) {
      let bestIndex = 0;
      let bestScore = -Infinity;
      candidates.forEach((candidate, index) => {
        const adjusted = candidate.score - ((areaMinutes.get(candidate.topic.areaId) ?? 0) / 60) * loadPenalty;
        if (adjusted > bestScore) {
          bestScore = adjusted;
          bestIndex = index;
        }
      });
      const [chosen] = candidates.splice(bestIndex, 1);
      place(chosen.topic, "estudo", settings.sessionMinutes, date);
    }
  }

  // Só os pendentes que mais importam aparecem como "não coube"; os demais seguem na lista de matérias.
  candidates
    .filter(({ topic, status }) => topic.priority === "alta" || status === "revisar" || status === "and")
    .sort((first, second) => second.score - first.score || first.order - second.order)
    .forEach(({ topic }) => leftovers.push({ topicId: topic.id, kind: "estudo" }));

  return { tasks: [...kept, ...added], added, removed, leftovers };
}

export function missedTasks(tasks: readonly PlanTask[], today: string): PlanTask[] {
  return tasks.filter(
    (task) => task.date !== null && task.date < today && (task.status === "planejada" || task.status === "iniciada"),
  );
}

// Primeiro dia, a partir de hoje, com espaço livre para a tarefa inteira. Sem espaço, devolve null.
export function suggestDay(
  tasks: readonly PlanTask[],
  settings: PlannerSettings,
  today: string,
  minutes: number,
  ignoreTaskId?: string,
): string | null {
  const others = tasks.filter((task) => task.id !== ignoreTaskId);
  return planDays(today, SUGGESTION_DAYS).find((date) => freeMinutes(others, settings, date) >= minutes) ?? null;
}

export function rescheduleTask(tasks: readonly PlanTask[], taskId: string, date: string | null): PlanTask[] {
  return tasks.map((task) =>
    task.id === taskId
      ? { ...task, date, status: date === null ? "adiada" : task.status === "adiada" ? "planejada" : task.status }
      : task,
  );
}

export function canSplit(task: PlanTask): boolean {
  return task.minutes >= MIN_TASK_MINUTES * 2 && task.status !== "concluida";
}

// Divide em duas sessões menores, cada uma no primeiro dia com espaço. A que não couber fica adiada.
export function splitTask(
  tasks: readonly PlanTask[],
  taskId: string,
  settings: PlannerSettings,
  today: string,
  newId: () => string,
): PlanTask[] {
  const original = tasks.find((task) => task.id === taskId);
  if (!original || !canSplit(original)) return [...tasks];
  const others = tasks.filter((task) => task.id !== taskId);
  const halves = [Math.ceil(original.minutes / 2), Math.floor(original.minutes / 2)];
  const parts: PlanTask[] = [];
  halves.forEach((minutes, index) => {
    const date = suggestDay([...others, ...parts], settings, today, minutes);
    parts.push({
      ...original,
      id: newId(),
      minutes,
      date,
      status: date === null ? "adiada" : "planejada",
      origin: "manual",
      focusSec: index === 0 ? Math.min(original.focusSec, minutes * 60) : 0,
    });
  });
  return [...others, ...parts];
}

export function lowerPriority(priority: Priority): Priority {
  return priority === "alta" ? "media" : "baixa";
}

export function validateTask(input: TaskInput, today: string): string | null {
  if (!isDateKey(input.date) || input.date < today) return "Escolha hoje ou uma data futura.";
  if (!Number.isInteger(input.minutes) || input.minutes < MIN_TASK_MINUTES || input.minutes > MAX_TASK_MINUTES) {
    return `A duração vai de ${MIN_TASK_MINUTES} a ${MAX_TASK_MINUTES} minutos.`;
  }
  return null;
}

export function validateAvailability(availability: number[]): string | null {
  if (availability.length !== 7) return "Informe os 7 dias da semana.";
  if (availability.some((minutes) => !Number.isFinite(minutes) || minutes < 0 || minutes > MAX_DAY_MINUTES)) {
    return "Cada dia vai de 0 a 16 horas.";
  }
  return null;
}

// O foco registrado com a tarefa ativa soma na tarefa; ela conclui quando o foco alcança a duração planejada.
export function applyFocusToTask(tasks: PlanTask[], taskId: string, seconds: number): PlanTask[] {
  return tasks.map((task) => {
    if (task.id !== taskId || task.status === "concluida") return task;
    const focusSec = task.focusSec + seconds;
    return { ...task, focusSec, status: focusSec >= task.minutes * 60 ? "concluida" : "iniciada" };
  });
}
