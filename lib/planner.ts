import type { AreaId } from "./syllabus";
import type { Priority } from "./topics";

export type TaskStatus = "planejada" | "iniciada" | "concluida" | "adiada";
export type PlanStrategy = "equilibrada" | "prioridades";

export interface PlanTask {
  id: string;
  topicId: string | null;
  areaId: AreaId | null;
  kind: "estudo" | "revisao";
  date: string | null;
  minutes: number;
  priority: Priority;
  status: TaskStatus;
  origin: "gerada" | "manual";
  focusSec: number;
}

export interface PlannerSettings {
  availability: number[];
  sessionMinutes: number;
  priorityAreas: AreaId[];
  difficultAreas: AreaId[];
  strongAreas: AreaId[];
  targetDate: string | null;
  strategy: PlanStrategy;
  course: string;
}

export const DEFAULT_PLANNER: PlannerSettings = {
  availability: [120, 120, 120, 120, 120, 60, 0],
  sessionMinutes: 50,
  priorityAreas: [],
  difficultAreas: [],
  strongAreas: [],
  targetDate: null,
  strategy: "equilibrada",
  course: "",
};

// O foco registrado com a tarefa ativa soma na tarefa; ela conclui quando o foco alcança a duração planejada.
export function applyFocusToTask(tasks: PlanTask[], taskId: string, seconds: number): PlanTask[] {
  return tasks.map((task) => {
    if (task.id !== taskId || task.status === "concluida") return task;
    const focusSec = task.focusSec + seconds;
    return { ...task, focusSec, status: focusSec >= task.minutes * 60 ? "concluida" : "iniciada" };
  });
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  planejada: "Planejada",
  iniciada: "Iniciada",
  concluida: "Concluída",
  adiada: "Adiada",
};
