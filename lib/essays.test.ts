import { describe, expect, it } from "vitest";
import { essayTotal, searchRepertoire, validateEssay, validateRepertoire, weakestCompetency, type Essay } from "./essays";

const today = "2026-10-18";

function essay(overrides: Partial<Essay>): Essay {
  return { id: "a", date: today, theme: "Tema", scores: [160, 120, 120, 160, 80], corrector: "", improve: "", ...overrides };
}

describe("essays", () => {
  it("validates theme, date and scores", () => {
    const valid = { date: today, theme: "Desafios da educação", scores: [160, 160, 120, 160, 120], corrector: "MEC Enem", improve: "" };
    expect(validateEssay(valid, today)).toBeNull();
    expect(validateEssay({ ...valid, scores: null }, today)).toBeNull();
    expect(validateEssay({ ...valid, theme: " " }, today)).toMatch(/tema/);
    expect(validateEssay({ ...valid, date: "2026-10-20" }, today)).toMatch(/já escreveu/);
    expect(validateEssay({ ...valid, scores: [150, 160, 120, 160, 120] }, today)).toMatch(/40 em 40/);
    expect(validateEssay({ ...valid, scores: [160] }, today)).toMatch(/40 em 40/);
  });

  it("sums scores and finds the weakest competency in the last three corrected essays", () => {
    expect(essayTotal([160, 120, 120, 160, 80])).toBe(640);
    const essays = [
      essay({ id: "old", date: "2026-09-01", scores: [0, 0, 0, 0, 0] }),
      essay({ id: "a", date: "2026-10-01" }),
      essay({ id: "b", date: "2026-10-08", scores: [160, 160, 120, 160, 120] }),
      essay({ id: "c", date: "2026-10-15", scores: [160, 160, 80, 160, 160] }),
      essay({ id: "pending", date: "2026-10-17", scores: null }),
    ];
    expect(weakestCompetency(essays)).toEqual({ index: 2, average: (120 + 120 + 80) / 3 });
    expect(weakestCompetency([essay({ scores: null })])).toBeNull();
    expect(weakestCompetency([essay({ scores: [120, 120, 120, 120, 120] })])).toBeNull();
  });

  it("searches repertoire ignoring accents and case", () => {
    const items = [
      { id: "1", title: "Constituição de 1988, art. 6º", detail: "Direitos sociais", themes: "educação, saúde" },
      { id: "2", title: "Zygmunt Bauman", detail: "Modernidade líquida", themes: "redes sociais" },
    ];
    expect(searchRepertoire(items, "EDUCACAO").map((item) => item.id)).toEqual(["1"]);
    expect(searchRepertoire(items, "redes liquida").map((item) => item.id)).toEqual(["2"]);
    expect(searchRepertoire(items, " ")).toHaveLength(2);
    expect(validateRepertoire({ title: " ", detail: "", themes: "" })).toMatch(/repertório/);
  });
});
