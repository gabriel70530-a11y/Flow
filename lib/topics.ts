import { AREAS, type AreaId } from "./syllabus";

export type Priority = "alta" | "media" | "baixa";

export interface TopicRecord {
  id: string;
  areaId: AreaId;
  name: string;
  description: string;
  priority: Priority;
  hidden: boolean;
  origin: "padrao" | "personalizado";
}

export interface TopicInput {
  name: string;
  areaId: AreaId;
  description: string;
  priority: Priority;
}

export type RestoreChange = "reexibir" | "nome" | "descricao" | "area" | "adicionar";

export const PRIORITY_LABELS: Record<Priority, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };
export const PRIORITY_WEIGHT: Record<Priority, number> = { alta: 3, media: 2, baixa: 1 };

export const TOPIC_NAME_MAX = 120;
export const TOPIC_DESCRIPTION_MAX = 500;

export function defaultTopics(): TopicRecord[] {
  return AREAS.flatMap((area) =>
    area.topics.map((name, index) => ({
      id: `${area.id}-${index}`,
      areaId: area.id,
      name,
      description: "",
      priority: "media" as const,
      hidden: false,
      origin: "padrao" as const,
    })),
  );
}

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
    origin: "personalizado",
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

// Só tópicos personalizados podem sair da lista; os padrão apenas se ocultam.
export function deleteTopic(topics: readonly TopicRecord[], id: string): TopicRecord[] {
  return topics.filter((topic) => topic.id !== id || topic.origin === "padrao");
}

export function restoreDefaultsChanges(topics: readonly TopicRecord[]): { topic: TopicRecord; changes: RestoreChange[] }[] {
  return defaultTopics().flatMap((original) => {
    const current = findTopic(topics, original.id);
    if (!current) return [{ topic: original, changes: ["adicionar" as const] }];
    const changes: RestoreChange[] = [];
    if (current.hidden) changes.push("reexibir");
    if (current.name !== original.name) changes.push("nome");
    if (current.description !== original.description) changes.push("descricao");
    if (current.areaId !== original.areaId) changes.push("area");
    return changes.length ? [{ topic: current, changes }] : [];
  });
}

// Devolve os padrões ao original sem tocar em prioridade, personalizados, progresso ou histórico.
export function restoreDefaults(topics: readonly TopicRecord[]): TopicRecord[] {
  const originals = new Map(defaultTopics().map((topic) => [topic.id, topic]));
  const restored = topics.map((topic) => {
    const original = originals.get(topic.id);
    if (!original || topic.origin !== "padrao") return topic;
    return { ...topic, name: original.name, description: original.description, areaId: original.areaId, hidden: false };
  });
  const missing = [...originals.values()].filter((original) => !findTopic(topics, original.id));
  return [...restored, ...missing];
}
