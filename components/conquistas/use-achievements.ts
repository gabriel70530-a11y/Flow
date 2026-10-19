"use client";

import { useShallow } from "zustand/react/shallow";
import { achievementStatus } from "@/lib/achievements";
import { useStudyStore } from "@/store/study-store";

export function useAchievements() {
  const data = useStudyStore(
    useShallow((state) => ({
      sessions: state.sessions,
      progress: state.progress,
      tasks: state.tasks,
      mistakes: state.mistakes,
      flashcards: state.flashcards,
      mockExams: state.mockExams,
      questionBlocks: state.questionBlocks,
      essays: state.essays,
      timesTable: state.timesTable,
    })),
  );
  return { sessions: data.sessions, status: achievementStatus(data) };
}
