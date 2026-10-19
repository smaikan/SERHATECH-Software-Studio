import { text, pathFor, type Locale } from "@/i18n/routing";
import type { Project } from "@/content/studio";
import { TextLink } from "@/components/ui";
import { ArchitectureDiagram } from "@/components/svg/architecture-diagram";

export const featuredSlugs = ["eleven-accessory", "nemora-diary", "meta-analiz-paneli"];

export function WorkBay({
  locale,
  projects,
}: {
  locale: Locale;
  projects: Project[];
}) {
  const featured = featuredSlugs
    .map((slug) => projects.find((p) => p.slug === slug))
    .filter((p): p is Project => Boolean(p));
  return (
    <section
      id={locale === "en" ? "work" : "calismalar"}
      className="bay work-bay surface-bay"
      data-theme="bay"
      data-bay="work"
      aria-labelledby="work-title"
    >
      <div className="container bay-head">
        <div className="section-head">
          <p className="readout">{text(locale, "Çalışmalar", "Work")}</p>
          <h2 id="work-title" data-split>
            {text(locale, "Seçilmiş çalışmalar.", "Selected work.")}
          </h2>
          <p className="lead">
            {text(
              locale,
              "Geliştirilen ürünlerden örnekler: ne işe yaradıkları ve parçalarının nasıl bir araya geldiği.",
              "Examples of products that have been built: what they do and how their parts fit together.",
            )}
          </p>
        </div>
      </div>
      <div className="container bay-grid">
        <div className="lab-stage bay-stage">
          <div className="stage-frame" data-stage="work">
          <div className="stage-fallback" aria-hidden="true">
            {featured.map((project, i) => (
              <ArchitectureDiagram
                key={project.slug}
                slug={project.slug}
                locale={locale}
                showTech={false}
                className={`stage-diagram${i === 0 ? " is-active" : ""}`}
              />
            ))}
          </div>
          </div>
        </div>
        <ol className="bay-cards">
          {featured.map((project, i) => (
            <li
              key={project.slug}
              className={`bay-card work-card bracket${i === 0 ? " is-active" : ""}`}
              data-card-index={i}
            >
              <p className="work-kind mono">
                {project.kind}
                <span>{project.category}</span>
              </p>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <TextLink href={pathFor(locale, "work", project.slug)}>
                {text(locale, "Vaka çalışmasını incele", "Read the case study")}
              </TextLink>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
