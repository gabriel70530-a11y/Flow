"use client";

import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toast";
import type { PlanTask } from "@/lib/planner";
import { GENERAL_STUDY } from "@/lib/sessions";
import { useStudyStore } from "@/store/study-store";

// Leva para o Timer já com o tópico (e, vindo do cronograma, com a tarefa no cronômetro, sem limite de tempo).
export function useStudyTopic() {
  const router = useRouter();
  const studyTopic = useStudyStore((state) => state.studyTopic);

  return (topicId: string | null, task?: PlanTask) => {
    if (!studyTopic(topicId ?? GENERAL_STUDY, task?.id)) {
      showToast("Finalize ou descarte a sessão em andamento primeiro.");
      return false;
    }
    router.push("/timer");
    return true;
  };
}
