"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListRow } from "@/components/ui/ListRow";
import { REFLECTION_LABELS } from "@/lib/sessions";
import { formatDuration, formatHours, secondsOn } from "@/lib/stats";
import { focusName } from "@/lib/syllabus";
import { useStudyStore } from "@/store/study-store";
import { SessionDrawer } from "./SessionDrawer";
import { sessionTitle, timeFormat } from "./session-format";

export function TodaySessions({ today }: { today: string }) {
  const sessions = useStudyStore((state) => state.sessions);
  const topics = useStudyStore((state) => state.topics);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const todaySessions = sessions.filter((session) => session.date === today).sort((first, second) => second.end - first.end);

  return (
    <Card flush>
      <CardHeader flush title="Hoje">
        {todaySessions.length > 0 && (
          <span className="text-[13px] text-muted tabular-nums">{formatHours(secondsOn(sessions, today))} h no total</span>
        )}
      </CardHeader>
      {todaySessions.length === 0 ? (
        <EmptyState title="Nenhuma sessão hoje">
          Escolha um tópico ou &quot;Estudo geral&quot; e inicie o timer. Pausas não contam como estudo.
        </EmptyState>
      ) : (
        <ul>
          {todaySessions.map((session) => {
            const details = [
              session.areaId ? focusName(session.areaId, session.subjectId) : "Sem área",
              timeFormat.format(session.end),
              session.state === "interrompida" ? "Interrompida" : null,
              session.reflection ? REFLECTION_LABELS[session.reflection] : null,
            ].filter(Boolean);
            return (
              <ListRow
                key={session.id}
                onClick={() => setOpenSessionId(session.id)}
                title={sessionTitle(session, topics)}
                subtitle={<span className="tabular-nums">{details.join(" · ")}</span>}
                end={<span className="tabular-nums">{formatDuration(session.sec)}</span>}
              />
            );
          })}
        </ul>
      )}
      <SessionDrawer
        session={sessions.find((session) => session.id === openSessionId)}
        onClose={() => setOpenSessionId(null)}
      />
    </Card>
  );
}
