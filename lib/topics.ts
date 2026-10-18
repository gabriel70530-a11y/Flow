import { nextReview, progressOf, type ProgressMap, type TopicStatus } from "./reviews";
import type { AreaId } from "./syllabus";

export type Priority = "alta" | "media" | "baixa";

// Tópico criado pelo estudante dentro de uma das cinco áreas, na ordem em que foi criado.
export interface TopicRecord {
  id: string;
  areaId: AreaId;
  name: string;
  description: string;
  priority: Priority;
  hidden: boolean;
}

export interface TopicInput {
  name: string;
  areaId: AreaId;
  description: string;
  priority: Priority;
}

export const PRIORITY_LABELS: Record<Priority, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };
export const PRIORITY_WEIGHT: Record<Priority, number> = { alta: 3, media: 2, baixa: 1 };

export const TOPIC_NAME_MAX = 120;
export const TOPIC_DESCRIPTION_MAX = 500;

export function findTopic(topics: readonly TopicRecord[], id: string | null): TopicRecord | undefined {
  return id ? topics.find((topic) => topic.id === id) : undefined;
}

export function visibleTopics(topics: readonly TopicRecord[]): TopicRecord[] {
  return topics.filter((topic) => !topic.hidden);
}

export function validateTopic(input: TopicInput, topics: readonly TopicRecord[], editingId?: string): string | null {
  const name = input.name.trim();
  if (!name) return "Dê um nome ao tópico.";
  if (name.length > TOPIC_NAME_MAX) return `Use no máximo ${TOPIC_NAME_MAX} caracteres no nome.`;
  if (input.description.length > TOPIC_DESCRIPTION_MAX) {
    return `Use no máximo ${TOPIC_DESCRIPTION_MAX} caracteres na descrição.`;
  }
  const duplicate = topics.some(
    (topic) =>
      topic.id !== editingId &&
      topic.areaId === input.areaId &&
      topic.name.trim().toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"),
  );
  return duplicate ? "Já existe um tópico com esse nome nesta área." : null;
}

export function createTopic(topics: readonly TopicRecord[], input: TopicInput, id: string): TopicRecord[] {
  const topic: TopicRecord = {
    id,
    areaId: input.areaId,
    name: input.name.trim(),
    description: input.description.trim(),
    priority: input.priority,
    hidden: false,
  };
  return [...topics, topic];
}

export function updateTopic(topics: readonly TopicRecord[], id: string, input: TopicInput): TopicRecord[] {
  return topics.map((topic) =>
    topic.id === id
      ? { ...topic, areaId: input.areaId, name: input.name.trim(), description: input.description.trim(), priority: input.priority }
      : topic,
  );
}

export function setTopicHidden(topics: readonly TopicRecord[], id: string, hidden: boolean): TopicRecord[] {
  return topics.map((topic) => (topic.id === id ? { ...topic, hidden } : topic));
}

export function deleteTopic(topics: readonly TopicRecord[], id: string): TopicRecord[] {
  return topics.filter((topic) => topic.id !== id);
}

export type TopicSort = "criacao" | "nome" | "prioridade" | "status" | "revisao";

export interface TopicFilter {
  query: string;
  areaId: AreaId | "todas";
  status: TopicStatus | "todos";
  priority: Priority | "todas";
}

export const EMPTY_FILTER: TopicFilter = { query: "", areaId: "todas", status: "todos", priority: "todas" };

const STATUS_ORDER: Record<TopicStatus, number> = { revisar: 0, and: 1, nao: 2, concluido: 3 };

function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR").trim();
}

// A busca ignora acentos e maiúsculas e também olha a descrição.
export function filterTopics(topics: readonly TopicRecord[], progress: ProgressMap, filter: TopicFilter): TopicRecord[] {
  const query = normalizeText(filter.query);
  return topics.filter(
    (topic) =>
      !topic.hidden &&
      (filter.areaId === "todas" || topic.areaId === filter.areaId) &&
      (filter.status === "todos" || progressOf(progress, topic.id).status === filter.status) &&
      (filter.priority === "todas" || topic.priority === filter.priority) &&
      (!query || normalizeText(`${topic.name} ${topic.description}`).includes(query)),
  );
}

export function sortTopics(topics: readonly TopicRecord[], progress: ProgressMap, sort: TopicSort): TopicRecord[] {
  const byName = (first: TopicRecord, second: TopicRecord) => first.name.localeCompare(second.name, "pt-BR");
  const dueOf = (topic: TopicRecord) => nextReview(progressOf(progress, topic.id))?.due ?? "9999-12-31";
  const compare: Record<TopicSort, ((first: TopicRecord, second: TopicRecord) => number) | null> = {
    criacao: null,
    nome: byName,
    prioridade: (first, second) => PRIORITY_WEIGHT[second.priority] - PRIORITY_WEIGHT[first.priority] || byName(first, second),
    status: (first, second) =>
      STATUS_ORDER[progressOf(progress, first.id).status] - STATUS_ORDER[progressOf(progress, second.id).status] ||
      byName(first, second),
    revisao: (first, second) => dueOf(first).localeCompare(dueOf(second)) || byName(first, second),
  };
  const comparator = compare[sort];
  return comparator ? [...topics].sort(comparator) : [...topics];
}
