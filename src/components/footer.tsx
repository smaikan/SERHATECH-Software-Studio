import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { text, pathFor, type Locale } from "@/i18n/routing";
import { site } from "@/config/site";
import { BrandName, Mark } from "./ui";
import { ChargeLink } from "./motion-ui";
import { MotionPreference } from "./motion-preference";

// sabit bir çizim + iki ayrı katman (dönme ve nabız). svg'nin içindeki parçaları
// doğrudan oynatsak ekranda olmasa bile her karede layout hesaplanırdı.
function Reactor() {
  const ticks = Array.from({ length: 48 }, (_, i) => i * 7.5);
  return (
    <div className="reactor" aria-hidden="true">
      <svg viewBox="0 0 240 240" fill="none">
        <g className="reactor-ticks">
          {ticks.map((angle) => (
            <path
              key={angle}
              d={angle % 30 === 0 ? "M120 6v14" : "M120 6v7"}
              transform={`rotate(${angle} 120 120)`}
            />
          ))}
        </g>
        <circle className="reactor-ring" cx="120" cy="120" r="78" />
        {Array.from({ length: 6 }, (_, i) => (
          <rect
            key={i}
            className="reactor-module"
            x="108"
            y="24"
            width="24"
            height="16"
            transform={`rotate(${i * 60} 120 120)`}
          />
        ))}
        <circle className="reactor-core" cx="120" cy="120" r="22" />
      </svg>
      <svg className="reactor-spin" viewBox="0 0 240 240" fill="none">
        <circle className="reactor-ring reactor-ring-dash" cx="120" cy="120" r="62" />
      </svg>
      <span className="reactor-pulse" />
    </div>
  );
}

export function ContactCallout({ locale = "tr" }: { locale?: Locale }) {
  return (
    <section
      className="contact-callout surface-bay"
      data-theme="bay"
      aria-labelledby="callout-title"
    >
      <div className="container callout-grid">
        <div className="callout-copy">
          <h2 id="callout-title">
            {text(locale, "Projenizi", "Let’s talk about")}
            <br />
            {text(locale, "konuşalım.", "your project.")}
          </h2>
          <p className="lead">
            {text(
              locale,
              "Hazır bir teknik dokümana gerek yok. İşinizi ve çözmek istediğiniz sorunu kısaca anlatmanız yeterli; her mesaj okunur ve yanıtlanır.",
              "You don’t need a technical specification. A short description of your business and the problem to solve is enough; every message is read and answered.",
            )}
          </p>
          <div className="callout-actions">
            <ChargeLink href={pathFor(locale, "contact")}>
              {text(locale, "Proje formunu doldur", "Fill in the project form")}
            </ChargeLink>
            <a className="email-link" href={`mailto:${site.email}`}>
              <span>{site.email}</span>
              <ArrowUpRight size={20} aria-hidden="true" />
            </a>
          </div>
        </div>
        <Reactor />
      </div>
    </section>
  );
}

export function Footer({ locale = "tr" }: { locale?: Locale }) {
  return (
    <footer className="site-footer surface-bay" data-theme="bay">
      <div className="container">
        <div className="footer-top">
          <Link
            prefetch={false}
            href={pathFor(locale, "home")}
            className="brand"
          >
            <Mark />
            <BrandName />
          </Link>
          <p className="footer-claim">
            {text(
              locale,
              "Web ve mobil uygulamalar, sistem entegrasyonları ve otomasyon. İhtiyaç analizinden yayına, tek muhatapla.",
              "Web and mobile applications, system integrations and automation. From needs analysis to launch, with one point of contact.",
            )}
          </p>
          <nav
            className="footer-links"
            aria-label={text(locale, "Alt navigasyon", "Footer navigation")}
          >
            <Link prefetch={false} href={pathFor(locale, "services")}>
              {text(locale, "Hizmetler", "Services")}
            </Link>
            <Link prefetch={false} href={pathFor(locale, "work")}>
              {text(locale, "Çalışmalar", "Work")}
            </Link>
            <Link prefetch={false} href={pathFor(locale, "about")}>
              {text(locale, "Hakkımda", "About")}
            </Link>
            <Link prefetch={false} href={pathFor(locale, "process")}>
              {text(locale, "Çalışma süreci", "Process")}
            </Link>
            <Link prefetch={false} href={pathFor(locale, "contact")}>
              {text(locale, "İletişim", "Contact")}
            </Link>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© 2026 {site.name}</span>
          <div className="footer-meta">
            <Link prefetch={false} href={pathFor(locale, "privacy")}>
              {text(locale, "Gizlilik", "Privacy")}
            </Link>
            <Link prefetch={false} href={pathFor(locale, "kvkk")}>
              {text(locale, "KVKK", "Data protection")}
            </Link>
            <MotionPreference locale={locale} />
            <a href="#main">{text(locale, "Yukarı dön", "Back to top")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
