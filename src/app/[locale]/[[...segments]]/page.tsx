import { notFound } from "next/navigation";
import { HomePage } from "@/components/home/home-page";
import { LegalContent } from "@/components/legal-content";
import About from "@/views/about";
import Services from "@/views/services";
import Service from "@/views/service";
import Work from "@/views/work";
import Project from "@/views/project";
import Process from "@/views/process";
import Contact from "@/views/contact";
import { allRoutes, isLocale, locales, pathFor, routeAt } from "@/i18n/routing";
import { routeMetadata } from "@/i18n/metadata";

type Props = {
  params: Promise<{ locale: string; segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
// sitedeki bütün sayfalar bu tek route'tan geçiyor, hangisi açılacak URL'ye bakıp
// karar veriyoruz. o yüzden önce gösterilecek ortak bir iskelet yok. sayfaların hepsi
// zaten önceden üretiliyor (generateStaticParams), geçişte sadece hazır veri geliyor.
// Suspense ile sarsaydık her tıklamada boş bir ekran yanıp sönerdi, onu istemedim.
export const instant = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => [
    ...allRoutes().map((route) => ({
      locale,
      segments: pathFor(locale, route.page, route.slug)
        .split("/")
        .filter(Boolean)
        .slice(locale === "en" ? 1 : 0),
    })),
    { locale, segments: ["not-found"] },
  ]);
}
export async function generateMetadata({ params }: Props) {
  const { locale, segments } = await params;
  return isLocale(locale)
    ? routeMetadata(locale, routeAt(locale, segments))
    : {};
}
export default async function Page({ params, searchParams }: Props) {
  const { locale, segments } = await params;
  if (!isLocale(locale)) notFound();
  const route = routeAt(locale, segments);
  if (!route) notFound();
  switch (route.page) {
    case "home":
      return <HomePage locale={locale} />;
    case "services":
      return route.slug ? (
        <Service locale={locale} slug={route.slug} />
      ) : (
        <Services locale={locale} />
      );
    case "work":
      return route.slug ? (
        <Project locale={locale} slug={route.slug} />
      ) : (
        <Work locale={locale} />
      );
    case "about":
      return <About locale={locale} />;
    case "process":
      return <Process locale={locale} />;
    case "contact":
      return <Contact locale={locale} searchParams={searchParams} />;
    case "privacy":
    case "kvkk":
      return <LegalContent locale={locale} kind={route.page} />;
  }
}
