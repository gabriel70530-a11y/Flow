import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";

// Permite instalar o Flow na tela inicial do celular; abre direto no Painel.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flow",
    short_name: "Flow",
    description: SITE_DESCRIPTION,
    lang: "pt-BR",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    background_color: "#f3f8fb",
    theme_color: "#135487",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
