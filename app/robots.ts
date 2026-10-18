import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const APP_ROUTES = ["/painel", "/cronograma", "/materias", "/timer", "/revisoes", "/ajustes", "/planos", "/comecar"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: APP_ROUTES },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
