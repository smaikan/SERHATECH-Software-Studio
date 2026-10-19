import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { allRoutes, pathFor } from "../../src/i18n/routing";

test("every English page renders localized content and stays in English", async ({
  page,
}) => {
  test.setTimeout(120000); // ingilizce route'ların hepsini sırayla geziyor
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of allRoutes()) {
    const url = pathFor("en", route.page, route.slug);
    expect((await page.goto(url))?.status(), url).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      "en_US",
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.{30,}/,
    );
    const links = await page
      .locator('main a[href^="/"], footer a[href^="/"]')
      .evaluateAll((elements) => elements.map((el) => el.getAttribute("href")));
    expect(
      links.every((href) => href?.startsWith("/en")),
      url,
    ).toBe(true);
    expect(
      await page.locator('meta[name="robots"]').getAttribute("content"),
    ).toContain("noindex");
    expect(await page.locator("main").innerText(), url).not.toMatch(
      /Hizmetler|İhtiyaç|Çalışmalar|İsteğe bağlı|Mimari gösterim|İletişim/,
    );
  }
  expect(errors).toEqual([]);
});

test("language switching keeps the page, service query and anchor", async ({
  page,
}) => {
  await page.goto("/calismalar/meta-analiz-paneli");
  await page.getByRole("link", { name: "Switch to English" }).click();
  await expect(page).toHaveURL(/\/en\/work\/meta-analysis-dashboard$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: "Türkçeye geç" }).click();
  await expect(page).toHaveURL(/\/calismalar\/meta-analiz-paneli$/);
  await page.goto("/iletisim?hizmet=backend-api-gelistirme#inquiry-title");
  await page.getByRole("link", { name: "Switch to English" }).click();
  await expect(page).toHaveURL(
    /\/en\/contact\?service=backend-api-gelistirme#inquiry-title$/,
  );
  await expect(page.locator("#service")).toHaveValue("System integrations");
});

test("English form validates, sends its locale and preserves fields on failure", async ({
  page,
}) => {
  await page.goto("/en/contact");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.locator("#name-error")).toHaveText("Enter your full name.");
  await expect(page.locator("#name")).toBeFocused();
  await page.locator("#name").fill("English Visitor");
  await page.locator("#email").fill("visitor@example.com");
  await page.locator("#service").fill("A custom web application");
  await page
    .locator("#message")
    .fill("I need a web application to track orders and inventory.");
  await page.waitForTimeout(2600);
  const responsePromise = page.waitForResponse("**/api/contact");
  await page.getByRole("button", { name: "Send request" }).click();
  const response = await responsePromise;
  expect(response.request().headers()["accept-language"]).toBe("en");
  expect(response.status()).toBe(503);
  await expect(page.locator(".form-status[role=alert]")).toContainText(
    "Your message was not sent",
  );
  await expect(page.locator("#message")).toHaveValue(
    "I need a web application to track orders and inventory.",
  );
  await expect(
    page.locator('.form-foot a[href="/en/data-protection"]'),
  ).toBeVisible();
});

test("English mobile navigation, language control and dialog keyboard behavior", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/en");
  await expect(page.getByRole("link", { name: "Türkçeye geç" })).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Services" })
    .click();
  // tıklamanın kendisi hızlı (yeni URL'ye yaklaşık 60 ms), ama playwright önce menü
  // satırlarının durmasını bekliyor (≈ 0.6 sn, tekrar deneme aralığıyla ≈ 1 sn). bütün
  // testler paralel çalışınca bu beş saniyeyi geçebiliyor.
  await expect(page).toHaveURL(/\/en\/services$/, { timeout: 20000 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`English responsive layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    for (const url of [
      "/en",
      "/en/contact",
      "/en/services",
      "/en/work",
      "/en/about",
      "/en/process",
      "/en/services/backend-api-development",
      "/en/work/meta-analysis-dashboard",
    ]) {
      await page.goto(url);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      expect(overflow, url).toBe(false);
    }
  });
}

for (const url of [
  "/en",
  "/en/contact",
  "/en/services/custom-web-applications",
  "/en/work/meta-analysis-dashboard",
]) {
  test(`English accessibility ${url}`, async ({ page }) => {
    await page.goto(url);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      // yazı logosundaki turuncu "TECH" marka adının parçası, WCAG 1.4.3 bunu kontrast
      // şartından muaf tutuyor.
      .exclude(".brand-name-accent")
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test("localized missing pages return 404 and the internal Turkish prefix redirects", async ({
  page,
}) => {
  for (const url of [
    "/en/missing-page",
    "/en/services/unknown",
    "/en/hizmetler",
  ]) {
    expect((await page.goto(url))?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Page not found." }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  }
  await page.goto("/tr/hizmetler?ref=test");
  await expect(page).toHaveURL(/\/hizmetler\?ref=test$/);
});
