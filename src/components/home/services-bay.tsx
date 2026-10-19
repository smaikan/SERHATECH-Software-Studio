import { text, pathFor, type Locale } from "@/i18n/routing";
import type { Service } from "@/content/studio";
import { TextLink } from "@/components/ui";
import { ModuleGlyph } from "@/components/svg/module-glyph";

export function serviceAnchor(slug: string) {
  return `modul-${slug}`;
}

export function ServicesBay({
  locale,
  services,
}: {
  locale: Locale;
  services: Service[];
}) {
  return (
    <section
      id={locale === "en" ? "services" : "hizmetler"}
      className="bay services-bay surface-bay"
      data-theme="bay"
      data-bay="services"
      aria-labelledby="services-title"
    >
      <div className="container bay-head">
        <div className="section-head">
          <p className="readout">{text(locale, "Hizmetler", "Services")}</p>
          <h2 id="services-title" data-split>
            {text(locale, "İşletmenize uygun çözümler.", "Solutions that fit your business.")}
          </h2>
          <p className="lead">
            {text(
              locale,
              "İhtiyaç hangi alandaysa oradan başlanır. Tüm parçalar, birlikte çalışacak şekilde planlanır.",
              "Work starts wherever the need is. Every part is planned to work with the others.",
            )}
          </p>
        </div>
      </div>
      <div className="container bay-grid">
        <div className="lab-stage bay-stage">
          <div className="stage-frame" data-stage="services">
          <div className="stage-fallback" aria-hidden="true">
            {services.map((service, i) => (
              <ModuleGlyph
                key={service.slug}
                index={i}
                className={`stage-glyph${i === 0 ? " is-active" : ""}`}
              />
            ))}
          </div>
          </div>
          <nav
            className="bay-rail"
            aria-label={text(locale, "Hizmet modülleri", "Service modules")}
          >
            <ol>
              {services.map((service, i) => (
                <li key={service.slug}>
                  <a
                    href={`#${serviceAnchor(service.slug)}`}
                    className={i === 0 ? "is-active" : undefined}
                    data-rail-index={i}
                  >
                    {service.node}
                  </a>
                </li>
              ))}
            </ol>
            <span className="bay-rail-meter" aria-hidden="true">
              <span />
            </span>
          </nav>
        </div>
        <ol className="bay-cards">
          {services.map((service, i) => (
            <li
              key={service.slug}
              id={serviceAnchor(service.slug)}
              className={`bay-card bracket${i === 0 ? " is-active" : ""}`}
              data-card-index={i}
            >
              <p className="bay-card-node mono">{service.node}</p>
              <h3>{service.title}</h3>
              <p className="bay-card-short">{service.short}</p>
              <ul className="bay-card-gains">
                {service.gains.map((gain) => (
                  <li key={gain}>{gain}</li>
                ))}
              </ul>
              <TextLink href={pathFor(locale, "services", service.slug)}>
                {text(locale, "Hizmeti incele", "Explore the service")}
              </TextLink>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
