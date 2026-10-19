import { addDays } from "./dates";
import { essayTotal, type Essay } from "./essays";
import type { Flashcard } from "./flashcards";
import { openMistakes, type Mistake } from "./mistakes";
import type { MockExam } from "./mock-exams";
import type { PlanTask } from "./planner";
import { blockScore, type QuestionBlock } from "./question-blocks";
import type { ProgressMap } from "./reviews";
import type { StudySession } from "./sessions";
import { TABLES, tableProgress, type TimesTableStats } from "./times-table";

// Teto de horas por dia que contam para rank e conquistas: estudar 14 h num dia não deve valer mais que 10 h,
// para não premiar a exaustão (docs/roadmap-proxima-fase.md, Etapa 3).
export const DAILY_COUNTED_SECONDS = 10 * 3600;

export interface Rank {
  id: string;
  name: string;
  minHours: number;
}

export const RANKS: readonly Rank[] = [
  { id: "inicio", name: "Começando", minHours: 0 },
  { id: "ritmo", name: "Pegando o ritmo", minHours: 10 },
  { id: "constante", name: "Constante", minHours: 50 },
  { id: "dedicado", name: "Dedicado", minHours: 100 },
  { id: "focado", name: "Focado", minHours: 250 },
  { id: "maratonista", name: "Maratonista", minHours: 500 },
];

export function countedSeconds(sessions: readonly StudySession[]): number {
  const byDay = new Map<string, number>();
  for (const session of sessions) byDay.set(session.date, (byDay.get(session.date) ?? 0) + session.sec);
  let total = 0;
  for (const seconds of byDay.values()) total += Math.min(seconds, DAILY_COUNTED_SECONDS);
  return total;
}

export function rankProgress(totalSeconds: number) {
  const hours = totalSeconds / 3600;
  const index = RANKS.filter((rank) => hours >= rank.minHours).length - 1;
  const current = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  const fraction = next ? (hours - current.minHours) / (next.minHours - current.minHours) : 1;
  return { current, next, hours, fraction, hoursToNext: next ? next.minHours - hours : 0 };
}

// Maior sequência de dias seguidos com estudo em todo o histórico: conquista ganha não se perde.
export function longestStreak(sessions: readonly StudySession[]): number {
  const days = [...new Set(sessions.filter((session) => session.sec > 0).map((session) => session.date))].sort();
  let best = 0;
  let current = 0;
  days.forEach((day, index) => {
    current = index > 0 && addDays(days[index - 1], 1) === day ? current + 1 : 1;
    best = Math.max(best, current);
  });
  return best;
}

export interface AchievementData {
  sessions: readonly StudySession[];
  progress: ProgressMap;
  tasks: readonly PlanTask[];
  mistakes: readonly Mistake[];
  flashcards: readonly Flashcard[];
  mockExams: readonly MockExam[];
  questionBlocks: readonly QuestionBlock[];
  essays: readonly Essay[];
  timesTable: TimesTableStats;
}

type Metric = (data: AchievementData) => number;

const METRICS = {
  horas: (data) => countedSeconds(data.sessions) / 3600,
  sequencia: (data) => longestStreak(data.sessions),
  sessoes: (data) => data.sessions.length,
  concluidos: (data) => Object.values(data.progress).filter((item) => item.status === "concluido").length,
  revisoes: (data) => Object.values(data.progress).reduce((sum, item) => sum + item.reviews.filter((review) => review.done).length, 0),
  dominadas: (data) => data.tasks.filter((task) => task.outcome === "dominada").length,
  erros: (data) => data.mistakes.length - openMistakes(data.mistakes).length,
  cartoes: (data) => data.flashcards.length,
  firmes: (data) => data.flashcards.filter((card) => card.interval >= 21).length,
  simulados: (data) => data.mockExams.length,
  notaSimulado: (data) => Math.max(0, ...data.mockExams.flatMap((mock) => mock.sections.map((section) => section.score ?? 0))),
  blocos: (data) => data.questionBlocks.filter((block) => block.finished).length,
  blocosPerfeitos: (data) =>
    data.questionBlocks.filter((block) => {
      const { correct, total } = blockScore(block);
      return block.finished && total > 0 && correct === total;
    }).length,
  redacoes: (data) => data.essays.length,
  notaRedacao: (data) => Math.max(0, ...data.essays.map((essay) => (essay.scores ? essayTotal(essay.scores) : 0))),
  tabuadas: (data) => TABLES.filter((table) => {
    const { memorized, total } = tableProgress(data.timesTable, table);
    return memorized === total;
  }).length,
} satisfies Record<string, Metric>;

export type AchievementIcon =
  | "relogio"
  | "chama"
  | "play"
  | "check"
  | "memoria"
  | "alvo"
  | "virada"
  | "cartoes"
  | "prova"
  | "lista"
  | "caneta"
  | "tabuada";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  metric: keyof typeof METRICS;
  goal: number;
}

const ICONS: Record<keyof typeof METRICS, AchievementIcon> = {
  horas: "relogio",
  sequencia: "chama",
  sessoes: "play",
  concluidos: "check",
  revisoes: "memoria",
  dominadas: "alvo",
  erros: "virada",
  cartoes: "cartoes",
  firmes: "cartoes",
  simulados: "prova",
  notaSimulado: "prova",
  blocos: "lista",
  blocosPerfeitos: "lista",
  redacoes: "caneta",
  notaRedacao: "caneta",
  tabuadas: "tabuada",
};

function achievement(id: string, metric: keyof typeof METRICS, goal: number, title: string, description: string): Achievement {
  return { id, title, description, icon: ICONS[metric], metric, goal };
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  achievement("primeira-sessao", "sessoes", 1, "Largada", "Registrou a primeira sessão de estudo."),
  achievement("horas-1", "horas", 1, "Primeira hora", "Somou 1 hora de estudo."),
  achievement("horas-10", "horas", 10, "Aquecido", "Somou 10 horas de estudo."),
  achievement("horas-25", "horas", 25, "Fôlego", "Somou 25 horas de estudo."),
  achievement("horas-50", "horas", 50, "Meio caminho", "Somou 50 horas de estudo."),
  achievement("horas-100", "horas", 100, "Centenário", "Somou 100 horas de estudo."),
  achievement("horas-250", "horas", 250, "Longa distância", "Somou 250 horas de estudo."),
  achievement("horas-500", "horas", 500, "Lenda do foco", "Somou 500 horas de estudo."),
  achievement("sessoes-50", "sessoes", 50, "Rotina criada", "Registrou 50 sessões."),
  achievement("sequencia-3", "sequencia", 3, "Três em linha", "Estudou 3 dias seguidos."),
  achievement("sequencia-7", "sequencia", 7, "Semana fechada", "Estudou 7 dias seguidos."),
  achievement("sequencia-14", "sequencia", 14, "Quinzena firme", "Estudou 14 dias seguidos."),
  achievement("sequencia-30", "sequencia", 30, "Mês no ritmo", "Estudou 30 dias seguidos."),
  achievement("concluidos-1", "concluidos", 1, "Primeiro do caderno", "Concluiu o primeiro tópico."),
  achievement("concluidos-10", "concluidos", 10, "Lista andando", "Concluiu 10 tópicos."),
  achievement("concluidos-50", "concluidos", 50, "Conteúdo em dia", "Concluiu 50 tópicos."),
  achievement("revisoes-1", "revisoes", 1, "Bom de memória", "Fez a primeira revisão."),
  achievement("revisoes-10", "revisoes", 10, "Revisor", "Fez 10 revisões."),
  achievement("revisoes-50", "revisoes", 50, "Guardião da memória", "Fez 50 revisões."),
  achievement("dominadas-10", "dominadas", 10, "Dominei", "Dominou 10 matérias do cronograma."),
  achievement("erros-1", "erros", 1, "Virada", "Superou o primeiro erro do caderno."),
  achievement("erros-10", "erros", 10, "Erro vira acerto", "Superou 10 erros do caderno."),
  achievement("cartoes-10", "cartoes", 10, "Fichário", "Montou 10 cartões."),
  achievement("cartoes-50", "cartoes", 50, "Baralho próprio", "Montou 50 cartões."),
  achievement("firmes-20", "firmes", 20, "Memória de elefante", "Firmou 20 cartões (intervalo de 3 semanas ou mais)."),
  achievement("simulados-1", "simulados", 1, "Primeira prova", "Fez o primeiro simulado."),
  achievement("simulados-5", "simulados", 5, "Ritmo de prova", "Fez 5 simulados."),
  achievement("nota-600", "notaSimulado", 600, "Acima dos 600", "Tirou 600 ou mais numa área do simulado."),
  achievement("nota-750", "notaSimulado", 750, "Elite", "Tirou 750 ou mais numa área do simulado."),
  achievement("blocos-1", "blocos", 1, "Aquecimento", "Terminou o primeiro bloco de questões."),
  achievement("blocos-20", "blocos", 20, "Treino de rua", "Terminou 20 blocos de questões."),
  achievement("blocos-perfeitos-1", "blocosPerfeitos", 1, "Cinco de cinco", "Acertou todas as questões de um bloco."),
  achievement("redacoes-1", "redacoes", 1, "Primeira página", "Registrou a primeira redação."),
  achievement("redacoes-10", "redacoes", 10, "Mão treinada", "Registrou 10 redações."),
  achievement("redacao-800", "notaRedacao", 800, "Texto afiado", "Tirou 800 ou mais numa redação."),
  achievement("redacao-960", "notaRedacao", 960, "Quase mil", "Tirou 960 ou mais numa redação."),
  achievement("tabuada-1", "tabuadas", 1, "Na ponta da língua", "Decorou uma tabuada inteira."),
  achievement("tabuada-10", "tabuadas", 10, "Calculadora humana", "Decorou as tabuadas do 1 ao 10."),
];

export interface AchievementStatus extends Achievement {
  value: number;
  unlocked: boolean;
  fraction: number;
}

export function achievementStatus(data: AchievementData): AchievementStatus[] {
  const values = new Map<string, number>();
  return ACHIEVEMENTS.map((item) => {
    if (!values.has(item.metric)) values.set(item.metric, METRICS[item.metric](data));
    const value = values.get(item.metric)!;
    return { ...item, value, unlocked: value >= item.goal, fraction: Math.min(value / item.goal, 1) };
  });
}

const HOUR_ACHIEVEMENTS = ACHIEVEMENTS.filter((item) => item.metric === "horas");

export function newlyUnlocked(beforeSeconds: number, afterSeconds: number): Achievement[] {
  return HOUR_ACHIEVEMENTS.filter((item) => beforeSeconds / 3600 < item.goal && afterSeconds / 3600 >= item.goal);
}

// Conquistas de horas que a sessão recém-registrada (já incluída em `sessions`) desbloqueou.
export function unlockedBySession(sessions: readonly StudySession[], session: StudySession): Achievement[] {
  const before = countedSeconds(sessions.filter((candidate) => candidate.id !== session.id));
  return newlyUnlocked(before, countedSeconds(sessions));
}

export function unlockMessage(achievements: readonly Achievement[]): string {
  if (achievements.length === 0) return "";
  return ` Nova conquista: ${achievements[achievements.length - 1].title}.`;
}
