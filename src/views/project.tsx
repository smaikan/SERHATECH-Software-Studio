import Image from "next/image";
import { notFound } from "next/navigation";
import { text, pathFor, type Locale } from "@/i18n/routing";
import { getProjects } from "@/content/english";
import { architectures } from "@/content/architectures";
import { PageIntro, TextLink } from "@/components/ui";
import { ContactCallout } from "@/components/footer";
import { Breadcrumbs, JsonLd } from "@/components/breadcrumbs";
import { ArchitectureDiagram } from "@/components/svg/architecture-diagram";
import { FocusDiagram } from "@/components/svg/focus-diagram";
import { site } from "@/config/site";

export default function Detail({ locale, slug }: { locale: Locale; slug: string }) {
  const projects = getProjects(locale);
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();
  const next = projects[(projects.indexOf(project) + 1) % projects.length];
  const arch = architectures[slug];
  const columns = arch ? [...new Set(arch.nodes.map((n) => n.column))].sort((a, b) => a - b) : [];
  const inColumn = (c: number | undefined) =>
    arch?.nodes.filter((n) => n.column === c).map((n) => n.id).join(" ") ?? "";
  const all = arch?.nodes.map((n) => n.id).join(" ") ?? "";
  // her paragraf mimarinin kendi anlattığı kısmını vurguluyor.
  const sections = [
    { title: text(locale, "İhtiyaç", "The need"), body: project.problem, focus: inColumn(columns[0]) },
    { title: text(locale, "Geliştirilen çözüm", "The solution"), body: project.solution, focus: all },
    {
      title: text(locale, "Teknik yaklaşım", "Technical approach"),
      body: project.approach,
      focus: inColumn(columns[Math.min(1, columns.length - 1)]),
    },
    {
      title: text(locale, "Ele alınan zorluk", "The challenge"),
      body: project.challenge,
      focus: inColumn(columns[columns.length - 1]),
    },
    { title: text(locale, "Çalışmanın kapsamı", "Scope of the work"), body: project.result, focus: all },
  ];
  return (
    <>
      <Breadcrumbs
        locale={locale}
        items={[
          { name: text(locale, "Çalışmalar", "Work"), path: pathFor(locale, "work") },
          { name: project.name, path: pathFor(locale, "work", slug) },
        ]}
      />
      {site.url ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.name,
            description: project.description,
            url: `${site.url}${pathFor(locale, "work", slug)}`,
            inLanguage: locale,
            genre: project.kind,
          }}
        />
      ) : null}
      <PageIntro
        label={`${project.kind} / ${project.category}`}
        title={project.name}
        description={project.description}
      />
      <div className="surface-day case-surface">
        <div className="container case-layout">
          <div className="case-visual">
            <div className="case-visual-inner bracket" data-focus-diagram>
              <p className="mono case-visual-label">
                {text(locale, "Ürünün ana parçaları", "The product's main parts")}
              </p>
              <ArchitectureDiagram slug={slug} locale={locale} />
              <p className="case-visual-note">
                {text(
                  locale,
                  "Projede kullanılan gerçek parçalar. Uygulama ekran görüntüsü değildir.",
                  "The real parts used in the project, not an application screenshot.",
                )}
              </p>
            </div>
            {project.github || project.demo ? (
              <div className="case-meta">
                {project.github ? (
                  <TextLink href={project.github}>{text(locale, "Kaynak kodu", "Source code")}</TextLink>
                ) : null}
                {project.demo ? (
                  <TextLink href={project.demo}>{text(locale, "Uygulamayı aç", "Open application")}</TextLink>
                ) : null}
              </div>
            ) : null}
          </div>
          <article className="prose case-prose">
            {sections.map((section) => (
              <section key={section.title} data-focus={section.focus}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </section>
            ))}
            {project.image ? (
              <figure className="case-image bracket">
                <Image
                  src={project.image.src}
                  alt={project.image.alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 55vw"
                />
              </figure>
            ) : (
              <p className="notice">
                {text(
                  locale,
                  "Gerçek ekran görüntüleri henüz eklenmedi. Eklendiğinde bu bölümde yer alacak.",
                  "Actual screenshots have not been added yet. They will appear here once available.",
                )}
              </p>
            )}
            <div className="tech-note">
              <h2>{text(locale, "Kullanılan teknolojiler", "Technologies used")}</h2>
              <ul className="stack">
                {project.stack.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </div>
          </article>
        </div>
        <FocusDiagram />
        <section className="container next-project" aria-labelledby="next-title">
          <p className="readout">{text(locale, "Sıradaki çalışma", "Next project")}</p>
          <a className="next-project-link" href={pathFor(locale, "work", next.slug)}>
            <span id="next-title">{next.name}</span>
            <span className="mono">{next.kind}</span>
          </a>
        </section>
      </div>
      <ContactCallout locale={locale} />
    </>
  );
}
