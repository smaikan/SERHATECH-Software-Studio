import type { Locale } from "@/i18n/routing";
import { getProjects, getServices } from "@/content/english";
import { architectures } from "@/content/architectures";
import { ContactCallout } from "@/components/footer";
import { LabLoader } from "@/components/lab/lab-loader";
import type { ArchLayout } from "@/components/lab/director/director";
import { Hero } from "./hero";
import { ServicesBay } from "./services-bay";
import { WorkBay, featuredSlugs } from "./work-bay";
import { Approach, Founder } from "./calm-sections";
import { Journey } from "./journey";
import { HomeClient } from "./home-client";

// eşikte ışık kısılıyor (+1), açılıyor (−1) ya da aynı kalıyor (0). çekirdek de onunla
// birlikte görünüp kayboluyor. `explode` çekirdeğin hizmetler görünümüne açıldığı yer.
function Threshold({
  light,
  core = 0,
  arch = false,
  explode = false,
}: {
  light: 1 | -1 | 0;
  core?: 1 | -1 | 0;
  arch?: boolean;
  explode?: boolean;
}) {
  const kind = light > 0 ? "threshold-down" : light < 0 ? "threshold-up" : "threshold-calm";
  return (
    <div
      className={`threshold ${kind}`}
      data-threshold
      data-light={light}
      data-core={core}
      data-arch={arch ? "in" : undefined}
      data-explode={explode ? "in" : undefined}
      aria-hidden="true"
    >
      {light ? <span className="threshold-scan" /> : null}
    </div>
  );
}

function archLayouts(locale: Locale, compact = false): ArchLayout[] {
  return featuredSlugs.map((slug) => {
    const arch = architectures[slug];
    const columns = [...new Set(arch.nodes.map((n) => n.column))].sort((a, b) => a - b);
    const colIndex = new Map(columns.map((c, i) => [c, i]));
    const rows = arch.nodes.map((n) => n.row);
    const rowMid = (Math.min(...rows) + Math.max(...rows)) / 2;
    const ids = arch.nodes.map((n) => n.id);
    return {
      // geniş ekranda soldan sağa, dar ekranda yukarıdan aşağı okunuyor.
      nodes: arch.nodes.map((n) => {
        const col = (colIndex.get(n.column) ?? 0) - (columns.length - 1) / 2;
        const row = n.row - rowMid;
        return compact
          ? { x: row * 2.9, z: col * 2.6 }
          : { x: col * 2.75, z: row * 1.7 };
      }).map((pos, k) => ({
        ...pos,
        label: arch.nodes[k].label[locale],
        tech: "",
      })),
      edges: arch.edges.map(([a, b]) => [ids.indexOf(a), ids.indexOf(b)] as [number, number]),
      frame: arch.frame
        ? { nodes: arch.frame.nodeIds.map((id) => ids.indexOf(id)), label: arch.frame.label[locale] }
        : undefined,
    };
  });
}

export function HomePage({ locale = "tr" }: { locale?: Locale }) {
  const services = getServices(locale);
  const projects = getProjects(locale);
  return (
    <>
      <div className="home">
        <Hero locale={locale} />
        <Threshold light={0} core={-1} />
        <Journey locale={locale} />
        <Threshold light={1} core={1} explode />
        <ServicesBay locale={locale} services={services} />
        <Threshold light={-1} core={-1} />
        <Approach locale={locale} />
        <Threshold light={1} core={1} arch />
        <WorkBay locale={locale} projects={projects} />
        <Threshold light={-1} core={-1} />
        <Founder locale={locale} />
      </div>
      <ContactCallout locale={locale} />
      <HomeClient />
      <LabLoader
        services={services.map((s) => ({
          title: s.node,
          sub: s.benefit,
        }))}
        archs={archLayouts(locale)}
        compactArchs={archLayouts(locale, true)}
      />
    </>
  );
}
