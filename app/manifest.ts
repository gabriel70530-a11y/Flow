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
    background_color: "#f4f3ee",
    theme_color: "#14213d",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
