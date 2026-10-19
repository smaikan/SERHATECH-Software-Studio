export type Locale = "tr" | "en";
export const locales: Locale[] = ["tr", "en"];
export const text = (locale: Locale, tr: string, en: string) =>
  locale === "en" ? en : tr;
export const isLocale = (value: string): value is Locale =>
  value === "tr" || value === "en";

export const pages = {
  home: ["", ""],
  services: ["hizmetler", "services"],
  work: ["calismalar", "work"],
  about: ["hakkimda", "about"],
  process: ["surec", "process"],
  contact: ["iletisim", "contact"],
  privacy: ["gizlilik", "privacy"],
  kvkk: ["kvkk", "data-protection"],
} as const;
export type PageKey = keyof typeof pages;
export const servicePaths = {
  "ozel-web-uygulamalari": "custom-web-applications",
  "backend-api-gelistirme": "backend-api-development",
  "e-ticaret-sistemleri": "ecommerce-systems",
  "is-sureci-otomasyonu": "workflow-automation",
  "sistem-ve-altyapi": "systems-infrastructure",
  "yapay-zeka-entegrasyonlari": "ai-integrations",
} as const;
export const projectPaths = {
  "eleven-accessory": "eleven-accessory",
  "nemora-diary": "nemora-diary",
  "meta-analiz-paneli": "meta-analysis-dashboard",
} as const;
export type Route = { page: PageKey; slug?: string };
export function pathFor(locale: Locale, page: PageKey, slug?: string) {
  const prefix = locale === "en" ? "/en" : "";
  let segment: string = pages[page][locale === "en" ? 1 : 0];
  if (slug) {
    const map = page === "services" ? servicePaths : projectPaths;
    const localized = locale === "en" ? map[slug as keyof typeof map] : slug;
    segment += `/${localized || slug}`;
  }
  return `${prefix}${segment ? `/${segment}` : ""}` || "/";
}
export function routeAt(locale: Locale, segments: string[] = []): Route | null {
  const joined = segments.join("/");
  for (const page of Object.keys(pages) as PageKey[]) {
    if (joined === pages[page][locale === "en" ? 1 : 0]) return { page };
  }
  if (segments.length !== 2) return null;
  for (const [page, map] of [
    ["services", servicePaths],
    ["work", projectPaths],
  ] as const) {
    if (segments[0] !== pages[page][locale === "en" ? 1 : 0]) continue;
    const entry = Object.entries(map).find(
      ([id, english]) => segments[1] === (locale === "en" ? english : id),
    );
    if (entry) return { page, slug: entry[0] };
  }
  return null;
}
export function publicRoute(pathname: string): {
  locale: Locale;
  route: Route | null;
} {
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0] === "en" ? "en" : "tr";
  if (segments[0] === "en" || segments[0] === "tr") segments.shift();
  return { locale, route: routeAt(locale, segments) };
}
export function languageUrl(input: string, locale: Locale) {
  const url = new URL(input, "https://local.invalid");
  const { route } = publicRoute(url.pathname);
  url.pathname = route
    ? pathFor(locale, route.page, route.slug)
    : pathFor(locale, "home");
  const service =
    url.searchParams.get("hizmet") || url.searchParams.get("service");
  url.searchParams.delete("hizmet");
  url.searchParams.delete("service");
  if (service)
    url.searchParams.set(locale === "en" ? "service" : "hizmet", service);
  if (url.hash === "#hizmetler" || url.hash === "#services")
    url.hash = locale === "en" ? "services" : "hizmetler";
  return `${url.pathname}${url.search}${url.hash}`;
}
export function allRoutes(): Route[] {
  return [
    ...(Object.keys(pages) as PageKey[]).map((page) => ({ page })),
    ...Object.keys(servicePaths).map((slug) => ({
      page: "services" as const,
      slug,
    })),
    ...Object.keys(projectPaths).map((slug) => ({
      page: "work" as const,
      slug,
    })),
  ];
}
