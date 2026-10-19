import { text, pathFor, type Locale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getServices } from "@/content/english";
import { ActionLink, PageIntro, TextLink } from "@/components/ui";
import { ContactCallout } from "@/components/footer";
import { Breadcrumbs, JsonLd } from "@/components/breadcrumbs";
import { ModuleGlyph } from "@/components/svg/module-glyph";
import { site } from "@/config/site";

export default function Detail({ locale, slug }: { locale: Locale; slug: string }) {
  const services = getServices(locale);
  const index = services.findIndex((item) => item.slug === slug);
  const service = services[index];
  if (!service) notFound();
  return (
    <>
      <Breadcrumbs
        locale={locale}
        items={[
          { name: text(locale, "Hizmetler", "Services"), path: pathFor(locale, "services") },
          { name: service.title, path: pathFor(locale, "services", slug) },
        ]}
      />
      {site.url ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.title,
            description: service.description,
            url: `${site.url}${pathFor(locale, "services", slug)}`,
            provider: {
              "@type": "Person",
              name: site.founder,
              url: `${site.url}${pathFor(locale, "about")}`,
            },
          }}
        />
      ) : null}
      <PageIntro
        label={text(locale, `Hizmet modülü / ${service.node}`, `Service module / ${service.node}`)}
        title={service.title}
        description={service.short}
        aside={<ModuleGlyph index={index} className="intro-glyph" title={service.title} />}
      />
      <div className="surface-day detail-surface">
        <div className="container detail-layout">
          <aside className="detail-aside">
            <div className="spec bracket">
              <p className="spec-title">{service.short}</p>
              <ul className="service-row-gains">
                {service.gains.map((gain) => (
                  <li key={gain}>{gain}</li>
                ))}
              </ul>
              <ActionLink
                href={`${pathFor(locale, "contact")}?${locale === "en" ? "service" : "hizmet"}=${service.slug}`}
              >
                {text(locale, "Bu ihtiyacı konuşalım", "Let’s discuss this need")}
              </ActionLink>
            </div>
          </aside>
          <article className="prose">
            <p className="prose-lead">{service.description}</p>
            <h2>{text(locale, "Nerede ihtiyaç duyulur?", "When is it useful?")}</h2>
            <p>{service.problem}</p>
            <h2>{text(locale, "Nasıl ele alınır?", "How it is approached")}</h2>
            <p>{service.solution}</p>
            <h2>{text(locale, "Neler yapılabilir?", "What we can build")}</h2>
            <ul>
              {service.scope.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h2>{text(locale, "Örnek bir kullanım", "A practical example")}</h2>
            <p>{service.scenario}</p>
            <p className="notice">
              {text(
                locale,
                "Her proje kendi koşullarına göre değerlendirilir. Kesin kapsam, teslim adımları ve destek ihtiyacı görüşme sonrasında birlikte belirlenir.",
                "Each project is assessed on its own terms. We agree on the scope, delivery milestones and support needs after discussing your situation.",
              )}
            </p>
            <div className="tech-note">
              <h2>{text(locale, "Kullanılan teknolojiler", "Technologies used")}</h2>
              <p>
                {text(
                  locale,
                  "Teknik karar vericiler için: bu hizmette sık kullanılan araçlar. Seçim her projede ihtiyaca göre yapılır.",
                  "For technical decision makers: tools often used for this service. The choice is made per project.",
                )}
              </p>
              <ul className="stack">
                {service.stack.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </div>
          </article>
        </div>
        <section className="container related" aria-labelledby="related-title">
          <h2 id="related-title">{text(locale, "Diğer modüller", "Other modules")}</h2>
          <ul className="related-grid">
            {services
              .map((item, i) => ({ item, i }))
              .filter(({ item }) => item.slug !== slug)
              .map(({ item, i }) => (
                <li key={item.slug}>
                  <a className="related-card" href={pathFor(locale, "services", item.slug)}>
                    <ModuleGlyph index={i} className="related-glyph" />
                    <span className="mono">{item.node}</span>
                    <span className="related-title">{item.title}</span>
                  </a>
                </li>
              ))}
          </ul>
          <TextLink href={pathFor(locale, "services")}>
            {text(locale, "Tüm hizmetler", "All services")}
          </TextLink>
        </section>
      </div>
      <ContactCallout locale={locale} />
    </>
  );
}
