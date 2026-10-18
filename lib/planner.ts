import { addDays, isDateKey, weekdayIndex } from "./dates";
import { ENEM_DATES, isFinalStretch } from "./exam";
import { pendingReviews, progressOf, type ProgressMap, type TopicStatus } from "./reviews";
import { focusName, type AreaId, type SubjectId } from "./syllabus";
import { PRIORITY_WEIGHT, findTopic, visibleTopics, type Priority, type TopicRecord } from "./topics";

export type TaskStatus = "planejada" | "iniciada" | "concluida" | "adiada";
export type PlanStrategy = "equilibrada" | "prioridades";

// Uma matéria do dia. Não tem duração: o estudante estuda o tempo que quiser e o foco registrado vai para focusSec.
export interface PlanTask {
  id: string;
  topicId: string | null;
  areaId: AreaId | null;
  subjectId?: SubjectId | null;
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
  // Dias corridos (escola integral, trabalho): recebem só uma matéria no plano gerado.
  lightDays: boolean[];
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

// O assunto de uma tarefa: a área e, em Natureza e Humanas, a matéria.
export type StudyFocus = Pick<PlanTask, "areaId" | "subjectId">;

export interface TaskInput {
  topicId: string | null;
  date: string;
  priority: Priority;
}

export interface RepeatResult {
  tasks: PlanTask[];
  repeat: PlanTask;
  displaced: PlanTask[];
}

export const DEFAULT_PLANNER: PlannerSettings = {
  studyDays: [true, true, true, true, true, true, false],
  lightDays: [false, false, false, false, false, false, false],
  difficultAreas: [],
  strongAreas: [],
  targetDate: ENEM_DATES.first,
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

// Quantas matérias o plano coloca no dia: 2, ou 1 nos dias corridos.
export function dayCapacity(settings: PlannerSettings, date: string): number {
  return settings.lightDays?.[weekdayIndex(date)] ? 1 : MAX_TOPICS_PER_DAY;
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

function topicScore(topic: TopicRecord, status: TopicStatus, settings: PlannerSettings, finalStretch: boolean): number {
  // Na reta final, conteúdo novo perde espaço para o que precisa ser revisado ou já está em andamento.
  const newContentPenalty = finalStretch && status === "nao" ? 25 : 0;
  const areaBonus = settings.difficultAreas.includes(topic.areaId) ? (settings.strategy === "prioridades" ? 15 : 5) : 0;
  const strongPenalty = settings.strongAreas.includes(topic.areaId) ? 3 : 0;
  return (STATUS_SCORE[status] ?? 0) + PRIORITY_WEIGHT[topic.priority] * 6 + areaBonus - strongPenalty - newContentPenalty;
}

/*
 * Cada dia é de um assunto só: duas de Matemática, nunca Matemática e Linguagens; duas de Química, nunca
 * Química e Biologia. Estudo geral cabe em qualquer dia, e a área inteira cabe com qualquer matéria dela.
 */
function compatible(first: StudyFocus, second: StudyFocus): boolean {
  if (first.areaId === null || second.areaId === null) return true;
  if (first.areaId !== second.areaId) return false;
  return !first.subjectId || !second.subjectId || first.subjectId === second.subjectId;
}

export function fitsDay(onDay: readonly PlanTask[], focus: StudyFocus): boolean {
  return onDay.every((task) => compatible(task, focus));
}

// O assunto que o dia já tem, preferindo a matéria quando houver.
export function dayFocus(tasks: readonly PlanTask[], date: string): StudyFocus | null {
  const onDay = dayTasks(tasks, date);
  const specific = onDay.find((task) => task.subjectId) ?? onDay.find((task) => task.areaId !== null);
  return specific ? { areaId: specific.areaId, subjectId: specific.subjectId ?? null } : null;
}

// Motivo para uma matéria não entrar num dia ao ser adicionada ou movida à mão; null quando cabe.
export function dayConflict(
  tasks: readonly PlanTask[],
  date: string,
  focus: StudyFocus,
  ignoreTaskId?: string,
): string | null {
  const others = tasks.filter((task) => task.id !== ignoreTaskId);
  if (topicsOn(others, date) >= MAX_TOPICS_PER_DAY) return "Esse dia já tem 2 matérias. Escolha outro dia.";
  const current = dayFocus(others, date);
  if (current?.areaId && !fitsDay(dayTasks(others, date), focus)) {
    const name = focusName(current.areaId, current.subjectId);
    return `Esse dia é de ${name}. Escolha outro dia ou algo de ${name}.`;
  }
  return null;
}

/*
 * Organiza os próximos 7 dias: em cada dia de estudo, até duas matérias do mesmo assunto.
 * Primeiro entram as revisões vencidas ou do dia, depois os tópicos por pontuação; a primeira matéria define o assunto do dia.
 * Na estratégia equilibrada, áreas que já aparecem muito na semana perdem pontos, então os dias alternam entre as áreas.
 * Tarefas concluídas, iniciadas, manuais, repetições, transferidas ou de dias passados nunca são trocadas.
 */
export function generatePlan({ today, topics, progress, tasks, settings, newId }: PlanContext): PlanResult {
  const removed = regenerableTasks(tasks, today);
  const kept = tasks.filter((task) => !isRegenerable(task, today));
  const days = planDays(today);
  const added: PlanTask[] = [];
  const leftovers: PlanLeftover[] = [];
  const visible = visibleTopics(topics);
  const finalStretch = isFinalStretch(settings.targetDate, today);
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
    .map((candidate) => ({ ...candidate, score: topicScore(candidate.topic, candidate.status, settings, finalStretch) }));
  const loadPenalty = settings.strategy === "equilibrada" ? 4 : 1.5;

  const pickTopic = (focus: StudyFocus | null): TopicRecord | null => {
    let bestIndex = -1;
    let bestScore = -Infinity;
    candidates.forEach((candidate, index) => {
      if (focus && !compatible(focus, candidate.topic)) return;
      const adjusted = candidate.score - (areaTasks.get(candidate.topic.areaId) ?? 0) * loadPenalty;
      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestIndex = index;
      }
    });
    return bestIndex >= 0 ? candidates.splice(bestIndex, 1)[0].topic : null;
  };

  const place = (topic: TopicRecord, kind: PlanTask["kind"], date: string) => {
    added.push({
      id: newId(),
      topicId: topic.id,
      areaId: topic.areaId,
      subjectId: topic.subjectId,
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
    let focus = dayFocus(kept, date);
    let slots = dayCapacity(settings, date) - topicsOn(kept, date);
    while (slots > 0) {
      const reviewIndex = reviews.findIndex(({ topicId, review }) => {
        const topic = findTopic(visible, topicId);
        return review.due <= date && topic !== undefined && (!focus || compatible(focus, topic));
      });
      const reviewTopic = reviewIndex >= 0 ? findTopic(visible, reviews.splice(reviewIndex, 1)[0].topicId) : undefined;
      const topic = reviewTopic ?? pickTopic(focus);
      if (!topic) break;
      place(topic, reviewTopic ? "revisao" : "estudo", date);
      focus = { areaId: topic.areaId, subjectId: focus?.subjectId ?? topic.subjectId };
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

// Primeiro dia de estudo, a partir de hoje, do mesmo assunto (ou vazio) e com menos de duas matérias. Sem espaço, devolve null.
export function suggestDay(
  tasks: readonly PlanTask[],
  settings: PlannerSettings,
  today: string,
  focus: StudyFocus,
  ignoreTaskId?: string,
): string | null {
  const others = tasks.filter((task) => task.id !== ignoreTaskId);
  return (
    planDays(today, SUGGESTION_DAYS).find((date) => {
      const onDay = dayTasks(others, date);
      return isStudyDay(settings, date) && onDay.length < dayCapacity(settings, date) && fitsDay(onDay, focus);
    }) ?? null
  );
}

interface Slot {
  date: string;
  displaced: PlanTask[];
}

/*
 * Primeiro dia de estudo, a partir de `from`, que recebe mais uma matéria do assunto da tarefa:
 * - dia vazio ou do mesmo assunto, com vaga: entra direto;
 * - dia do mesmo assunto já cheio: sai uma tarefa gerada e não começada, de preferência um estudo e não uma revisão;
 * - dia de outro assunto em que tudo é gerado e não começado: o dia passa a ser deste assunto e essas tarefas saem.
 * Manuais, repetições, transferidas, iniciadas e concluídas nunca saem.
 */
function findSlot(
  tasks: readonly PlanTask[],
  settings: PlannerSettings,
  today: string,
  from: string,
  focus: StudyFocus,
): Slot | null {
  for (const date of planDays(from, SUGGESTION_DAYS)) {
    if (!isStudyDay(settings, date)) continue;
    const onDay = dayTasks(tasks, date);
    const flexible = onDay.filter((item) => isRegenerable(item, today));
    if (fitsDay(onDay, focus)) {
      if (onDay.length < dayCapacity(settings, date)) return { date, displaced: [] };
      const displaced = flexible.filter((item) => item.kind === "estudo").at(-1) ?? flexible.at(-1);
      if (displaced) return { date, displaced: [displaced] };
    } else if (onDay.length > 0 && flexible.length === onDay.length) {
      return { date, displaced: onDay };
    }
  }
  return null;
}

/*
 * Coloca a tarefa no primeiro dia de estudo com vaga a partir de `from`. As tarefas geradas que saírem
 * do lugar passam adiante para o próximo dia com vaga, em cadeia, em vez de sumir do plano.
 * Sem vaga em duas semanas, a tarefa fica adiada.
 */
function placeInPlan(
  tasks: readonly PlanTask[],
  task: PlanTask,
  settings: PlannerSettings,
  today: string,
  from: string,
): { tasks: PlanTask[]; placed: PlanTask; displaced: PlanTask[] } {
  let current = tasks.filter((item) => item.id !== task.id);
  const queue: { task: PlanTask; from: string }[] = [{ task, from }];
  let first: { placed: PlanTask; displaced: PlanTask[] } | null = null;
  while (queue.length > 0) {
    const { task: pending, from: searchFrom } = queue.shift()!;
    const slot = findSlot(current, settings, today, searchFrom, pending);
    const placed: PlanTask = slot ? { ...pending, date: slot.date } : { ...pending, date: null, status: "adiada" };
    const displaced = slot?.displaced ?? [];
    current = [...current.filter((item) => !displaced.includes(item)), placed];
    first ??= { placed, displaced };
    for (const item of displaced) {
      queue.push({ task: { ...item, origin: "transferida" }, from: addDays(slot!.date, 1) });
    }
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
    subjectId: task.subjectId,
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

/*
 * Dia leve: hoje fica só a primeira matéria ainda não feita (a iniciada, se houver). As outras planejadas
 * passam para o próximo dia de estudo com vaga, pela mesma regra das transferências.
 */
export function lightenDay(
  tasks: readonly PlanTask[],
  settings: PlannerSettings,
  today: string,
): { tasks: PlanTask[]; moved: PlanTask[] } {
  const open = dayTasks(tasks, today).filter((task) => task.status === "planejada" || task.status === "iniciada");
  const keep = open.find((task) => task.status === "iniciada") ?? open[0];
  const toMove = open.filter((task) => task !== keep && task.status === "planejada");
  let current = [...tasks];
  const moved: PlanTask[] = [];
  for (const task of toMove) {
    const carried: PlanTask = { ...task, origin: task.origin === "gerada" ? "transferida" : task.origin };
    const result = placeInPlan(current, carried, settings, today, addDays(today, 1));
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
