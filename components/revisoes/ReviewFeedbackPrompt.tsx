"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ReinforceSuggestion } from "@/components/timer/ReinforceSuggestion";
import { FEEDBACK_LABELS, progressOf, type ReviewFeedback } from "@/lib/reviews";
import type { TopicRecord } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";

interface ReviewFeedbackPromptProps {
  topic: TopicRecord;
  stage: number;
  onClose: () => void;
}

// Feedback opcional da revisão recém-concluída. Só sugere reforço; nunca muda datas.
export function ReviewFeedbackPrompt({ topic, stage, onClose }: ReviewFeedbackPromptProps) {
  const feedback = useStudyStore(
    (state) => progressOf(state.progress, topic.id).reviews.find((review) => review.stage === stage)?.feedback,
  );
  const setReviewFeedback = useStudyStore((state) => state.setReviewFeedback);

  return (
    <Card>
      <CardHeader title={`Como foi a revisão de ${topic.name}?`}>
        <button type="button" onClick={onClose} className="shrink-0 text-[13px] text-muted underline underline-offset-3">
          {feedback ? "Fechar" : "Agora não"}
        </button>
      </CardHeader>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
        {(Object.keys(FEEDBACK_LABELS) as ReviewFeedback[]).map((option) => (
          <Button
            key={option}
            aria-pressed={feedback === option}
            onClick={() => setReviewFeedback(topic.id, stage, option)}
            className="whitespace-nowrap aria-pressed:bg-accent aria-pressed:text-on-accent"
          >
            {FEEDBACK_LABELS[option]}
          </Button>
        ))}
      </div>
      <div className="mt-3">
        <ReinforceSuggestion topic={topic} show={feedback === "dificil"} />
      </div>
    </Card>
  );
}
