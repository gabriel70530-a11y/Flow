"use client";

import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toast";
import type { PlanTask } from "@/lib/planner";
import { GENERAL_STUDY } from "@/lib/sessions";
import { useStudyStore } from "@/store/study-store";

// Leva para o Timer já com o tópico (e, vindo do cronograma, com a tarefa e a duração dela).
export function useStudyTopic() {
  const router = useRouter();
  const studyTopic = useStudyStore((state) => state.studyTopic);

  return (topicId: string | null, task?: PlanTask) => {
    const linkedTask = task ? { id: task.id, minutes: task.minutes } : undefined;
    if (!studyTopic(topicId ?? GENERAL_STUDY, linkedTask)) {
      showToast("Finalize ou descarte a sessão em andamento primeiro.");
      return false;
    }
    router.push("/timer");
    return true;
  };
}
