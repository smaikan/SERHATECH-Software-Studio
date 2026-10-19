import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const origin = `http://localhost:${process.env.PW_PORT || "3100"}`;

const serviceSlugs = [
  "ozel-web-uygulamalari",
  "backend-api-gelistirme",
  "e-ticaret-sistemleri",
  "is-sureci-otomasyonu",
  "sistem-ve-altyapi",
  "yapay-zeka-entegrasyonlari",
];
const projectSlugs = [
  "eleven-accessory",
  "nemora-diary",
  "meta-analiz-paneli",
];
const routes = [
  "/",
  "/hizmetler",
  "/calismalar",
  "/hakkimda",
  "/surec",
  "/iletisim",
  "/gizlilik",
  "/kvkk",
  ...serviceSlugs.map((slug) => `/hizmetler/${slug}`),
  ...projectSlugs.map((slug) => `/calismalar/${slug}`),
];

test("all pages render and expose meaningful metadata", async ({ page }) => {
  test.setTimeout(120000); // türkçe route'ların hepsini sırayla geziyor
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
    expect(await page.title()).not.toContain("Create Next App");
  }
  expect(errors).toEqual([]);
});

for (const width of [320, 360, 390, 640, 768, 820, 1024, 1440, 1920]) {
  test(`responsive layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    for (const route of [
      "/",
      "/hizmetler",
      "/calismalar",
      "/hakkimda",
      "/surec",
      "/iletisim",
      "/calismalar/eleven-accessory",
      "/hizmetler/backend-api-gelistirme",
    ]) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      ).toBe(true);
      await expect(page.locator("h1")).toBeVisible();
    }
    await page.goto("/");
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
  });
}

test("mobile menu traps focus, closes with Escape and navigates", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const open = page.getByRole("button", { name: "Menüyü aç" });
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Ana menü" });
  await expect(dialog).toBeVisible();
  for (let n = 0; n < 10; n++) await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() =>
      document.querySelector("dialog")?.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(open).toBeFocused();
  await open.click();
  await dialog.getByRole("link", { name: "Hizmetler", exact: true }).click();
  await expect(page).toHaveURL(/\/hizmetler$/);
  await expect(dialog).not.toBeVisible();
});

test("service rail jumps to a module card and marks it active", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const link = page.locator("[data-bay='services'] [data-rail-index='1']");
  await link.focus();
  await page.keyboard.press("Enter");
  const card = page.locator("#modul-backend-api-gelistirme");
  await expect(card).toBeInViewport();
  await expect(card).toHaveClass(/is-active/);
  await expect(link).toHaveAttribute("aria-current", "true");
  await expect(card.getByRole("link", { name: "Hizmeti incele" })).toHaveAttribute(
    "href",
    "/hizmetler/backend-api-gelistirme",
  );
});

test("email remains the direct contact channel and can be copied", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/iletisim");
  await expect(
    page.locator("a[href^='tel:'], a[href*='linkedin.com']"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("form", { name: "Proje talep formu" }),
  ).toBeVisible();
  const links = await page.locator('a[href^="mailto:"]').all();
  expect(links.length).toBeGreaterThan(0);
  for (const link of links)
    expect(await link.getAttribute("href")).toMatch(
      /^mailto:iletisim@serha\.tech(?:\?|$)/,
    );
  await page.getByRole("button", { name: "Adresi kopyala" }).click();
  await expect(page.getByRole("status")).toContainText("panoya kopyalandı");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "iletisim@serha.tech",
  );
});

test("service selection is preserved in the email subject", async ({
  page,
}) => {
  await page.goto("/hizmetler/backend-api-gelistirme");
  await page.getByRole("link", { name: "Bu ihtiyacı konuşalım" }).click();
  await expect(page).toHaveURL(/hizmet=backend-api-gelistirme/);
  await expect(page.getByLabel("Ne konuda yardım istiyorsunuz?")).toHaveValue(
    "Sistem entegrasyonları",
  );
  await expect(
    page.getByRole("link", { name: "E-posta yaz", exact: true }),
  ).toHaveAttribute(
    "href",
    `mailto:iletisim@serha.tech?subject=${encodeURIComponent("Sistem entegrasyonları hakkında")}`,
  );
});

test("form validates fields and preserves input when delivery fails", async ({
  page,
}) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Mesajınız gönderilmedi. Daha sonra yeniden deneyin.",
      }),
    }),
  );
  await page.goto("/iletisim");
  const form = page.getByRole("form", { name: "Proje talep formu" });
  await form.getByRole("button", { name: "Talebi gönder" }).click();
  await expect(page.getByLabel("Ad soyad", { exact: true })).toBeFocused();
  await expect(form.getByText("Adınızı ve soyadınızı yazın.")).toBeVisible();
  await page.getByLabel("Ad soyad", { exact: true }).fill("Test Kullanıcısı");
  await page.getByLabel("E-posta adresi", { exact: true }).fill("invalid");
  await form.getByRole("button", { name: "Talebi gönder" }).click();
  await expect(
    form.getByText("E-posta adresini ad@sirket.com biçiminde yazın."),
  ).toBeVisible();
  await page
    .getByLabel("E-posta adresi", { exact: true })
    .fill("visitor@example.com");
  await page
    .getByLabel("Ne konuda yardım istiyorsunuz?")
    .fill("Sipariş yönetim paneli");
  await page
    .getByLabel("Projenizi kısaca anlatın")
    .fill("İşletmem için bir sipariş yönetim paneli istiyorum.");
  await form.getByRole("button", { name: "Talebi gönder" }).click();
  await expect(form.getByRole("alert")).toContainText("gönderilmedi");
  await expect(page.getByLabel("Ad soyad", { exact: true })).toHaveValue(
    "Test Kullanıcısı",
  );
  await expect(page.getByLabel("Projenizi kısaca anlatın")).not.toBeEmpty();
});

test("form sends once, includes all fields and resets after acceptance", async ({
  page,
}) => {
  let count = 0;
  let received: Record<string, unknown> = {};
  let accept!: () => void;
  const release = new Promise<void>((resolve) => {
    accept = resolve;
  });
  await page.route("**/api/contact", async (route) => {
    count++;
    received = route.request().postDataJSON();
    await release;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Mesajınız alındı." }),
    });
  });
  await page.goto("/iletisim?hizmet=backend-api-gelistirme");
  const form = page.getByRole("form", { name: "Proje talep formu" });
  await page.getByLabel("Ad soyad", { exact: true }).fill("Test Kullanıcısı");
  await page.getByLabel("Şirket / marka").fill("Test Marka");
  await page
    .getByLabel("E-posta adresi", { exact: true })
    .fill("visitor@example.com");
  await page
    .getByLabel("Projenizi kısaca anlatın")
    .fill("Mevcut uygulamam için güvenli bir API geliştirmek istiyorum.");
  const callback = page.getByLabel("Beni telefonla arayın");
  await expect(callback).toBeDisabled();
  await page.locator("#phone").fill("0532 123 45 67");
  await expect(callback).toBeEnabled();
  await callback.check();
  await page.getByLabel("1–3 ay içinde").check();
  await form.getByRole("button", { name: "Talebi gönder" }).click();
  await expect(
    form.getByRole("button", { name: "Gönderiliyor…" }),
  ).toBeDisabled();
  await expect.poll(() => count).toBe(1);
  expect(received).toMatchObject({
    name: "Test Kullanıcısı",
    company: "Test Marka",
    email: "visitor@example.com",
    service: "Sistem entegrasyonları",
    phone: "+90 532 123 45 67",
    callback: true,
    timeline: "1-3-ay",
  });
  expect(received.message).toContain("güvenli bir API");
  expect(received.submissionId).toMatch(/^[\da-f-]{36}$/);
  accept();
  await expect(form.getByRole("status")).toContainText("alındı");
  await expect(page.getByLabel("Ad soyad", { exact: true })).toBeEmpty();
  await expect(page.getByLabel("Projenizi kısaca anlatın")).toBeEmpty();
  await expect(page.locator("#phone")).toBeEmpty();
  await expect(callback).toBeDisabled();
  expect(count).toBe(1);
});

test("copying works without the Clipboard API and falls back to a selectable address", async ({
  page,
}) => {
  // telefondan yerel ağ üzerinden dev sunucuya girilmiş gibi (güvensiz bağlam): clipboard
  // api yok, crypto.randomUUID yok.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    Object.defineProperty(crypto, "randomUUID", { configurable: true, value: undefined });
  });
  await page.goto("/iletisim");
  const button = page.getByRole("button", { name: "Adresi kopyala" });
  await expect(button).toContainText("iletisim@serha.tech");
  await button.click();
  await expect(page.getByRole("status")).toContainText("panoya kopyalandı");
  await expect(button).toContainText("Kopyalandı");
  // seçerek kopyalama da reddedilirse adres seçilmeye hazır şekilde gösteriliyor.
  await page.evaluate(() => {
    document.execCommand = () => false;
  });
  await button.click();
  await expect(page.getByRole("status")).toContainText("seçerek kopyalayabilirsiniz");
  await expect(page.locator(".email-select")).toHaveText(/iletisim@serha\.tech/);
  // form yine çalışıyor: gönderim id'si getRandomValues'dan geliyor.
  await expect(page.getByRole("form", { name: "Proje talep formu" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "E-posta yaz", exact: true }),
  ).toBeVisible();
});

test("reduced motion keeps every scene as a static drawing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  await expect(page.locator(".lab-canvas")).toHaveCount(0);
  await expect(page.locator(".hero-stage .core-poster")).toBeVisible();
  await expect(page.locator("[data-bay='services'] .bay-card")).toHaveCount(6);
  await expect(page.locator("[data-bay='work'] .bay-card")).toHaveCount(3);
  await page.locator("[data-bay='services'] .bay-cards").scrollIntoViewIfNeeded();
  await expect(page.locator("[data-bay='services'] .stage-glyph.is-active")).toHaveCount(1);
});

test("the scene mounts one canvas and the motion switch releases it", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => document.documentElement.classList.contains("lab-on"));
  await expect(page.locator(".lab-canvas")).toHaveCount(1);
  const toggle = page.getByRole("button", { name: "Hareketi azalt" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".lab-canvas")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/lab-on/);
  await toggle.click();
  await expect(page.locator(".lab-canvas")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".lab-canvas")).toHaveCount(1);
});

test("the home page works without WebGL", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith("webgl")) return null;
      return original.call(this, type as "2d", ...(rest as []));
    } as typeof original;
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  await expect(page.locator(".lab-canvas")).toHaveCount(0);
  await expect(page.locator(".hero-stage .core-poster")).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});

test("mobile scene loads without route prefetching", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const prefetched: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("_rsc=")) prefetched.push(request.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".lab-canvas")).toHaveCount(1);
  expect(prefetched).toEqual([]);
});

test("the mobile menu prefetches its pages, so a tap needs no round trip", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const finished = new Set<string>();
  const afterTap: string[] = [];
  let tapped = false;
  page.on("request", (request) => {
    if (tapped && request.url().includes("_rsc=")) afterTap.push(new URL(request.url()).pathname);
  });
  page.on("requestfinished", (request) => {
    if (request.url().includes("_rsc=")) finished.add(new URL(request.url()).pathname);
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect([...finished]).toEqual([]);
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  const pages = ["/hizmetler", "/calismalar", "/hakkimda", "/surec", "/iletisim"];
  await expect.poll(() => pages.filter((path) => !finished.has(path))).toEqual([]);
  tapped = true;
  await page.getByRole("dialog").getByRole("link", { name: "Hizmetler" }).click();
  await expect(page).toHaveURL(/\/hizmetler$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(afterTap.filter((path) => path === "/hizmetler")).toEqual([]);
});

test("the home page speaks to customers: no technology chips, no removed projects", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator("main .stack")).toHaveCount(0);
  await expect(page.locator(".scroll-cue")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("ASP.NET");
  await expect(page.locator("main")).not.toContainText("Horoz");
  for (const path of ["/calismalar/horoz-lojistik", "/calismalar/e-ticaret-migrasyonu"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  await page.goto("/hizmetler/backend-api-gelistirme");
  await expect(page.getByRole("heading", { name: "Kullanılan teknolojiler" })).toBeVisible();
});

test("call back requires a phone number before it can be chosen", async ({ page }) => {
  await page.goto("/iletisim");
  const phone = page.locator("#phone");
  const callback = page.getByLabel("Beni telefonla arayın");
  await expect(callback).toBeDisabled();
  await phone.fill("0532 12");
  await callback.check();
  await page.getByLabel("Ad soyad", { exact: true }).fill("Test Kullanıcısı");
  await page.getByLabel("E-posta adresi", { exact: true }).fill("visitor@example.com");
  await page.getByLabel("Ne konuda yardım istiyorsunuz?").fill("Sipariş yönetim paneli");
  await page.getByLabel("Projenizi kısaca anlatın").fill("İşletmem için bir sipariş paneli istiyorum.");
  await page.getByRole("button", { name: "Talebi gönder" }).click();
  await expect(page.locator("#phone-error")).toContainText("eksik");
  await expect(phone).toBeFocused();
});

test("phone and email follow their formats while typing", async ({ page }) => {
  await page.goto("/iletisim");
  const phone = page.locator("#phone");
  const country = page.locator("#phone-country");
  await expect(country).toHaveValue("TR");
  await phone.pressSequentially("05x32(1234567");
  await expect(phone).toHaveValue("0532 123 45 67");
  // türk numaralarında olandan fazla hane yok, başında 0 olsa da olmasa da.
  await phone.pressSequentially("8999");
  await expect(phone).toHaveValue("0532 123 45 67");
  await phone.fill("");
  await phone.pressSequentially("5321234567999");
  await expect(phone).toHaveValue("532 123 45 67");
  // yapıştırılan uluslararası numara ülkeyi kendisi seçiyor.
  await phone.fill("+49 30 1234567");
  await expect(country).toHaveValue("DE");
  await expect(phone).toHaveValue(/^30 ?1234567$/);
  await country.selectOption("US");
  await phone.fill("202555012399");
  await expect(phone).toHaveValue("(202) 555-0123");
  await country.selectOption("TR");
  // 123'ten önceki boşluğu silmek boşluğu değil ondan önceki 2'yi siliyor.
  await phone.fill("0532 123 45 67");
  await phone.evaluate((el: HTMLInputElement) => el.setSelectionRange(5, 5));
  await phone.press("Backspace");
  await expect(phone).toHaveValue("0531 234 56 7");

  await phone.fill("0532 123");
  await phone.blur();
  await expect(page.locator("#phone-error")).toBeVisible();
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await phone.pressSequentially("4567");
  await expect(page.locator("#phone-error")).toHaveCount(0);

  const email = page.getByLabel("E-posta adresi", { exact: true });
  await email.pressSequentially("ad soyad@sirket");
  await expect(email).toHaveValue("adsoyad@sirket");
  await email.blur();
  await expect(page.locator("#email-error")).toContainText("ad@sirket.com");
  await email.pressSequentially(".com");
  await expect(page.locator("#email-error")).toHaveCount(0);
  await expect(email).toHaveAttribute("aria-invalid", "false");
});

test("first content is readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(`${origin}/`);
  await expect(page.locator("h1")).toContainText("Fikrinizden");
  await expect(
    page
      .getByRole("link", { name: "Projenizi konuşalım", exact: true })
      .first(),
  ).toBeVisible();
  await context.close();
});

test("mobile reflow supports increased text spacing and touch targets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const route of [
    "/",
    "/iletisim",
    "/calismalar",
    "/hakkimda",
    "/hizmetler/backend-api-gelistirme",
  ]) {
    await page.goto(route);
    await page.addStyleTag({
      content:
        "h1,h2,h3,p,a,button,label {letter-spacing:.12em!important;word-spacing:.16em!important;line-height:1.5!important;}",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
  }
  await page.goto("/");
  for (const button of await page
    .locator(".hero-actions a, .menu-toggle")
    .all()) {
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
});

test("service and project breadcrumbs describe the current page", async ({
  page,
}) => {
  for (const route of [
    "/hizmetler/backend-api-gelistirme",
    "/calismalar/eleven-accessory",
  ]) {
    await page.goto(route);
    const breadcrumb = page.getByRole("navigation", { name: "Sayfa yolu" });
    await expect(
      breadcrumb.getByRole("link", { name: "Ana sayfa" }),
    ).toHaveAttribute("href", "/");
    await expect(breadcrumb.locator('[aria-current="page"]')).toBeVisible();
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /opengraph-image/,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  }
});

for (const route of [
  "/",
  "/hizmetler",
  "/calismalar",
  "/hakkimda",
  "/surec",
  "/iletisim",
  "/calismalar/eleven-accessory",
  "/hizmetler/backend-api-gelistirme",
  "/kvkk",
]) {
  test(`accessibility ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      // yazı logosundaki turuncu "TECH" marka adının parçası, WCAG 1.4.3 bunu kontrast
      // şartından muaf tutuyor.
      .exclude(".brand-name-accent")
      .analyze();
    expect(audit.violations).toEqual([]);
  });
}

test("API guards, real 404 and SEO endpoints", async ({ page, request }) => {
  expect(
    (
      await request.post("/api/contact", {
        data: {},
        headers: { Origin: origin },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/contact", {
        data: {},
        headers: { Origin: "https://evil.example" },
      })
    ).status(),
  ).toBe(403);
  expect((await page.goto("/sayfa-yok"))?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Bu sayfa yok." }),
  ).toBeVisible();
  for (const path of [
    "/hizmetler/olmayan-hizmet",
    "/calismalar/olmayan-proje",
  ]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /");
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  expect((await request.get("/opengraph-image")).status()).toBe(200);
});

