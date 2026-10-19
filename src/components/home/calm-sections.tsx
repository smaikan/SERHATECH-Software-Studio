import Image from "next/image";
import { text, pathFor, type Locale } from "@/i18n/routing";
import { site } from "@/config/site";
import { TextLink } from "@/components/ui";

const problems = [
  {
    need: ["Aynı bilgiyi birkaç farklı yere giriyoruz.", "We type the same information into several places."],
    answer: [
      "Sistemler birbirine bağlanır; bilgi bir kez girilir ve her yerde güncel kalır.",
      "Systems are connected, so information is entered once and stays current everywhere.",
    ],
  },
  {
    need: ["Hazır yazılımlar işimize tam uymuyor.", "Off-the-shelf software doesn’t fit how we work."],
    answer: [
      "Ekibin çalışma biçimine göre bir panel veya uygulama geliştirilir.",
      "A panel or application is built around the way the team works.",
    ],
  },
  {
    need: ["Her hafta aynı işleri elle tekrarlıyoruz.", "We repeat the same work by hand every week."],
    answer: [
      "Tekrar eden adımlar kontrollü ve izlenebilir bir akışa dönüştürülür.",
      "Repeated steps become a controlled, traceable flow.",
    ],
  },
  {
    need: ["Mağazamızı başka bir platforma taşımamız gerekiyor.", "Our store has to move to another platform."],
    answer: [
      "Ürünler, varyantlar ve ilişkiler önceden test edilen kurallarla kayıpsız aktarılır.",
      "Products, variants and relations move over intact, using rules tested in advance.",
    ],
  },
  {
    need: ["Bir fikrimiz var, nereden başlayacağımızı bilmiyoruz.", "We have an idea but don’t know where to start."],
    answer: [
      "İhtiyaç netleştirilir ve ilk çalışan sürüm birlikte planlanır.",
      "The need is clarified and the first working version is planned together.",
    ],
  },
] as const;

export function Approach({ locale }: { locale: Locale }) {
  const pick = (pair: readonly [string, string]) => text(locale, pair[0], pair[1]);
  return (
    <section className="approach surface-day" aria-labelledby="approach-title">
      <div className="container approach-grid">
        <div className="section-head approach-head">
          <p className="readout">{text(locale, "Sık karşılaşılan ihtiyaçlar", "Common needs")}</p>
          <h2 id="approach-title">{text(locale, "Projeler genellikle böyle başlar.", "Projects usually start like this.")}</h2>
          <p className="lead">
            {text(
              locale,
              "Küçük ve orta ölçekli işletmeler, e-ticaret ekipleri ve girişimlerden gelen taleplerin çoğu şu cümlelerden biriyle başlar:",
              "Most requests from small and mid-sized businesses, e-commerce teams and startups begin with one of these sentences:",
            )}
          </p>
        </div>
        <ol className="problem-list" data-problems>
          {problems.map((item) => (
            <li key={item.need[0]} className="problem-row">
              <p className="problem-need">“{pick(item.need)}”</p>
              <span className="problem-link" aria-hidden="true">
                <svg viewBox="0 0 120 12" preserveAspectRatio="none">
                  <path d="M0 6H112" pathLength={1} />
                  <path d="m106 1 6 5-6 5" />
                </svg>
              </span>
              <p className="problem-answer">{pick(item.answer)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const principles = [
  {
    term: ["İletişim", "Communication"],
    detail: ["Doğrudan ve düzenli; her aşamada açık bilgi.", "Direct and regular, with clear information at every stage."],
  },
  {
    term: ["Kapsam", "Scope"],
    detail: ["Yazılı, ölçülebilir ve onaylı.", "Written, measurable and agreed."],
  },
  {
    term: ["Teslim", "Delivery"],
    detail: ["Çalışır durumda, belgelenmiş ve yayında.", "Working, documented and live."],
  },
  {
    term: ["Destek", "Support"],
    detail: ["Yayından sonra, anlaşmaya göre.", "After launch, as agreed."],
  },
] as const;

export function Founder({ locale }: { locale: Locale }) {
  const pick = (pair: readonly [string, string]) => text(locale, pair[0], pair[1]);
  const [first, ...rest] = site.founder.split(" ");
  return (
    <section className="founder surface-day" aria-labelledby="founder-title">
      <div className="container founder-grid">
        <div className="founder-name">
          <p className="readout">{text(locale, "Kurucu", "Founder")}</p>
          <h2 id="founder-title">
            <span className="founder-first">{first}</span> {rest.join(" ")}
            <span className="founder-dot" aria-hidden="true">.</span>
          </h2>
          {site.portrait ? (
            <div className="founder-portrait bracket">
              <Image
                src={site.portrait.src}
                alt={site.portrait.alt}
                fill
                sizes="(max-width: 900px) 80vw, 30vw"
              />
            </div>
          ) : null}
        </div>
        <div className="founder-copy">
          <p className="founder-lead">
            {text(
              locale,
              `${site.name}, işletmelerin yazılım ihtiyaçlarını baştan sona tek muhatapla çözebilmesi için kuruldu. Web ve mobil uygulamalar, sistem entegrasyonları ve otomasyonlar; ihtiyaç analizinden yayına kadar aynı özenle yönetilir.`,
              `${site.name} was founded so businesses can solve their software needs with one point of contact from start to finish. Web and mobile applications, system integrations and automations are managed with the same care from needs analysis to launch.`,
            )}
          </p>
          <dl className="founder-facts">
            {principles.map((item) => (
              <div key={item.term[0]}>
                <dt>{pick(item.term)}</dt>
                <dd>{pick(item.detail)}</dd>
              </div>
            ))}
          </dl>
          <TextLink href={pathFor(locale, "about")}>
            {text(locale, "Hakkında daha fazlası", "More about the studio")}
          </TextLink>
        </div>
      </div>
    </section>
  );
}
