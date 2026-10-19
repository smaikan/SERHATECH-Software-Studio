import { describe, expect, it } from "vitest";
import { seoPolicy } from "../../src/config/seo-policy";

describe("publication SEO policy", () => {
  it.each([
    undefined,
    "",
    "invalid-url",
    "http://localhost:3200",
    "https://localhost",
    "https://localhost.",
    "https://127.0.0.1",
    "https://192.168.1.4",
    "https://studio.local",
    "https://preview.localhost",
    "file:///site",
  ])("keeps local and invalid origins closed: %s", (value) => {
    expect(seoPolicy(value, true).indexable).toBe(false);
  });
  it("requires an explicit publication flag", () => {
    expect(seoPolicy("https://studio.example.com", false).indexable).toBe(
      false,
    );
  });
  it("requires HTTPS for public indexing", () => {
    expect(seoPolicy("http://studio.example.com", true).indexable).toBe(false);
  });
  it("rejects credentials in the public indexing URL", () => {
    expect(
      seoPolicy("https://user:pass@studio.example.com", true).indexable,
    ).toBe(false);
  });
  it("creates canonical origin without paths or tracking parameters", () => {
    expect(
      seoPolicy("https://studio.example.com/path?utm_source=test", true),
    ).toEqual({ origin: "https://studio.example.com", indexable: true });
  });
});
