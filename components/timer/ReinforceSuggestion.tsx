"use client";

import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { progressOf } from "@/lib/reviews";
import type { TopicRecord } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";

// Reflexões e feedbacks difíceis só sugerem reforço; o estudante decide se muda o status.
export function ReinforceSuggestion({ topic, show }: { topic: TopicRecord; show: boolean }) {
  const status = useStudyStore((state) => progressOf(state.progress, topic.id).status);
  const setStatus = useStudyStore((state) => state.setStatus);

  if (!show || status === "revisar") return null;

  const mark = () => {
    setStatus(topic.id, "revisar");
    showToast(`${topic.name} marcado como Precisa revisar.`);
  };

  return (
    <div className="grid gap-2 rounded-[12px] bg-accent-soft p-3.5 text-sm">
      <p>
        Quer marcar <strong>{topic.name}</strong> como Precisa revisar? Ele ganha prioridade no cronograma.
        {status === "concluido" && " As revisões ainda não feitas deste tópico serão removidas."}
      </p>
      <Button className="justify-self-start" onClick={mark}>
        Marcar como Precisa revisar
      </Button>
    </div>
  );
}
