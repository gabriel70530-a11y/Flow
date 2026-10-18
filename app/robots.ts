import type { MetadataRoute } from "next";
import { APP_ROUTES, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: APP_ROUTES },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
