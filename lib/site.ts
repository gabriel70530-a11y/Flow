// Endereço público do site, usado no sitemap, no robots e nos cartões de compartilhamento.
// Ordem: NEXT_PUBLIC_SITE_URL (domínio próprio), o endereço de produção que a Vercel informa no build e,
// sem nenhum dos dois, o servidor local.
export function siteUrl(): URL {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (url && /^https?:\/\/[^\s]+$/.test(url)) return new URL(url);
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelHost && /^[a-z0-9.-]+$/i.test(vercelHost)) return new URL(`https://${vercelHost}`);
  return new URL("http://localhost:3000");
}

export const SITE_TITLE = "Flow · Sua preparação para o ENEM, no ritmo certo.";
export const SITE_DESCRIPTION =
  "Organize as matérias da semana e do dia, use o timer e lembre das revisões. Grátis, com uma conta.";

export const APP_ROUTES = [
  "/painel",
  "/cronograma",
  "/materias",
  "/timer",
  "/revisoes",
  "/questoes",
  "/preparacao",
  "/simulados",
  "/redacao",
  "/tabuada",
  "/prova",
  "/conquistas",
  "/ajustes",
  "/planos",
  "/comecar",
];

// Enquanto o Flow está só em divulgação, a produção mostra apenas a página inicial, a privacidade e os termos.
// Para abrir o app, defina APP_OPEN=true na Vercel e publique de novo. Local e prévias continuam abertos.
export function appOpen(): boolean {
  return process.env.VERCEL_ENV !== "production" || process.env.APP_OPEN === "true";
}

export function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

// Identificador do app na Play Store. Depois da primeira publicação não pode mais mudar.
export const ANDROID_PACKAGE = "app.flowestudos";

// Impressões SHA-256 dos certificados que assinam o app (Play Console > Integridade do app), separadas por vírgula.
export function androidCertFingerprints(): string[] {
  return (process.env.ANDROID_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((fingerprint) => fingerprint.trim().toUpperCase())
    .filter((fingerprint) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(fingerprint));
}

// O app Android abre o Flow com ?origem=android. Na Play Store, conteúdo digital só pode ser vendido pelo
// faturamento do Google, então o app não mostra a assinatura pelo Mercado Pago.
export const ANDROID_LAUNCH_PARAM = "origem";
export const ANDROID_LAUNCH_VALUE = "android";
