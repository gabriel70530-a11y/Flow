import { describe, expect, it } from "vitest";
import type { Essay } from "./essays";
import { ESSAY_AXES, ESSAY_THEMES, recommendThemes, themeWritten } from "./essay-themes";

function essay(theme: string): Essay {
  return { id: theme, date: "2026-10-01", theme, scores: null, corrector: "", improve: "" };
}

describe("essay themes", () => {
  it("tem ids únicos, eixos conhecidos e três pontos por tema", () => {
    expect(new Set(ESSAY_THEMES.map((theme) => theme.id)).size).toBe(ESSAY_THEMES.length);
    const axes = ESSAY_AXES.map((axis) => axis.value);
    expect(ESSAY_THEMES.every((theme) => axes.includes(theme.axis) && theme.points.length === 3)).toBe(true);
  });

  it("reconhece um tema já escrito sem diferenciar acento e pontuação", () => {
    const theme = ESSAY_THEMES.find((item) => item.year === 2019)!;
    expect(themeWritten(theme, [essay("democratizacao do acesso ao cinema no brasil")])).toBe(true);
    expect(themeWritten(theme, [essay("Cinema")])).toBe(false);
  });

  it("sugere temas não escritos, de eixos diferentes, primeiro os eixos menos treinados", () => {
    const written = ESSAY_THEMES.filter((theme) => theme.axis === "tecnologia").map((theme) => essay(theme.title));
    const picked = recommendThemes(ESSAY_THEMES, written, 3);
    expect(picked).toHaveLength(3);
    expect(new Set(picked.map((theme) => theme.axis)).size).toBe(3);
    expect(picked.some((theme) => theme.axis === "tecnologia")).toBe(false);
  });

  it("muda a ordem conforme a semana", () => {
    expect(recommendThemes(ESSAY_THEMES, [], 1)).not.toEqual(recommendThemes(ESSAY_THEMES, [], 2));
  });
});
