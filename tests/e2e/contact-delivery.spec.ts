import { expect, test } from "@playwright/test";

for (const locale of ["tr", "en"] as const) {
  for (const mobile of [false, true]) {
    test(`${locale} ${mobile ? "mobile" : "desktop"}: form uncertain delivery preserves content and retry identity`, async ({ page }) => {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
      const payloads: Record<string, unknown>[] = [];
      await page.route("**/api/contact", async (route) => {
        payloads.push(route.request().postDataJSON());
        if (payloads.length === 1) return route.abort("timedout");
        await route.fulfill({
          status: payloads.length === 3 ? 200 : 503,
          contentType: "application/json",
          body: JSON.stringify({ message: payloads.length === 3 ? "Accepted" : "Unconfirmed" }),
        });
      });
      await page.goto(locale === "tr" ? "/iletisim" : "/en/contact");
      await page.locator("#name").fill("Test Visitor");
      await page.locator("#email").fill("visitor@example.com");
      await page.locator("#service").fill("Order management");
      const original = "I need a web application to track orders and inventory.";
      await page.locator("#message").fill(original);
      const submit = page.getByRole("button", { name: locale === "tr" ? "Talebi gönder" : "Send request" });
      await submit.click();
      await expect(page.locator(".form-status[role=alert]")).toContainText(locale === "tr" ? "doğrulanamadı" : "Couldn’t confirm");
      await expect(page.locator("#message")).toHaveValue(original);
      await submit.click();
      await expect(page.locator(".form-status[role=alert]")).toHaveText("Unconfirmed");
      expect(payloads).toHaveLength(2);
      expect(payloads[0].submissionId).toBe(payloads[1].submissionId);
      await page.locator("#message").fill(`${original} With a mobile dashboard.`);
      await submit.click();
      await expect(page.locator(".form-status[role=status]")).toHaveText("Accepted");
      expect(payloads).toHaveLength(3);
      expect(payloads[2].submissionId).not.toBe(payloads[1].submissionId);
      await expect(page.locator("#message")).toBeEmpty();
    });
  }
}
