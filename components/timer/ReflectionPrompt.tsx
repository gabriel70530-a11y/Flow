"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { REFLECTION_LABELS, needsReinforcement, type Reflection } from "@/lib/sessions";
import { formatDuration } from "@/lib/stats";
import { findTopic } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";
import { ReinforceSuggestion } from "./ReinforceSuggestion";
import { sessionTitle } from "./session-format";
import { useNow } from "./use-now";

const RECENT_MS = 30 * 60 * 1000;

// Pergunta opcional sobre a sessão mais recente; some ao responder ou ao dispensar.
export function ReflectionPrompt() {
  const now = useNow(true);
  const sessions = useStudyStore((state) => state.sessions);
  const topics = useStudyStore((state) => state.topics);
  const setSessionReflection = useStudyStore((state) => state.setSessionReflection);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [answeredId, setAnsweredId] = useState<string | null>(null);

  const latest = sessions.reduce<(typeof sessions)[number] | undefined>(
    (newest, session) => (!newest || session.end > newest.end ? session : newest),
    undefined,
  );
  if (!latest || latest.id === dismissedId || now - latest.end > RECENT_MS) return null;
  if (latest.reflection && latest.id !== answeredId) return null;
  const topic = findTopic(topics, latest.topicId);

  const answer = (reflection: Reflection) => {
    setSessionReflection(latest.id, reflection);
    setAnsweredId(latest.id);
  };

  return (
    <Card>
      <CardHeader title="Como foi o estudo?">
        <button type="button" onClick={() => setDismissedId(latest.id)} className="text-[13px] text-muted underline underline-offset-3">
          {latest.reflection ? "Fechar" : "Agora não"}
        </button>
      </CardHeader>
      <p className="mb-3 text-[13px] text-muted">
        {sessionTitle(latest, topics)} · {formatDuration(latest.sec)}. A resposta é só para você e ajuda a sugerir revisões.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2">
        {(Object.keys(REFLECTION_LABELS) as Reflection[]).map((reflection) => (
          <Button
            key={reflection}
            aria-pressed={latest.reflection === reflection}
            onClick={() => answer(reflection)}
            className="whitespace-nowrap aria-pressed:bg-accent aria-pressed:text-on-accent"
          >
            {REFLECTION_LABELS[reflection]}
          </Button>
        ))}
      </div>
      {topic && (
        <div className="mt-3">
          <ReinforceSuggestion topic={topic} show={needsReinforcement(latest.reflection)} />
        </div>
      )}
    </Card>
  );
}
