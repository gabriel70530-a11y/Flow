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
