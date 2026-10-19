import { text, type Locale } from "@/i18n/routing";
import { JourneyPath } from "./journey-path";

const stops = [
  {
    title: ["Keşif görüşmesi", "Discovery call"],
    body: [
      "İşletmenizin bugünkü işleyişi, hedefleri ve aksayan noktaları ele alınır.",
      "How your business runs today, its goals and its friction points are discussed.",
    ],
  },
  {
    title: ["İhtiyaç analizi", "Needs analysis"],
    body: [
      "Gerçek ihtiyaç netleştirilir; şimdi gerekli olan ile ertelenebilecek olan ayrılır.",
      "The real need is clarified; what is required now is separated from what can wait.",
    ],
  },
  {
    title: ["Planlama ve kapsam", "Planning and scope"],
    body: [
      "Kapsam, takvim ve teslim adımları yazılı hâle gelir. Neyin, ne zaman teslim edileceği baştan bellidir.",
      "Scope, timeline and delivery steps are put in writing, so what arrives and when is clear from the start.",
    ],
  },
  {
    title: ["Geliştirme ve yayın", "Development and launch"],
    body: [
      "Çalışan sürümler düzenli olarak paylaşılır, test edilir ve kullanıma hazır şekilde yayına alınır. Sonraki destek anlaşmaya göre planlanır.",
      "Working versions are shared regularly, tested and launched ready for use. Support afterwards is planned as agreed.",
    ],
  },
] as const;

const principles = [
  {
    title: ["Tek muhatap", "One point of contact"],
    body: [
      "Proje baştan sona aynı kişi tarafından yönetilir; bilgi arada kaybolmaz.",
      "The project is managed by the same person from start to finish; nothing gets lost in hand-offs.",
    ],
  },
  {
    title: ["Yazılı kapsam", "Written scope"],
    body: [
      "Teslim edilecekler, kapsam dışı konular ve takvim baştan yazılıdır.",
      "Deliverables, exclusions and the timeline are written down from the start.",
    ],
  },
  {
    title: ["Düzenli ilerleme", "Steady progress"],
    body: [
      "Gelişmeler çalışan sürümler üzerinden, belirli aralıklarla paylaşılır.",
      "Progress is shared through working versions, at agreed intervals.",
    ],
  },
] as const;

// hero ile hizmetler arasındaki, müşteriye dönük bölüm: bir proje nasıl yürüyor.
// yazı ilk html'de geliyor, çizgi sonradan eklenen bir süs.
export function Journey({ locale }: { locale: Locale }) {
  const pick = (pair: readonly [string, string]) => text(locale, pair[0], pair[1]);
  return (
    <section className="journey surface-day" aria-labelledby="journey-title" data-journey>
      <div className="container journey-grid">
        <div className="journey-main">
        <div className="section-head journey-head">
          <p className="readout">{text(locale, "Çalışma biçimi", "How projects run")}</p>
          <h2 id="journey-title">
            {text(locale, "İlk görüşmeden yayına kadar tek süreç.", "One process, from first call to launch.")}
          </h2>
          <p className="lead">
            {text(
              locale,
              "Projenin her aşaması tek elden yönetilir. Teknik ayrıntıları bilmeniz gerekmez; her aşamada neyin yapıldığı ve sırada ne olduğu açıkça paylaşılır.",
              "Every stage of the project is managed in one place. You don’t need the technical details; what has been done and what comes next is shared clearly at each stage.",
            )}
          </p>
        </div>
        <div className="journey-track">
          <JourneyPath />
          <ol className="journey-stops">
            {stops.map((stop, i) => (
              <li key={stop.title[0]} className="journey-stop" data-stop={i}>
                <span className="journey-node" aria-hidden="true" />
                <div className="journey-copy">
                  <p className="journey-index mono" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3>{pick(stop.title)}</h3>
                  <p>{pick(stop.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        </div>
        <ul className="journey-principles">
          {principles.map((item) => (
            <li key={item.title[0]}>
              <h3>{pick(item.title)}</h3>
              <p>{pick(item.body)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
