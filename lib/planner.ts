import { addDays, isDateKey, weekdayIndex } from "./dates";
import { pendingReviews, progressOf, type ProgressMap, type TopicStatus } from "./reviews";
import type { AreaId } from "./syllabus";
import { PRIORITY_WEIGHT, findTopic, visibleTopics, type Priority, type TopicRecord } from "./topics";

export type TaskStatus = "planejada" | "iniciada" | "concluida" | "adiada";
export type PlanStrategy = "equilibrada" | "prioridades";

// Uma matéria do dia. Não tem duração: o estudante estuda o tempo que quiser e o foco registrado vai para focusSec.
export interface PlanTask {
  id: string;
  topicId: string | null;
  areaId: AreaId | null;
  kind: "estudo" | "revisao";
  date: string | null;
  priority: Priority;
  status: TaskStatus;
  origin: "gerada" | "manual" | "repeticao" | "transferida";
  focusSec: number;
  // Como a pessoa respondeu ao fechar a tarefa: dominou ou vai repetir a matéria em outro dia.
  outcome?: "dominada" | "repetir";
}

export interface PlannerSettings {
  // De segunda (0) a domingo (6): em quais dias a pessoa quer receber matérias. Não limita horas.
  studyDays: boolean[];
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
  priority: Priority;
}

export interface RepeatResult {
  tasks: PlanTask[];
  repeat: PlanTask;
  displaced: PlanTask | null;
}

export const DEFAULT_PLANNER: PlannerSettings = {
  studyDays: [true, true, true, true, true, true, false],
  difficultAreas: [],
  strongAreas: [],
  targetDate: null,
  strategy: "equilibrada",
  course: "",
};

export const PLAN_DAYS = 7;
// No máximo duas matérias por dia, sem obrigação de fazer as duas. O tempo de estudo nunca é limitado.
export const MAX_TOPICS_PER_DAY = 2;
// Para encontrar um dia com espaço ao reagendar, repetir ou transferir, olha duas semanas à frente.
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

export function isStudyDay(settings: PlannerSettings, date: string): boolean {
  return settings.studyDays[weekdayIndex(date)] ?? false;
}

function dayTasks(tasks: readonly PlanTask[], date: string): PlanTask[] {
  return tasks.filter((task) => task.date === date && task.status !== "adiada");
}

export function topicsOn(tasks: readonly PlanTask[], date: string): number {
  return dayTasks(tasks, date).length;
}

function isRegenerable(task: PlanTask, today: string): boolean {
  return task.origin === "gerada" && task.status === "planejada" && task.date !== null && task.date >= today;
}

export function regenerableTasks(tasks: readonly PlanTask[], today: string): PlanTask[] {
  return tasks.filter((task) => isRegenerable(task, today));
}

function topicScore(topic: TopicRecord, status: TopicStatus, settings: PlannerSettings): number {
  const areaBonus = settings.difficultAreas.includes(topic.areaId) ? (settings.strategy === "prioridades" ? 15 : 5) : 0;
  const strongPenalty = settings.strongAreas.includes(topic.areaId) ? 3 : 0;
  return (STATUS_SCORE[status] ?? 0) + PRIORITY_WEIGHT[topic.priority] * 6 + areaBonus - strongPenalty;
}

/*
 * Organiza os próximos 7 dias: em cada dia de estudo, até duas matérias.
 * Primeiro entram as revisões vencidas ou do dia, depois os tópicos por pontuação.
 * Na estratégia equilibrada, áreas que já aparecem muito na semana perdem pontos a cada tarefa.
 * Tarefas concluídas, iniciadas, manuais, repetições, transferidas ou de dias passados nunca são trocadas.
 */
export function generatePlan({ today, topics, progress, tasks, settings, newId }: PlanContext): PlanResult {
  const removed = regenerableTasks(tasks, today);
  const kept = tasks.filter((task) => !isRegenerable(task, today));
  const days = planDays(today);
  const added: PlanTask[] = [];
  const leftovers: PlanLeftover[] = [];
  const visible = visibleTopics(topics);
  // Um tópico que já tem tarefa nestes dias, mesmo concluída, não ganha outra: evita duplicar ao regenerar.
  const scheduled = new Set(
    kept
      .filter((task) => task.topicId && task.date !== null && task.date >= today)
      .map((task) => `${task.kind}:${task.topicId}`),
  );
  const areaTasks = new Map<AreaId, number>();
  const countArea = (areaId: AreaId | null) => {
    if (areaId) areaTasks.set(areaId, (areaTasks.get(areaId) ?? 0) + 1);
  };
  kept.filter((task) => task.date && days.includes(task.date)).forEach((task) => countArea(task.areaId));

  const reviews = pendingReviews(progress, visible).filter(
    ({ topicId, review }) => review.due <= days[days.length - 1] && !scheduled.has(`revisao:${topicId}`),
  );
  const candidates = visible
    .map((topic, order) => ({ topic, order, status: progressOf(progress, topic.id).status }))
    .filter(({ topic, status }) => status !== "concluido" && !scheduled.has(`estudo:${topic.id}`))
    .map((candidate) => ({ ...candidate, score: topicScore(candidate.topic, candidate.status, settings) }));
  const loadPenalty = settings.strategy === "equilibrada" ? 4 : 1.5;

  const pickTopic = (): TopicRecord => {
    let bestIndex = 0;
    let bestScore = -Infinity;
    candidates.forEach((candidate, index) => {
      const adjusted = candidate.score - (areaTasks.get(candidate.topic.areaId) ?? 0) * loadPenalty;
      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestIndex = index;
      }
    });
    return candidates.splice(bestIndex, 1)[0].topic;
  };

  const place = (topic: TopicRecord, kind: PlanTask["kind"], date: string) => {
    added.push({
      id: newId(),
      topicId: topic.id,
      areaId: topic.areaId,
      kind,
      date,
      priority: topic.priority,
      status: "planejada",
      origin: "gerada",
      focusSec: 0,
    });
    countArea(topic.areaId);
  };

  for (const date of days) {
    if (!isStudyDay(settings, date)) continue;
    let slots = MAX_TOPICS_PER_DAY - topicsOn(kept, date);
    while (slots > 0) {
      const reviewIndex = reviews.findIndex(({ review }) => review.due <= date);
      if (reviewIndex >= 0) {
        const topic = findTopic(visible, reviews.splice(reviewIndex, 1)[0].topicId);
        if (!topic) continue;
        place(topic, "revisao", date);
      } else if (candidates.length > 0) {
        place(pickTopic(), "estudo", date);
      } else {
        break;
      }
      slots--;
    }
  }

  reviews.forEach(({ topicId }) => leftovers.push({ topicId, kind: "revisao" }));
  // Só os pendentes que mais importam aparecem como "fica para a próxima semana"; os demais seguem em Matérias.
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

// Primeiro dia de estudo, a partir de hoje, com menos de duas matérias. Sem espaço, devolve null.
export function suggestDay(
  tasks: readonly PlanTask[],
  settings: PlannerSettings,
  today: string,
  ignoreTaskId?: string,
): string | null {
  const others = tasks.filter((task) => task.id !== ignoreTaskId);
  return (
    planDays(today, SUGGESTION_DAYS).find(
      (date) => isStudyDay(settings, date) && topicsOn(others, date) < MAX_TOPICS_PER_DAY,
    ) ?? null
  );
}

interface Slot {
  date: string;
  displaced: PlanTask | null;
}

/*
 * Primeiro dia de estudo, a partir de `from`, que recebe mais uma matéria. Se o dia já tem duas,
 * uma tarefa gerada e ainda não começada sai para dar lugar, de preferência um estudo e não uma revisão;
 * manuais, repetições, transferidas, iniciadas e concluídas nunca saem.
 */
function findSlot(tasks: readonly PlanTask[], settings: PlannerSettings, today: string, from: string): Slot | null {
  for (const date of planDays(from, SUGGESTION_DAYS)) {
    if (!isStudyDay(settings, date)) continue;
    const onDay = dayTasks(tasks, date);
    if (onDay.length < MAX_TOPICS_PER_DAY) return { date, displaced: null };
    const flexible = onDay.filter((item) => isRegenerable(item, today));
    const displaced = flexible.filter((item) => item.kind === "estudo").at(-1) ?? flexible.at(-1);
    if (displaced) return { date, displaced };
  }
  return null;
}

/*
 * Coloca a tarefa no primeiro dia de estudo com vaga a partir de `from`. Se ela tirar uma tarefa gerada
 * do lugar, essa tarefa passa adiante para o próximo dia com vaga, em cadeia, em vez de sumir do plano.
 * Sem vaga em duas semanas, a tarefa fica adiada.
 */
function placeInPlan(
  tasks: readonly PlanTask[],
  task: PlanTask,
  settings: PlannerSettings,
  today: string,
  from: string,
): { tasks: PlanTask[]; placed: PlanTask; displaced: PlanTask | null } {
  let current = tasks.filter((item) => item.id !== task.id);
  let pending: PlanTask | null = task;
  let searchFrom = from;
  let first: { placed: PlanTask; displaced: PlanTask | null } | null = null;
  while (pending) {
    const slot = findSlot(current, settings, today, searchFrom);
    const placed: PlanTask = slot ? { ...pending, date: slot.date } : { ...pending, date: null, status: "adiada" };
    current = [...current.filter((item) => item !== slot?.displaced), placed];
    first ??= { placed, displaced: slot?.displaced ?? null };
    pending = slot?.displaced ? { ...slot.displaced, origin: "transferida" } : null;
    if (slot) searchFrom = addDays(slot.date, 1);
  }
  return { tasks: current, placed: first!.placed, displaced: first!.displaced };
}

// Quem ainda não dominou a matéria estuda de novo no próximo dia de estudo, de preferência amanhã.
export function repeatNextDay(
  tasks: readonly PlanTask[],
  task: PlanTask,
  settings: PlannerSettings,
  today: string,
  newId: () => string,
): RepeatResult {
  const repeat: PlanTask = {
    id: newId(),
    topicId: task.topicId,
    areaId: task.areaId,
    kind: task.kind,
    date: null,
    priority: task.priority,
    status: "planejada",
    origin: "repeticao",
    focusSec: 0,
  };
  const result = placeInPlan(tasks, repeat, settings, today, addDays(today, 1));
  return { tasks: result.tasks, repeat: result.placed, displaced: result.displaced };
}

/*
 * Estudar as duas matérias do dia não é obrigatório: o que ficou sem estudar em dias anteriores passa
 * sozinho para o próximo dia de estudo (de preferência hoje), sem passar de duas matérias por dia.
 */
export function carryOverMissed(
  tasks: readonly PlanTask[],
  settings: PlannerSettings,
  today: string,
): { tasks: PlanTask[]; moved: PlanTask[] } {
  const missed = missedTasks(tasks, today).sort((first, second) => (first.date ?? "").localeCompare(second.date ?? ""));
  let current = [...tasks];
  const moved: PlanTask[] = [];
  for (const task of missed) {
    const carried: PlanTask = { ...task, origin: task.origin === "gerada" ? "transferida" : task.origin };
    const result = placeInPlan(current, carried, settings, today, today);
    current = result.tasks;
    moved.push(result.placed);
  }
  return { tasks: current, moved };
}

export function rescheduleTask(tasks: readonly PlanTask[], taskId: string, date: string | null): PlanTask[] {
  return tasks.map((task) =>
    task.id === taskId
      ? { ...task, date, status: date === null ? "adiada" : task.status === "adiada" ? "planejada" : task.status }
      : task,
  );
}

export function lowerPriority(priority: Priority): Priority {
  return priority === "alta" ? "media" : "baixa";
}

export function validateTask(input: TaskInput, today: string): string | null {
  return !isDateKey(input.date) || input.date < today ? "Escolha hoje ou uma data futura." : null;
}

export function validateStudyDays(studyDays: boolean[]): string | null {
  if (studyDays.length !== 7) return "Informe os 7 dias da semana.";
  return studyDays.some(Boolean) ? null : "Escolha pelo menos um dia para estudar.";
}

// O foco registrado com a tarefa ativa soma nela. Quem conclui a tarefa é o estudante, ao dizer se dominou.
export function applyFocusToTask(tasks: PlanTask[], taskId: string, seconds: number): PlanTask[] {
  return tasks.map((task) =>
    task.id !== taskId || task.status === "concluida"
      ? task
      : { ...task, focusSec: task.focusSec + seconds, status: "iniciada" },
  );
}
