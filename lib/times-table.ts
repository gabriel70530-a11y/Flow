export const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const ROUND_SIZE = 20;
// Decorada: três acertos seguidos, cada um em até 5 segundos.
export const MEMORIZED_STREAK = 3;
export const FAST_ANSWER_MS = 5000;

export interface FactStats {
  right: number;
  wrong: number;
  // Acertos rápidos seguidos; um erro ou uma resposta lenta zera.
  streak: number;
}

// 7 × 8 e 8 × 7 são a mesma conta para decorar: a chave usa o menor fator primeiro.
export type TimesTableStats = Record<string, FactStats>;

export interface Fact {
  left: number;
  right: number;
}

export function factKey(fact: Fact): string {
  return `${Math.min(fact.left, fact.right)}x${Math.max(fact.left, fact.right)}`;
}

export function factsOf(tables: readonly number[]): Fact[] {
  return tables.flatMap((table) => TABLES.map((factor) => ({ left: table, right: factor })));
}

export function isMemorized(stats: TimesTableStats, fact: Fact): boolean {
  return (stats[factKey(fact)]?.streak ?? 0) >= MEMORIZED_STREAK;
}

// Rodada com as contas menos decoradas primeiro (e as nunca vistas antes das já decoradas), embaralhadas dentro de cada grupo.
export function buildRound(
  tables: readonly number[],
  stats: TimesTableStats,
  size = ROUND_SIZE,
  random: () => number = Math.random,
): Fact[] {
  const weight = (fact: Fact) => {
    const factStats = stats[factKey(fact)];
    if (!factStats) return 1;
    return factStats.streak >= MEMORIZED_STREAK ? 3 : factStats.wrong > factStats.right ? 0 : 2;
  };
  const facts = factsOf(tables)
    .map((fact) => ({ fact, weight: weight(fact), order: random() }))
    .sort((first, second) => first.weight - second.weight || first.order - second.order)
    .slice(0, size)
    .map(({ fact }) => fact);
  // Embaralha de novo para a rodada não começar sempre pelas mais difíceis.
  return facts
    .map((fact) => ({ fact, order: random() }))
    .sort((first, second) => first.order - second.order)
    .map(({ fact }) => fact);
}

export function recordAnswer(stats: TimesTableStats, fact: Fact, correct: boolean, milliseconds: number): TimesTableStats {
  const key = factKey(fact);
  const current = stats[key] ?? { right: 0, wrong: 0, streak: 0 };
  const fast = correct && milliseconds <= FAST_ANSWER_MS;
  return {
    ...stats,
    [key]: {
      right: current.right + (correct ? 1 : 0),
      wrong: current.wrong + (correct ? 0 : 1),
      streak: fast ? current.streak + 1 : correct ? current.streak : 0,
    },
  };
}

export function tableProgress(stats: TimesTableStats, table: number): { memorized: number; total: number } {
  const facts = factsOf([table]);
  return { memorized: facts.filter((fact) => isMemorized(stats, fact)).length, total: facts.length };
}

export function parseAnswer(text: string): number | null {
  const trimmed = text.trim();
  return /^\d{1,3}$/.test(trimmed) ? Number(trimmed) : null;
}

export function normalizeTimesTable(saved: unknown): TimesTableStats {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
  const result: TimesTableStats = {};
  for (const [key, value] of Object.entries(saved as Record<string, unknown>)) {
    if (!/^\d{1,2}x\d{1,2}$/.test(key) || !value || typeof value !== "object") continue;
    const { right, wrong, streak } = value as Record<string, unknown>;
    const count = (number: unknown) => (Number.isInteger(number) && (number as number) >= 0 ? (number as number) : 0);
    result[key] = { right: count(right), wrong: count(wrong), streak: count(streak) };
  }
  return result;
}
