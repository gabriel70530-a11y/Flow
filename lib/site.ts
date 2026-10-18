// Endereço público do site, usado no sitemap, no robots e nos cartões de compartilhamento.
// Sem NEXT_PUBLIC_SITE_URL configurada, os links apontam para o servidor local.
export function siteUrl(): URL {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  return new URL(url && /^https?:\/\/[^\s]+$/.test(url) ? url : "http://localhost:3000");
}

export const SITE_TITLE = "Flow · Sua preparação para o ENEM, no ritmo certo.";
export const SITE_DESCRIPTION =
  "Organize as matérias da semana e do dia, use o timer e lembre das revisões. Grátis, sem cadastro.";
