export type PlanTier = "gratuito" | "pro";

export interface Entitlement {
  tier: PlanTier;
  // "teste": período de validação, recursos Pro liberados para todos. "provedor": confirmado pelo servidor de pagamento.
  source: "teste" | "provedor";
}

export const PRO_PRICE = "R$ 19,90/mês";

export const FREE_FEATURES = [
  "Matérias e tópicos prontos, com tópicos personalizados",
  "Status, prioridade e nível de domínio por tópico",
  "Timer Pomodoro e cronômetro com registro de sessões",
  "Revisões espaçadas de 1, 7, 15 e 30 dias",
  "Painel com horas da semana, meta e progresso",
];

export const PRO_FEATURES = [
  "Cronograma personalizado pela sua disponibilidade",
  "Reorganização sugerida de tarefas que ficaram para depois",
  "Resumo detalhado: planejado x realizado, constância e comparação semanal",
];

/*
 * Sem backend nem provedor de pagamento, ninguém tem Pro confirmado. Durante o teste com estudantes,
 * os recursos Pro ficam liberados para todos e a interface diz isso. Quando houver servidor, este
 * acesso deve vir dele (assinatura validada pelo provedor), nunca de um valor salvo no navegador.
 */
export function currentEntitlement(): Entitlement {
  return { tier: "gratuito", source: "teste" };
}

export function hasProAccess(entitlement: Entitlement = currentEntitlement()): boolean {
  return entitlement.tier === "pro" || entitlement.source === "teste";
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
