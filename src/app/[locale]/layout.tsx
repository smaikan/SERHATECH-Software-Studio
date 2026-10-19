import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Oxanium } from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { site } from "@/config/site";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MotionRoot } from "@/components/motion-ui";
import { motionPreferenceScript } from "@/components/motion-preference";
import { isLocale, locales, pathFor, text } from "@/i18n/routing";
import "../globals.css";

// Archivo fontu tek dosya, kendimiz sunuyoruz: latin harfler + türkçe karakterler,
// wght ve wdth eksenleri tam (scripts/subset-archivo.py ile kestim). yaklaşık 90 KB.
// google'ın latin + latin-ext ikilisi 172 KB civarıydı.
const archivo = localFont({
  src: "../../fonts/archivo/archivo-latin-tr.woff2",
  variable: "--font-archivo",
  weight: "400 700",
  display: "swap",
  // next/font/google'ın Archivo için kullandığı arial yedek ölçülerinin aynısı
  // (tokens.css'te). font gelene kadar görünen yazının satırları kaymasın diye.
  adjustFontFallback: false,
  fallback: ["Archivo Fallback"],
  declarations: [
    { prop: "font-stretch", value: "100% 125%" },
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD, U+011E-011F, U+0130, U+015E-015F",
    },
  ],
});
const plex = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
});
// Oxanium sadece marka adı için (.brand-name). tek kalınlık, sadece latin.
const oxanium = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
  weight: "700",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(site.url || "http://localhost:3200"),
  applicationName: site.name,
  robots: { index: site.indexable, follow: site.indexable },
  // design/brand/logo_dark.png'den scripts/build-brand.py ile üretildi.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
};
export const viewport: Viewport = {
  themeColor: "#eef1f4",
  viewportFit: "cover",
};
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html
      lang={locale}
      className={`${archivo.variable} ${plex.variable} ${oxanium.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionPreferenceScript }} />
      </head>
      <body>
        <MotionRoot>
          <a className="skip-link" href="#main">
            {text(locale, "İçeriğe geç", "Skip to content")}
          </a>
          <Header locale={locale} />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <Footer locale={locale} />
        </MotionRoot>
        {site.url ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "Organization",
                    "@id": `${site.url}/#organization`,
                    name: site.name,
                    url: site.url,
                    email: site.email,
                    founder: { "@id": `${site.url}/#founder` },
                  },
                  {
                    "@type": "Person",
                    "@id": `${site.url}/#founder`,
                    name: site.founder,
                    url: `${site.url}${pathFor(locale, "about")}`,
                    jobTitle: text(locale, "Kurucu, yazılım geliştirici", "Founder, software developer"),
                    worksFor: { "@id": `${site.url}/#organization` },
                  },
                ],
              }).replace(/</g, "\\u003c"),
            }}
          />
        ) : null}
      </body>
    </html>
  );
}
