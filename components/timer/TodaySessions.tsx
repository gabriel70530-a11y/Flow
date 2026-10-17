"use client";

import { Trash2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { ListRow } from "@/components/ui/ListRow";
import { showToast } from "@/components/ui/Toast";
import { formatDuration, formatHours, secondsOn } from "@/lib/stats";
import { findTopic } from "@/lib/syllabus";
import { useStudyStore } from "@/store/study-store";

const timeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function TodaySessions({ today }: { today: string }) {
  const sessions = useStudyStore((state) => state.sessions);
  const deleteSession = useStudyStore((state) => state.deleteSession);
  const todaySessions = sessions.filter((session) => session.date === today).sort((first, second) => second.ts - first.ts);

  const remove = (sessionId: string) => {
    deleteSession(sessionId);
    showToast("Sessão excluída.");
  };

  return (
    <Card flush>
      <CardHeader flush title="Hoje">
        {todaySessions.length > 0 && (
          <span className="text-[13px] text-muted tabular-nums">{formatHours(secondsOn(sessions, today))} h no total</span>
        )}
      </CardHeader>
      {todaySessions.length === 0 ? (
        <EmptyState title="Nenhuma sessão hoje">Escolha um tópico e inicie o timer.</EmptyState>
      ) : (
        <ul>
          {todaySessions.map((session) => {
            const topic = findTopic(session.topicId);
            const name = topic?.name ?? "Tópico removido";
            return (
              <ListRow
                key={session.id}
                title={name}
                subtitle={
                  <span className="tabular-nums">
                    {topic?.area.name} · {timeFormat.format(session.ts)}
                  </span>
                }
                end={
                  <>
                    <span className="tabular-nums">{formatDuration(session.sec)}</span>
                    <IconButton aria-label={`Excluir sessão de ${name}`} onClick={() => remove(session.id)}>
                      <Trash2 size={18} aria-hidden />
                    </IconButton>
                  </>
                }
              />
            );
          })}
        </ul>
      )}
    </Card>
  );
}
