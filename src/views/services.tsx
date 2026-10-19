import { text, pathFor, type Locale } from "@/i18n/routing";
import { getServices } from "@/content/english";
import { PageIntro, TextLink } from "@/components/ui";
import { ContactCallout } from "@/components/footer";
import { ModuleGlyph } from "@/components/svg/module-glyph";

export default function ServicesPage({ locale }: { locale: Locale }) {
  const services = getServices(locale);
  return (
    <>
      <PageIntro
        label={text(locale, "Hizmetler", "Services")}
        title={
          <>
            {text(locale, "İşletmenize uygun", "Solutions that fit")}
            <br />
            {text(locale, "yazılım çözümleri.", "your business.")}
          </>
        }
        description={text(
          locale,
          "Birbirinden kopuk araçlar, tekrar eden işler veya henüz hayata geçmemiş bir fikir. İhtiyaç önce netleştirilir, ardından doğru kapsamda bir çözüm geliştirilir.",
          "Disconnected tools, repetitive work or an idea waiting to be built. The need is clarified first, then a solution is built with the right scope.",
        )}
        aside={<ModuleGlyph index={1} className="intro-glyph" />}
      />
      <div className="surface-day service-index">
        <ol className="container service-rows">
          {services.map((service, i) => (
            <li key={service.slug} className="service-row">
              <ModuleGlyph index={i} className="service-row-glyph" />
              <div className="service-row-head">
                <p className="mono service-row-node">{service.node}</p>
                <h2>{service.title}</h2>
                <p className="service-row-short">{service.short}</p>
              </div>
              <div className="service-row-body">
                <p>{service.description}</p>
                <ul className="service-row-gains">
                  {service.gains.map((gain) => (
                    <li key={gain}>{gain}</li>
                  ))}
                </ul>
                <TextLink href={pathFor(locale, "services", service.slug)}>
                  {text(locale, "Ayrıntıları incele", "See the details")}
                </TextLink>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <ContactCallout locale={locale} />
    </>
  );
}
