import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { allRoutes, locales, pathFor } from "@/i18n/routing";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!site.url || !site.indexable) return [];
  return locales.flatMap((locale) =>
    allRoutes()
      .filter((route) => !["privacy", "kvkk"].includes(route.page))
      .map((route) => ({
        url: `${site.url}${pathFor(locale, route.page, route.slug)}`,
        changeFrequency: "monthly" as const,
        priority: route.page === "home" ? 1 : 0.7,
        alternates: {
          languages: {
            tr: `${site.url}${pathFor("tr", route.page, route.slug)}`,
            en: `${site.url}${pathFor("en", route.page, route.slug)}`,
            "x-default": `${site.url}${pathFor("tr", route.page, route.slug)}`,
          },
        },
      })),
  );
}
