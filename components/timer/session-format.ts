import type { StudySession } from "@/lib/sessions";
import { findTopic, type TopicRecord } from "@/lib/topics";

export const timeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function sessionTitle(session: StudySession, topics: readonly TopicRecord[]): string {
  if (!session.topicId) return "Estudo geral";
  return findTopic(topics, session.topicId)?.name ?? "Tópico excluído";
}
