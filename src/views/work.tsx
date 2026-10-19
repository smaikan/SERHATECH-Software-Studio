import { text, pathFor, type Locale } from "@/i18n/routing";
import { getProjects } from "@/content/english";
import { PageIntro, TextLink } from "@/components/ui";
import { ContactCallout } from "@/components/footer";
import { ArchitectureDiagram } from "@/components/svg/architecture-diagram";

export default function WorkPage({ locale }: { locale: Locale }) {
  const projects = getProjects(locale);
  return (
    <>
      <PageIntro
        label={text(locale, "Çalışmalar", "Work")}
        title={
          <>
            {text(locale, "Seçilmiş", "Selected")}
            <br />
            {text(locale, "çalışmalar.", "work.")}
          </>
        }
        description={text(
          locale,
          "Geliştirilen ürünlerden örnekler: ne işe yaradıkları ve parçalarının nasıl bir araya geldiği. Çizimler ürünlerin ana parçalarını gösterir; uygulama ekran görüntüsü değildir.",
          "Examples of products that have been built: what they do and how their parts fit together. The drawings show each product's main parts, not application screenshots.",
        )}
      />
      <div className="surface-day work-index">
        <ol className="container work-list">
          {projects.map((project) => (
            <li key={project.slug} className="work-entry">
              <a
                className="work-entry-visual bracket"
                href={pathFor(locale, "work", project.slug)}
                tabIndex={-1}
                aria-hidden="true"
              >
                <ArchitectureDiagram slug={project.slug} locale={locale} showTech={false} />
              </a>
              <div className="work-entry-copy">
                <p className="mono work-entry-kind">
                  {project.kind}
                  <span>{project.category}</span>
                </p>
                <h2>{project.name}</h2>
                <p>{project.description}</p>
                <TextLink href={pathFor(locale, "work", project.slug)}>
                  {text(locale, `${project.name} vaka çalışması`, `${project.name} case study`)}
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
