import type { Metadata } from "next";
import { site } from "@/config/site";
import { languageUrl, type Locale } from "@/i18n/routing";

export function pageMetadata(
  title: string,
  description: string,
  path: string,
  locale: Locale = "tr",
): Metadata {
  const imagePath =
    locale === "en" ? "/opengraph-image-en" : "/opengraph-image";
  return {
    metadataBase: new URL(site.url || "http://localhost:3200"),
    title: { absolute: `${title} | ${site.name}` },
    description,
    alternates: site.url
      ? {
          canonical: `${site.url}${path}`,
          languages: {
            tr: `${site.url}${languageUrl(path, "tr")}`,
            en: `${site.url}${languageUrl(path, "en")}`,
            "x-default": `${site.url}${languageUrl(path, "tr")}`,
          },
        }
      : undefined,
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      locale: locale === "tr" ? "tr_TR" : "en_US",
      alternateLocale: locale === "tr" ? "en_US" : "tr_TR",
      type: "website",
      ...(site.url ? { url: `${site.url}${path}` } : {}),
      images: [
        {
          url: imagePath,
          width: 1200,
          height: 630,
          alt: `${site.name} — ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description,
      images: [imagePath],
    },
  };
}
