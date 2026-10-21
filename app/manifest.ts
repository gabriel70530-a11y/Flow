import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";

// Permite instalar o Flow na tela inicial do celular; abre direto no Painel.
// Os PNGs são exigidos pelo app Android (TWA) e pela Play Store; o SVG fica para os navegadores.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/painel",
    name: "Flow",
    short_name: "Flow",
    description: SITE_DESCRIPTION,
    lang: "pt-BR",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    background_color: "#f3f8fb",
    theme_color: "#135487",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
