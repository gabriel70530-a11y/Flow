import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIMER,
  clockText,
  elapsed,
  isIdle,
  isPhaseOver,
  nextPhase,
  pauseTimer,
  phaseSeconds,
  resetTimer,
  startTimer,
} from "./timer";

const start = 1_000_000;
const seconds = (amount: number) => start + amount * 1000;

describe("elapsed", () => {
  it("is zero for an idle timer", () => {
    expect(elapsed(DEFAULT_TIMER, seconds(100))).toBe(0);
  });

  it("measures wall-clock time while running", () => {
    const running = startTimer(DEFAULT_TIMER, start);
    expect(elapsed(running, seconds(90))).toBe(90);
  });

  it("freezes while paused and adds the banked time when resumed", () => {
    const paused = pauseTimer(startTimer(DEFAULT_TIMER, start), seconds(60));
    expect(paused.running).toBe(false);
    expect(paused.banked).toBe(60);
    expect(elapsed(paused, seconds(500))).toBe(60);

    const resumed = startTimer(paused, seconds(500));
    expect(elapsed(resumed, seconds(530))).toBe(90);
  });
});

describe("isIdle", () => {
  it("is true only before anything was started", () => {
    expect(isIdle(DEFAULT_TIMER)).toBe(true);
    expect(isIdle(startTimer(DEFAULT_TIMER, start))).toBe(false);
    expect(isIdle(pauseTimer(startTimer(DEFAULT_TIMER, start), seconds(10)))).toBe(false);
    expect(isIdle(resetTimer(startTimer(DEFAULT_TIMER, start)))).toBe(true);
  });
});

describe("pomodoro phases", () => {
  const focusing = startTimer({ ...DEFAULT_TIMER, focus: 25, brk: 5 }, start);

  it("uses the duration of the current phase", () => {
    expect(phaseSeconds(focusing)).toBe(25 * 60);
    expect(phaseSeconds({ ...focusing, phase: "break" })).toBe(5 * 60);
  });

  it("detects the end of a phase only in pomodoro mode", () => {
    expect(isPhaseOver(focusing, seconds(25 * 60 - 1))).toBe(false);
    expect(isPhaseOver(focusing, seconds(25 * 60))).toBe(true);
    expect(isPhaseOver({ ...focusing, mode: "cronometro" }, seconds(25 * 60))).toBe(false);
  });

  it("starts the break automatically when focus ends", () => {
    const breaking = nextPhase(focusing, seconds(25 * 60));
    expect(breaking).toMatchObject({ phase: "break", running: true, banked: 0, startedAt: seconds(25 * 60) });
  });

  it("goes back to a stopped focus when the break ends", () => {
    const breaking = nextPhase(focusing, seconds(25 * 60));
    expect(nextPhase(breaking, seconds(30 * 60))).toMatchObject({ phase: "focus", running: false, banked: 0 });
  });
});

describe("clockText", () => {
  it("formats minutes and seconds, adding hours when needed", () => {
    expect(clockText(25 * 60)).toBe("25:00");
    expect(clockText(65.7)).toBe("01:05");
    expect(clockText(3725)).toBe("1:02:05");
    expect(clockText(-3)).toBe("00:00");
  });
});
