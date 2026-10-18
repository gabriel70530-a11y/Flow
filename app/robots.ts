import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const APP_ROUTES = [
  "/painel",
  "/cronograma",
  "/materias",
  "/timer",
  "/revisoes",
  "/simulados",
  "/redacao",
  "/prova",
  "/ajustes",
  "/planos",
  "/comecar",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: APP_ROUTES },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
