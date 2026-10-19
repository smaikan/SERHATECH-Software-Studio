import { seoPolicy } from "./seo-policy";
const seo = seoPolicy(
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.SITE_INDEXING_ENABLED === "true",
);

export const site = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || "Serhatech",
  legalName: process.env.COMPANY_LEGAL_NAME || null,
  founder: "Serhat Kucı",
  descriptor: "Yazılım ve sistem stüdyosu",
  domain: "serha.tech",
  email: "iletisim@serha.tech",
  url: seo.origin,
  indexable: seo.indexable,
  locale: "tr_TR",
  portrait: null as null | { src: string; alt: string },
  socials: {
    github: process.env.NEXT_PUBLIC_GITHUB_URL || null,
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || null,
  },
  legalApproved: process.env.LEGAL_CONTENT_APPROVED === "true",
} as const;

