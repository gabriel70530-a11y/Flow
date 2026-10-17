export type TimerMode = "pomodoro" | "cronometro";

export interface TimerState {
  mode: TimerMode;
  focus: number;
  brk: number;
  phase: "focus" | "break";
  running: boolean;
  startedAt: number;
  banked: number;
  topicId: string;
}

export const DEFAULT_TIMER: TimerState = {
  mode: "pomodoro",
  focus: 25,
  brk: 5,
  phase: "focus",
  running: false,
  startedAt: 0,
  banked: 0,
  topicId: "",
};

// O tempo vem do relógio, não de ticks, para continuar certo com a aba em segundo plano ou após recarregar.
export function elapsed(timer: TimerState, now: number): number {
  return timer.banked + (timer.running ? (now - timer.startedAt) / 1000 : 0);
}

export function phaseSeconds(timer: TimerState): number {
  return (timer.phase === "focus" ? timer.focus : timer.brk) * 60;
}

export function isIdle(timer: TimerState): boolean {
  return !timer.running && timer.banked === 0 && timer.phase === "focus";
}

export function isPhaseOver(timer: TimerState, now: number): boolean {
  return timer.running && timer.mode === "pomodoro" && elapsed(timer, now) >= phaseSeconds(timer);
}

export function startTimer(timer: TimerState, now: number): TimerState {
  return { ...timer, running: true, startedAt: now };
}

export function pauseTimer(timer: TimerState, now: number): TimerState {
  return { ...timer, running: false, banked: elapsed(timer, now) };
}

export function resetTimer(timer: TimerState): TimerState {
  return { ...timer, phase: "focus", running: false, startedAt: 0, banked: 0 };
}

export function nextPhase(timer: TimerState, now: number): TimerState {
  if (timer.phase === "focus") return { ...timer, phase: "break", running: true, banked: 0, startedAt: now };
  return resetTimer(timer);
}

export function clockText(seconds: number): string {
  const total = Math.max(0, seconds);
  const hours = Math.floor(total / 3600);
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const secs = String(Math.floor(total % 60)).padStart(2, "0");
  return hours ? `${hours}:${minutes}:${secs}` : `${minutes}:${secs}`;
}
