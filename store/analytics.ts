import { toDateKey } from "@/lib/dates";

export type AnalyticsEvent =
  | "app_aberto"
  | "onboarding_concluido"
  | "onboarding_pulado"
  | "plano_gerado"
  | "sessao_registrada"
  | "revisao_concluida"
  | "pro_interesse";

const INSTALL_KEY = "enem-flow:instalacao";

export function analyticsUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_ANALYTICS_URL;
  return url && /^https:\/\//.test(url) ? url : null;
}

// Identificador aleatório deste navegador, só para contar retorno (ex.: dia 7). Não identifica a pessoa.
function installId(): string {
  try {
    const saved = localStorage.getItem(INSTALL_KEY);
    if (saved) return saved;
    const created = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(INSTALL_KEY, created);
    return created;
  } catch {
    return "sem-armazenamento";
  }
}

// Envia só com endpoint configurado e consentimento do estudante. Nada de nomes, tópicos ou anotações.
export function track(event: AnalyticsEvent, consent: boolean) {
  const url = analyticsUrl();
  if (!url || !consent || typeof navigator === "undefined" || !navigator.sendBeacon) return;
  try {
    navigator.sendBeacon(url, JSON.stringify({ event, day: toDateKey(new Date()), install: installId() }));
  } catch {}
}
