import { describe, expect, it } from "vitest";
import { achievementStatus, countedSeconds, newlyUnlocked, rankProgress } from "./achievements";
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

describe("conquistas de horas", () => {
  it("desbloqueia as metas atingidas", () => {
    const status = achievementStatus(55 * 3600);
    expect(status.filter((item) => item.unlocked).map((item) => item.hours)).toEqual([1, 10, 50]);
    expect(status.find((item) => item.hours === 100)?.fraction).toBeCloseTo(0.55);
  });

  it("aponta só as conquistas cruzadas por uma sessão nova", () => {
    expect(newlyUnlocked(9.5 * 3600, 10.2 * 3600).map((item) => item.id)).toEqual(["horas-10"]);
    expect(newlyUnlocked(10.2 * 3600, 11 * 3600)).toEqual([]);
  });
});
