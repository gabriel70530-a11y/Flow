export type PlanTier = "gratuito" | "pro";
export type BillingPlan = "mensal" | "anual";

export interface Entitlement {
  tier: PlanTier;
  // "teste": período de validação, recursos Pro liberados para todos. "provedor": confirmado pelo servidor de pagamento.
  source: "teste" | "provedor";
}

// O que o servidor grava ao confirmar um pagamento (tabela entitlements). O app só lê.
export interface ProRecord {
  plan: BillingPlan;
  status: "ativa" | "cancelada";
  proUntil: string;
}

export const PRICES: Record<BillingPlan, { label: string; amount: number }> = {
  mensal: { label: "R$ 14,90/mês", amount: 14.9 },
  anual: { label: "R$ 119,90/ano", amount: 119.9 },
};

export const FREE_FEATURES = [
  "As cinco áreas do ENEM, com quantos tópicos você quiser",
  "Timer com cronômetro, sem limite de tempo",
  "Revisões nas datas que você escolher",
  "Registro de simulados, redações e repertório",
  "Cronograma montado à mão",
  "Painel com as últimas 4 semanas, meta e conquistas",
];

export const PRO_FEATURES = [
  "Tudo do gratuito",
  "Cópia na nuvem e sincronização entre aparelhos",
  "Timer Pomodoro e modo foco",
  "Caderno de erros com análise por IA",
  "Simulado no app, com nota estimada pela TRI",
  "Blocos de 5 questões oficiais por tema",
  "Revisões agendadas sozinhas e sugestões do que mais cai",
  "Semana montada e atualizada sozinha",
  "Resumo completo, evolução e histórico inteiro",
];

// Quantas semanas para trás o Painel mostra no gratuito, contando a atual.
export const FREE_HISTORY_WEEKS = 4;

// Com NEXT_PUBLIC_PRO_TRIAL=true, todos têm o Pro (testes com estudantes). Sem ela, só quem o servidor confirmou.
export function proTrialOpen(): boolean {
  return process.env.NEXT_PUBLIC_PRO_TRIAL === "true";
}

// O Pro vale até o fim do dia de proUntil, inclusive depois de cancelar: a pessoa já pagou por esse período.
export function isProActive(record: ProRecord | null, now: Date): boolean {
  return record !== null && Date.parse(record.proUntil) > now.getTime();
}

export function currentEntitlement(record: ProRecord | null, now: Date): Entitlement {
  if (isProActive(record, now)) return { tier: "pro", source: "provedor" };
  return { tier: "gratuito", source: proTrialOpen() ? "teste" : "provedor" };
}

export function hasProAccess(entitlement: Entitlement): boolean {
  return entitlement.tier === "pro" || entitlement.source === "teste";
}

// A assinatura só aparece com o pagamento configurado no servidor (funções do Supabase e Mercado Pago).
export function paymentsOpen(): boolean {
  return process.env.NEXT_PUBLIC_PAYMENTS_OPEN === "true";
}

// Lista de interesse externa (ex.: formulário). Sem URL configurada, a interface não mostra o botão.
export function interestListUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_PRO_INTEREST_URL;
  return url && /^https:\/\//.test(url) ? url : null;
}

export function contactEmail(): string | null {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
