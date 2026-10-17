"use client";

import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toast";
import { useStudyStore } from "@/store/study-store";

export function useStudyTopic() {
  const router = useRouter();
  const studyTopic = useStudyStore((state) => state.studyTopic);

  return (topicId: string) => {
    if (!studyTopic(topicId)) {
      showToast("Finalize a sessão em andamento primeiro.");
      return false;
    }
    router.push("/timer");
    return true;
  };
}
