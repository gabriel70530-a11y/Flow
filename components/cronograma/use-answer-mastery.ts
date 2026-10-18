"use client";

import { showToast } from "@/components/ui/Toast";
import { dayLabel, toDateKey } from "@/lib/dates";
import type { PlanTask } from "@/lib/planner";
import { useStudyStore } from "@/store/study-store";
import { taskTitle } from "./task-format";

// Responde "dominei?" de uma tarefa e confirma em seguida o que aconteceu com a matéria.
export function useAnswerMastery() {
  const topics = useStudyStore((state) => state.topics);
  const answerMastery = useStudyStore((state) => state.answerMastery);

  return (task: PlanTask, mastered: boolean) => {
    const name = taskTitle(task, topics);
    const result = answerMastery(task.id, mastered);
    if (mastered) {
      showToast(
        task.kind === "revisao"
          ? "Revisão concluída."
          : task.topicId
            ? `${name} concluído. Revisões de 1, 7, 15 e 30 dias agendadas.`
            : "Tarefa concluída.",
      );
      return;
    }
    if (!result?.repeat.date) {
      showToast("Sem espaço nas próximas duas semanas: a repetição ficou em Para outra semana.");
      return;
    }
    const when = dayLabel(result.repeat.date, toDateKey(new Date())).toLowerCase();
    const movedNames = result.displaced.map((item) => taskTitle(item, topics)).join(" e ");
    const displaced = movedNames ? ` ${movedNames} ${result.displaced.length === 1 ? "passou" : "passaram"} para frente.` : "";
    showToast(`Sem problema: ${name} volta ${when === "amanhã" ? "amanhã" : `em ${when}`}.${displaced}`);
  };
}
