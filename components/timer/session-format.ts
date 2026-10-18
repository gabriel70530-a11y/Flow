import { studyTitle, type StudySession } from "@/lib/sessions";
import type { TopicRecord } from "@/lib/topics";

export const timeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function sessionTitle(session: StudySession, topics: readonly TopicRecord[]): string {
  return studyTitle(session.topicId, session.areaId, topics, session.subjectId);
}
