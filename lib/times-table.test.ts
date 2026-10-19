import { describe, expect, it } from "vitest";
import {
  buildRound,
  factKey,
  factsOf,
  isMemorized,
  normalizeTimesTable,
  parseAnswer,
  recordAnswer,
  tableProgress,
  type TimesTableStats,
} from "./times-table";

describe("facts", () => {
  it("trata 7 × 8 e 8 × 7 como a mesma conta", () => {
    expect(factKey({ left: 8, right: 7 })).toBe("7x8");
    expect(factKey({ left: 7, right: 8 })).toBe("7x8");
    expect(factsOf([7, 8])).toHaveLength(20);
  });

  it("lê só números inteiros de até 3 algarismos", () => {
    expect(parseAnswer(" 56 ")).toBe(56);
    expect(parseAnswer("5,6")).toBeNull();
    expect(parseAnswer("")).toBeNull();
  });
});

describe("recordAnswer", () => {
  const fact = { left: 7, right: 8 };

  it("decora depois de três acertos rápidos seguidos", () => {
    let stats: TimesTableStats = {};
    stats = recordAnswer(stats, fact, true, 2000);
    stats = recordAnswer(stats, { left: 8, right: 7 }, true, 3000);
    expect(isMemorized(stats, fact)).toBe(false);
    stats = recordAnswer(stats, fact, true, 4000);
    expect(isMemorized(stats, fact)).toBe(true);
    expect(stats["7x8"]).toEqual({ right: 3, wrong: 0, streak: 3 });
  });

  it("acerto lento não avança e erro zera a sequência", () => {
    let stats = recordAnswer({}, fact, true, 9000);
    expect(stats["7x8"].streak).toBe(0);
    stats = recordAnswer(recordAnswer(stats, fact, true, 1000), fact, false, 1000);
    expect(stats["7x8"]).toEqual({ right: 2, wrong: 1, streak: 0 });
  });
});

describe("buildRound", () => {
  it("põe primeiro as contas com mais erros, depois as novas, e as decoradas por último", () => {
    const stats: TimesTableStats = { "7x1": { right: 0, wrong: 2, streak: 0 } };
    for (let factor = 2; factor <= 10; factor++) stats[factKey({ left: 7, right: factor })] = { right: 3, wrong: 0, streak: 3 };
    stats["7x2"] = { right: 1, wrong: 0, streak: 1 };
    const round = buildRound([7], stats, 2, () => 0.5);
    expect(round.map(factKey).sort()).toEqual(["1x7", "2x7"]);
  });

  it("não passa do tamanho nem das contas que existem", () => {
    expect(buildRound([2, 3], {})).toHaveLength(20);
    expect(buildRound([2], {})).toHaveLength(10);
  });
});

describe("progress and saved data", () => {
  it("conta as decoradas de cada tabuada", () => {
    const stats = { "3x7": { right: 3, wrong: 0, streak: 3 } };
    expect(tableProgress(stats, 7)).toEqual({ memorized: 1, total: 10 });
    expect(tableProgress(stats, 3)).toEqual({ memorized: 1, total: 10 });
  });

  it("descarta dados salvos inválidos", () => {
    expect(normalizeTimesTable({ "3x7": { right: 2, wrong: -1, streak: "x" }, lixo: {}, "4x4": null })).toEqual({
      "3x7": { right: 2, wrong: 0, streak: 0 },
    });
    expect(normalizeTimesTable([])).toEqual({});
  });
});
