import Image from "next/image";
import { text, pathFor, type Locale } from "@/i18n/routing";
import { site } from "@/config/site";
import { PageIntro, TextLink } from "@/components/ui";
import { ContactCallout } from "@/components/footer";

const areas = [
  {
    title: ["Web uygulamaları", "Web applications"],
    body: [
      "Yönetim panelleri, müşteri portalları ve işletmeye özel iş uygulamaları.",
      "Admin panels, customer portals and business applications built for the company.",
    ],
  },
  {
    title: ["Mobil uygulamalar", "Mobile applications"],
    body: [
      "Sahadaki ekiplerin ve müşterilerin telefondan kullanacağı, mevcut sistemle aynı veriyle çalışan uygulamalar.",
      "Apps for field teams and customers on their phones, working with the same data as the existing system.",
    ],
  },
  {
    title: ["Entegrasyon ve otomasyon", "Integration and automation"],
    body: [
      "Kullanılan sistemlerin birbirine bağlanması ve tekrar eden işlerin kontrollü bir akışa dönüştürülmesi.",
      "Connecting the systems in use and turning repetitive work into a controlled flow.",
    ],
  },
  {
    title: ["E-ticaret", "E-commerce"],
    body: [
      "Mağaza kurulumu, platform geçişleri ve mağazanın günlük operasyona bağlanması.",
      "Store setup, platform moves and connecting the store to daily operations.",
    ],
  },
  {
    title: ["Yayın ve süreklilik", "Launch and continuity"],
    body: [
      "Güvenli kurulum, yedekleme ve güncelleme düzeni; uygun projelerde yapay zekâ destekli özellikler.",
      "Secure setup, backups and an update routine; AI-assisted features where they fit.",
    ],
  },
] as const;

export default function AboutPage({ locale }: { locale: Locale }) {
  const pick = (pair: readonly [string, string]) => text(locale, pair[0], pair[1]);
  return (
    <>
      <PageIntro
        label={text(locale, `${site.name} / Hakkında`, `${site.name} / About`)}
        title={
          <>
            {text(locale, "Tek muhatap,", "One point of contact,")}
            <br />
            {text(locale, "baştan sona.", "start to finish.")}
          </>
        }
        description={text(
          locale,
          `${site.name}, işletmelerin yazılım ihtiyaçlarını ilk görüşmeden yayına kadar tek muhatapla çözebilmesi için kurulmuş bir yazılım ve sistem stüdyosudur.`,
          `${site.name} is a software and systems studio founded so businesses can solve their software needs with one point of contact, from the first call to launch.`,
        )}
      />
      <div className="surface-day about-surface">
        <section className="founder-page container">
          <figure>
            <div className={site.portrait ? "portrait-image" : "founder-profile"}>
              {site.portrait ? (
                <Image
                  src={site.portrait.src}
                  alt={site.portrait.alt}
                  fill
                  sizes="(max-width:620px) 90vw, 35vw"
                />
              ) : (
                <>
                  <span className="founder-profile-name">{site.founder}.</span>
                  <p>{text(locale, `${site.name} kurucusu`, `Founder of ${site.name}`)}</p>
                  <dl>
                    <div>
                      <dt>{text(locale, "İletişim", "Contact")}</dt>
                      <dd>{site.email}</dd>
                    </div>
                  </dl>
                </>
              )}
            </div>
          </figure>
          <div className="prose">
            <h2>{text(locale, "Stüdyonun yaklaşımı", "How the studio works")}</h2>
            <p>
              {text(
                locale,
                "Bir yazılım projesinin başarısı, kodun yazılmasından çok önce başlar: işin nasıl yürüdüğünü anlamak, gerçek ihtiyacı ayırmak ve kapsamı açıkça belirlemek. Bu nedenle her proje bir keşif görüşmesi ve ihtiyaç analiziyle başlar.",
                "A software project succeeds long before the code is written: understanding how the work runs, separating the real need and setting a clear scope. That is why every project starts with a discovery call and a needs analysis.",
              )}
            </p>
            <p>
              {text(
                locale,
                "Planlama, geliştirme, test ve yayın aşamaları aynı kişi tarafından yönetilir. İhtiyacınızı dinleyen kişiyle çözümü geliştiren kişinin aynı olması, kararların hızlı ve açık şekilde alınmasını sağlar.",
                "Planning, development, testing and launch are managed by the same person. Because the person who listens to your need also builds the solution, decisions are made quickly and openly.",
              )}
            </p>
            <h2>{text(locale, "Uygulama ile sistemi birlikte ele almak", "The application and the system, together")}</h2>
            <p>
              {text(
                locale,
                "Bir uygulamanın ekranı, arkasındaki iş kuralları, kullandığı veriler ve çalıştığı sunucu birlikte düşünülür. Böylece teslim edilen ürün yalnızca çalışmakla kalmaz; güvenli, bakımı kolay ve büyümeye hazır olur.",
                "An application's screens, the business rules behind them, the data they use and the server they run on are considered together. The delivered product does not just work; it is secure, easy to maintain and ready to grow.",
              )}
            </p>
            <h2>{text(locale, "Açık iletişim, yazılı kapsam", "Open communication, written scope")}</h2>
            <p>
              {text(
                locale,
                "Teslim edilecekler, takvim ve kapsam dışı konular baştan yazılı hâle getirilir. Geliştirme süresince çalışan sürümler düzenli olarak paylaşılır; yayından sonraki destek ihtiyaca göre planlanır.",
                "Deliverables, the timeline and exclusions are written down up front. Working versions are shared regularly during development, and support after launch is planned as needed.",
              )}
            </p>
            <TextLink href={pathFor(locale, "contact")}>
              {text(locale, "İhtiyacınızı konuşalım", "Let’s discuss what you need")}
            </TextLink>
          </div>
        </section>
        <section className="expertise container">
          <h2>{text(locale, "Çalışma alanları.", "Areas of work.")}</h2>
          <div className="expertise-grid">
            {areas.map((area) => (
              <div key={area.title[0]}>
                <h3>{pick(area.title)}</h3>
                <p>{pick(area.body)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <ContactCallout locale={locale} />
    </>
  );
}
