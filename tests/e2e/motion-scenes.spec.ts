import { test, expect } from "@playwright/test";

// anlam taşıyan (süs olmayan) kaydırma durumları dom'a yansımalı.

test("services and work cards activate in reading order on desktop", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  for (const [bay, count] of [
    ["services", 6],
    ["work", 3],
  ] as const) {
    const cards = page.locator(`[data-bay='${bay}'] .bay-card`);
    await expect(cards).toHaveCount(count);
    for (let i = 0; i < count; i++) {
      await cards.nth(i).evaluate((el) =>
        window.scrollTo(0, el.getBoundingClientRect().top + scrollY + el.getBoundingClientRect().height / 2 - innerHeight * 0.58),
      );
      await expect(cards.nth(i)).toHaveClass(/is-active/);
    }
  }
});

test("problem rows draw their link and the journey line reaches every stop", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const track = page.locator("[data-journey] .journey-track");
  await expect(track).toHaveClass(/journey-armed/);
  await expect(page.locator(".journey-stop.is-on")).toHaveCount(0);
  await track.evaluate((el) =>
    window.scrollTo(0, el.getBoundingClientRect().bottom + scrollY - innerHeight * 0.5),
  );
  await expect(page.locator(".journey-stop.is-on")).toHaveCount(4);
  await page.locator(".problem-list").scrollIntoViewIfNeeded();
  await expect(page.locator(".problem-row.is-in").first()).toBeVisible();
});

test("reduced motion shows the journey fully drawn", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".journey-stop.is-on")).toHaveCount(4);
  await expect(page.locator("[data-journey] .journey-track")).not.toHaveClass(/journey-armed/);
});

test("the WebGL director labels the active module", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => document.documentElement.classList.contains("lab-on"));
  const card = page.locator("#modul-e-ticaret-sistemleri");
  await card.evaluate((el) =>
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY + el.getBoundingClientRect().height / 2 - innerHeight * 0.58),
  );
  await expect
    .poll(async () =>
      page.locator(".hud-label").evaluateAll((labels) =>
        labels
          .filter((l) => Number((l as HTMLElement).style.opacity) > 0.6)
          .map((l) => l.querySelector("[data-title]")?.textContent),
      ),
    )
    .toEqual(["E-ticaret"]);
});

test("a case study highlights the nodes the paragraph talks about", async ({ page }) => {
  await page.goto("/calismalar/eleven-accessory");
  await expect(page.locator("[data-focus-diagram] [data-node]")).toHaveCount(5);
  await page.getByRole("heading", { name: "Ele alınan zorluk" }).evaluate((el) =>
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.4),
  );
  await expect(page.locator("[data-focus-diagram] [data-node='db']")).toHaveClass(/is-focus/);
  await expect(page.locator("[data-focus-diagram] [data-node='store']")).not.toHaveClass(/is-focus/);
});
