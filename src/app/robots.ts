import type { MetadataRoute } from "next";
import { site } from "@/config/site";
export default function robots(): MetadataRoute.Robots {
  const ready = site.indexable;
  return {
    rules: {
      userAgent: "*",
      ...(ready
        ? {
            allow: "/",
            disallow: [
              "/api/",
              "/gizlilik",
              "/kvkk",
              "/en/privacy",
              "/en/data-protection",
            ],
          }
        : { disallow: "/" }),
    },
    ...(ready ? { sitemap: `${site.url}/sitemap.xml` } : {}),
  };
}
