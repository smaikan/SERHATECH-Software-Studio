import { text, pathFor, type Locale } from "@/i18n/routing";
import Link from "next/link";
import { site } from "@/config/site";

export type Breadcrumb = { name: string; path: string };
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function Breadcrumbs({
  items,
  locale = "tr",
}: {
  items: Breadcrumb[];
  locale?: Locale;
}) {
  const trail = [
    { name: text(locale, "Ana sayfa", "Home"), path: pathFor(locale, "home") },
    ...items,
  ];
  return (
    <>
      <nav
        aria-label={text(locale, "Sayfa yolu", "Breadcrumb")}
        className="breadcrumbs container"
      >
        <ol>
          {trail.map((item, index) => (
            <li key={item.path}>
              {index === trail.length - 1 ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <Link prefetch={false} href={item.path}>
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      {site.url ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: trail.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              item: `${site.url}${item.path}`,
            })),
          }}
        />
      ) : null}
    </>
  );
}
