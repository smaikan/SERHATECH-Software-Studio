import { describe, expect, it, vi } from "vitest";
vi.mock("../../src/config/site", () => ({
  site: {
    name: "Test Studio",
    url: "https://studio.example.com",
    indexable: true,
  },
}));
import { routeMetadata } from "../../src/i18n/metadata";
import sitemap from "../../src/app/sitemap";

describe("published language alternates", () => {
  it("links translated detail URLs and sets the correct Open Graph language", () => {
    const metadata = routeMetadata("en", {
      page: "work",
      slug: "meta-analiz-paneli",
    });
    expect(metadata.alternates).toEqual({
      canonical: "https://studio.example.com/en/work/meta-analysis-dashboard",
      languages: {
        tr: "https://studio.example.com/calismalar/meta-analiz-paneli",
        en: "https://studio.example.com/en/work/meta-analysis-dashboard",
        "x-default": "https://studio.example.com/calismalar/meta-analiz-paneli",
      },
    });
    expect(metadata.openGraph?.locale).toBe("en_US");
    expect(metadata.title).toEqual({
      absolute: "Meta Analysis Panel | Test Studio",
    });
  });
  it("lists both languages, reciprocal alternates and excludes draft legal pages", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(30);
    expect(entries.filter((entry) => entry.url.includes("/en"))).toHaveLength(
      15,
    );
    expect(
      entries.every((entry) =>
        Boolean(
          entry.alternates?.languages?.tr && entry.alternates?.languages?.en,
        ),
      ),
    ).toBe(true);
    expect(entries.some((entry) => entry.url.endsWith("/privacy"))).toBe(false);
  });
});
