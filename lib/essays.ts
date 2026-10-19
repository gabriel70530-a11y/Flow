// A pessoa registra a nota que recebeu (do MEC Enem ou de um professor) e acompanha a evolução.
export const COMPETENCIES = [
  { short: "C1", name: "Norma culta" },
  { short: "C2", name: "Tema e repertório" },
  { short: "C3", name: "Argumentação" },
  { short: "C4", name: "Coesão" },
  { short: "C5", name: "Proposta de intervenção" },
] as const;

export const COMPETENCY_SCORES = [0, 40, 80, 120, 160, 200] as const;

export interface Essay {
  id: string;
  date: string;
  theme: string;
  // Nota de cada competência (0 a 200, de 40 em 40); null quando a redação ainda não foi corrigida.
  scores: number[] | null;
  corrector: string;
  improve: string;
}

export interface EssayInput {
  date: string;
  theme: string;
  scores: number[] | null;
  corrector: string;
  improve: string;
}

export interface RepertoireItem {
  id: string;
  title: string;
  detail: string;
  themes: string;
}

export type RepertoireInput = Omit<RepertoireItem, "id">;

export const ESSAY_THEME_MAX = 160;
export const ESSAY_TEXT_MAX = 500;
export const REPERTOIRE_TITLE_MAX = 120;

export function validateEssay(input: EssayInput, today: string): string | null {
  if (!input.theme.trim()) return "Escreva o tema da redação.";
  if (input.theme.length > ESSAY_THEME_MAX) return `Use no máximo ${ESSAY_THEME_MAX} caracteres no tema.`;
  if (input.date > today) return "Registre só redações que você já escreveu.";
  if (input.scores !== null) {
    const valid =
      input.scores.length === COMPETENCIES.length &&
      input.scores.every((score) => (COMPETENCY_SCORES as readonly number[]).includes(score));
    if (!valid) return "Cada competência vale de 0 a 200, de 40 em 40.";
  }
  if (input.corrector.length > REPERTOIRE_TITLE_MAX) return `Use no máximo ${REPERTOIRE_TITLE_MAX} caracteres em quem corrigiu.`;
  if (input.improve.length > ESSAY_TEXT_MAX) return `Use no máximo ${ESSAY_TEXT_MAX} caracteres no que melhorar.`;
  return null;
}

export function validateRepertoire(input: RepertoireInput): string | null {
  if (!input.title.trim()) return "Escreva o repertório (uma obra, lei, dado ou fato).";
  if (input.title.length > REPERTOIRE_TITLE_MAX) return `Use no máximo ${REPERTOIRE_TITLE_MAX} caracteres.`;
  if (input.detail.length > ESSAY_TEXT_MAX || input.themes.length > ESSAY_THEME_MAX) {
    return `Use no máximo ${ESSAY_TEXT_MAX} caracteres na explicação.`;
  }
  return null;
}

export function essayTotal(scores: readonly number[]): number {
  return scores.reduce((sum, score) => sum + score, 0);
}

// Competência mais fraca nas últimas 3 redações corrigidas; null sem nenhuma corrigida ou com todas empatadas.
export function weakestCompetency(essays: readonly Essay[]): { index: number; average: number } | null {
  const recent = [...essays]
    .filter((essay) => essay.scores !== null)
    .sort((first, second) => second.date.localeCompare(first.date))
    .slice(0, 3);
  if (recent.length === 0) return null;
  const averages = COMPETENCIES.map(
    (_, index) => recent.reduce((sum, essay) => sum + (essay.scores?.[index] ?? 0), 0) / recent.length,
  );
  const lowest = Math.min(...averages);
  if (lowest === Math.max(...averages)) return null;
  return { index: averages.indexOf(lowest), average: lowest };
}

// Repertórios que servem a um tema: busca simples, sem acento e sem diferenciar maiúsculas.
export function searchRepertoire(items: readonly RepertoireItem[], query: string): RepertoireItem[] {
  const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [...items];
  return items.filter((item) => {
    const text = normalize(`${item.title} ${item.detail} ${item.themes}`);
    return terms.every((term) => text.includes(term));
  });
}
