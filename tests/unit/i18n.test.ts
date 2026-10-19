import { describe, expect, it } from "vitest";
import {
  allRoutes,
  languageUrl,
  locales,
  pathFor,
  publicRoute,
  routeAt,
} from "../../src/i18n/routing";
import {
  getServices,
  getProjects,
  getProcessSteps,
} from "../../src/content/english";
import { createContactSchema } from "../../src/lib/contact-schema";

describe("two-language routes", () => {
  it("has a unique, reversible URL for every page in both languages", () => {
    expect(allRoutes()).toHaveLength(17);
    for (const locale of locales) {
      const urls = allRoutes().map((route) =>
        pathFor(locale, route.page, route.slug),
      );
      expect(new Set(urls).size).toBe(17);
      for (const route of allRoutes()) {
        const url = pathFor(locale, route.page, route.slug);
        expect(publicRoute(url)).toEqual({ locale, route });
        expect(
          languageUrl(languageUrl(url, locale === "tr" ? "en" : "tr"), locale),
        ).toBe(url);
      }
    }
  });
  it("preserves the selected service, other query values and anchor", () => {
    expect(
      languageUrl(
        "/iletisim?hizmet=backend-api-gelistirme&ref=test#inquiry-title",
        "en",
      ),
    ).toBe("/en/contact?ref=test&service=backend-api-gelistirme#inquiry-title");
    expect(
      languageUrl("/en/contact?service=backend-api-gelistirme", "tr"),
    ).toBe("/iletisim?hizmet=backend-api-gelistirme");
    expect(languageUrl("/#hizmetler", "en")).toBe("/en#services");
    expect(languageUrl("/en/work/meta-analysis-dashboard", "tr")).toBe(
      "/calismalar/meta-analiz-paneli",
    );
  });
  it("rejects unknown and mixed-language routes", () => {
    for (const [locale, parts] of [
      ["en", ["hizmetler"]],
      ["tr", ["services"]],
      ["en", ["work", "unknown"]],
      ["en", ["contact", "extra"]],
    ] as const)
      expect(routeAt(locale, [...parts])).toBeNull();
  });
  it("keeps real project and service identities and technology stacks", () => {
    for (const get of [getServices, getProjects]) {
      expect(get("en").map((item) => item.slug)).toEqual(
        get("tr").map((item) => item.slug),
      );
      expect(get("en").map((item) => item.stack)).toEqual(
        get("tr").map((item) => item.stack),
      );
      expect(get("en").every((item) => item.description.length > 30)).toBe(
        true,
      );
    }
    expect(getProcessSteps("en")).toHaveLength(getProcessSteps("tr").length);
  });
  it("returns actionable validation in the selected language", () => {
    const form = {
      name: "",
      company: "",
      email: "bad",
      service: "",
      message: "short",
      startedAt: Date.now(),
      submissionId: crypto.randomUUID(),
    };
    const english = createContactSchema("en").safeParse(form);
    const turkish = createContactSchema("tr").safeParse(form);
    expect(english.success).toBe(false);
    expect(turkish.success).toBe(false);
    if (!english.success && !turkish.success) {
      expect(english.error.flatten().fieldErrors.name).toEqual([
        "Enter your full name.",
      ]);
      expect(turkish.error.flatten().fieldErrors.name).toEqual([
        "Adınızı ve soyadınızı yazın.",
      ]);
    }
  });
});
