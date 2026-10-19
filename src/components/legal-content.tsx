import Link from "next/link";
import { site } from "@/config/site";
import { legalContent } from "@/content/legal";
import { text, pathFor, type Locale } from "@/i18n/routing";
import { PageIntro } from "./ui";

export function LegalContent({ kind, locale = "tr" }: { kind: "privacy" | "kvkk"; locale?: Locale }) {
  const content = legalContent[locale][kind];
  return (
    <>
      <PageIntro label={text(locale, "Yasal bilgiler", "Legal information")} title={content.title} description={content.description} />
      <div className="surface-day legal-surface">
        <div className="legal-page container">
          <article className="prose legal-copy" aria-label={content.title}>
            <p className="legal-updated">
              {text(locale, "Son güncelleme: ", "Last updated: ")}
              <time dateTime="2026-10-19">{text(locale, "19 Ekim 2026", "19 October 2026")}</time>
            </p>
            <p>{content.scope}</p>
            <nav aria-label={text(locale, "Bu sayfada", "On this page")} className="legal-contents">
              <ul>{content.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ul>
            </nav>
            {content.sections.map((section, index) => (
              <section key={section.id} aria-labelledby={section.id}>
                <h2 id={section.id}>{index + 1}. {section.title}</h2>
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
                {section.id === "contact" && <p><a className="text-link" href={`mailto:${site.email}`}>{site.email}</a></p>}
              </section>
            ))}
            <p>
              {text(locale, "İlgili metin: ", "Related notice: ")}
              <Link prefetch={false} className="text-link" href={pathFor(locale, kind === "privacy" ? "kvkk" : "privacy")}>
                {kind === "privacy" ? text(locale, "KVKK aydınlatma metni", "Data protection notice") : text(locale, "Gizlilik politikası", "Privacy policy")}
              </Link>
            </p>
            {kind === "kvkk" && <p>
              {text(locale, "Mevzuat ve başvuru bilgileri: ", "Legislation and request guidance: ")}
              <a href="https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law">{text(locale, "6698 sayılı Kanun", "Law No. 6698")}</a>
              {" · "}
              <a href="https://www.kvkk.gov.tr/Icerik/6938/Kurumumuza-Yapilan-Sikayetlerin-Usul-Sartlarina-Iliskin-Kamuoyu-Duyurusu">{text(locale, "KVKK başvuru usulü", "Request procedures")}</a>
            </p>}
            <p><Link prefetch={false} className="text-link" href={pathFor(locale, "contact")}>{text(locale, "İletişim sayfasına dön", "Return to contact")}</Link></p>
          </article>
        </div>
      </div>
    </>
  );
}
