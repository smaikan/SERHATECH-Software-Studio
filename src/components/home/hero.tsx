import { text, pathFor, type Locale } from "@/i18n/routing";
import { ActionLink } from "@/components/ui";
import { CorePoster } from "./core-poster";
import { HeroPosterPhone } from "./hero-poster-phone";

export function Hero({ locale }: { locale: Locale }) {
  return (
    <section className="hero surface-day" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="readout">
            {text(
              locale,
              "Yazılım ve sistem stüdyosu",
              "Software & systems studio",
            )}
          </p>
          <h1 id="hero-title">
            {locale === "en" ? (
              <>
                <span className="line">From idea</span>
                <span className="line">to working software.</span>
              </>
            ) : (
              <>
                <span className="line">Fikrinizden</span>
                <span className="line">çalışan ürüne.</span>
              </>
            )}
          </h1>
          <p className="lead">
            {text(
              locale,
              "İşletmelere özel web uygulamaları, otomasyonlar ve birbirine bağlı sistemler. İhtiyaç analizinden yayına kadar tüm süreç tek elden yönetilir.",
              "Web applications, automations and connected systems built for your business. Managed end to end, from needs analysis to launch.",
            )}
          </p>
          <div className="hero-cta">
            {/* telefonda: canlı sahne gelene kadar sabit çekirdek, çizimin başlayacağı yerde yani
               butonların hemen üstünde bekliyor. */}
            <HeroPosterPhone>
              <CorePoster />
            </HeroPosterPhone>
            <div className="hero-actions">
              <ActionLink href={pathFor(locale, "contact")}>
                {text(locale, "Projenizi konuşalım", "Let’s talk about your project")}
              </ActionLink>
              <ActionLink href={pathFor(locale, "work")} secondary>
                {text(locale, "Çalışmaları incele", "Explore the work")}
              </ActionLink>
            </div>
          </div>
        </div>
        <div className="lab-stage hero-stage" data-stage="hero">
          <CorePoster />
        </div>
      </div>
    </section>
  );
}
