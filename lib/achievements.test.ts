import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  achievementStatus,
  countedSeconds,
  longestStreak,
  newlyUnlocked,
  rankProgress,
  unlockMessage,
  unlockedBySession,
} from "./achievements";
import type { StudySession } from "./sessions";

function session(date: string, hours: number): StudySession {
  return {
    id: `${date}-${hours}`,
    topicId: null,
    areaId: "mat",
    date,
    start: 0,
    end: hours * 3_600_000,
    sec: hours * 3600,
    mode: "cronometro",
    state: "concluida",
  };
}

describe("countedSeconds", () => {
  it("soma as sessões e limita a 10 horas por dia", () => {
    const sessions = [session("2026-10-12", 8), session("2026-10-12", 6), session("2026-10-13", 2)];
    expect(countedSeconds(sessions)).toBe(12 * 3600);
  });
});

describe("rankProgress", () => {
  it("começa no primeiro rank", () => {
    const progress = rankProgress(0);
    expect(progress.current.id).toBe("inicio");
    expect(progress.next?.id).toBe("ritmo");
    expect(progress.hoursToNext).toBe(10);
  });

  it("mostra a fração até o próximo rank", () => {
    const progress = rankProgress(30 * 3600);
    expect(progress.current.id).toBe("ritmo");
    expect(progress.fraction).toBeCloseTo(0.5);
  });

  it("para no último rank", () => {
    const progress = rankProgress(800 * 3600);
    expect(progress.current.id).toBe("maratonista");
    expect(progress.next).toBeNull();
    expect(progress.fraction).toBe(1);
  });
});

const empty = {
  sessions: [],
  progress: {},
  tasks: [],
  mistakes: [],
  flashcards: [],
  mockExams: [],
  questionBlocks: [],
  essays: [],
  timesTable: {},
};

describe("conquistas", () => {
  it("começa com tudo bloqueado e ids únicos", () => {
    const status = achievementStatus(empty);
    expect(status.every((item) => !item.unlocked && item.fraction === 0)).toBe(true);
    expect(new Set(ACHIEVEMENTS.map((item) => item.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it("desbloqueia pelas horas, pela maior sequência e pelo resto do histórico", () => {
    const sessions = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-10"].map((date) => session(date, 10));
    const status = achievementStatus({
      ...empty,
      sessions,
      essays: [{ id: "r1", date: "2026-10-01", theme: "Tema", scores: [200, 200, 160, 160, 120], corrector: "", improve: "" }],
      mockExams: [{ id: "s1", date: "2026-10-01", day: 2, minutes: null, note: "", sections: [{ areaId: "mat", correct: 30, total: 45, score: 712.3 }] }],
      timesTable: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((factor) => [`${Math.min(7, factor)}x${Math.max(7, factor)}`, { right: 3, wrong: 0, streak: 3 }])),
    });
    const unlocked = (id: string) => status.find((item) => item.id === id)?.unlocked;
    expect(unlocked("horas-25")).toBe(true);
    expect(unlocked("horas-50")).toBe(false);
    expect(status.find((item) => item.id === "horas-50")?.fraction).toBeCloseTo(0.8);
    expect(unlocked("sequencia-3")).toBe(true);
    expect(unlocked("sequencia-7")).toBe(false);
    expect(unlocked("redacao-800")).toBe(true);
    expect(unlocked("nota-600")).toBe(true);
    expect(unlocked("nota-750")).toBe(false);
    expect(unlocked("tabuada-1")).toBe(true);
  });

  it("aponta só as conquistas de horas cruzadas por uma sessão nova", () => {
    expect(newlyUnlocked(9.5 * 3600, 10.2 * 3600).map((item) => item.id)).toEqual(["horas-10"]);
    expect(newlyUnlocked(10.2 * 3600, 11 * 3600)).toEqual([]);
  });
});

describe("longestStreak", () => {
  it("conta a maior sequência de dias seguidos de todo o histórico", () => {
    const dates = ["2026-10-01", "2026-10-02", "2026-10-02", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"];
    expect(longestStreak(dates.map((date) => session(date, 1)))).toBe(4);
    expect(longestStreak([])).toBe(0);
  });
});

describe("unlockedBySession", () => {
  it("compara o total com e sem a sessão nova, respeitando o teto do dia", () => {
    const earlier = session("2026-10-12", 9.5);
    const latest = session("2026-10-13", 1);
    expect(unlockedBySession([earlier, latest], latest).map((item) => item.id)).toEqual(["horas-10"]);
    const fullDay = session("2026-10-14", 10);
    const extra = session("2026-10-14", 4);
    expect(unlockedBySession([earlier, latest, fullDay, extra], extra)).toEqual([]);
  });

  it("escreve o aviso da conquista mais alta", () => {
    expect(unlockMessage([])).toBe("");
    expect(unlockMessage(newlyUnlocked(0, 2 * 3600))).toBe(" Nova conquista: Primeira hora.");
    expect(unlockMessage(newlyUnlocked(0, 12 * 3600))).toBe(" Nova conquista: Aquecido.");
  });
});
