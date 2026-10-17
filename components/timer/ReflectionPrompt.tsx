"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { REFLECTION_LABELS, needsReinforcement, type Reflection } from "@/lib/sessions";
import { formatDuration } from "@/lib/stats";
import { findTopic } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";
import { taskTitle } from "@/components/cronograma/task-format";
import { useAnswerMastery } from "@/components/cronograma/use-answer-mastery";
import { ReinforceSuggestion } from "./ReinforceSuggestion";
import { sessionTitle } from "./session-format";
import { useNow } from "./use-now";

const RECENT_MS = 30 * 60 * 1000;

// Pergunta opcional sobre a sessão mais recente; some ao responder ou ao dispensar.
export function ReflectionPrompt() {
  const now = useNow(true);
  const sessions = useStudyStore((state) => state.sessions);
  const topics = useStudyStore((state) => state.topics);
  const tasks = useStudyStore((state) => state.tasks);
  const answerMastery = useAnswerMastery();
  const setSessionReflection = useStudyStore((state) => state.setSessionReflection);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [answeredId, setAnsweredId] = useState<string | null>(null);

  const latest = sessions.reduce<(typeof sessions)[number] | undefined>(
    (newest, session) => (!newest || session.end > newest.end ? session : newest),
    undefined,
  );
  if (!latest || latest.id === dismissedId || now - latest.end > RECENT_MS) return null;
  const task = latest.taskId ? tasks.find((item) => item.id === latest.taskId) : undefined;

  // Sessão de uma tarefa do cronograma: a pergunta é se dominou. "Ainda não" repete a matéria no dia seguinte.
  if (task && (task.status === "planejada" || task.status === "iniciada")) {
    const answerTask = (mastered: boolean) => {
      setSessionReflection(latest.id, mastered ? "bem" : "revisar");
      setAnsweredId(latest.id);
      answerMastery(task, mastered);
    };
    return (
      <Card>
        <CardHeader title={`Você sente que dominou ${taskTitle(task, topics)}?`}>
          <button
            type="button"
            onClick={() => setDismissedId(latest.id)}
            className="shrink-0 text-[13px] text-muted underline underline-offset-3"
          >
            Vou continuar
          </button>
        </CardHeader>
        <p className="mb-3 text-[13px] text-muted">
          {formatDuration(task.focusSec)} estudados nesta matéria hoje. Não existe tempo certo: se ainda não dominou, ela volta
          no dia seguinte.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => answerTask(true)}>
            Dominei
          </Button>
          <Button onClick={() => answerTask(false)}>Ainda não dominei</Button>
        </div>
      </Card>
    );
  }

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
