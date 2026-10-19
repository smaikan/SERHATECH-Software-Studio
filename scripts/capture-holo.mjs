// Holo Atölye sahnelerini (masaüstü 1440 ve mobil 390) çalışan bir production
// sunucusundan çekiyor: node scripts/capture-holo.mjs [baseUrl]
import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] || "http://localhost:3100";
const out = "docs/previews/holo-atolye";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

const scenes = [
  ["hero", null],
  ["journey", ".journey-track"],
  ["services", "[data-bay='services'] .bay-card:nth-child(3)"],
  ["approach", ".approach"],
  ["work", "[data-bay='work'] .bay-card:nth-child(1)"],
  ["founder", ".founder"],
  ["contact", ".contact-callout"],
];

for (const [label, context] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["mobile", (({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch }) => ({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch }))(devices["Pixel 7"])],
]) {
  const page = await (await browser.newContext(context)).newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.classList.contains("lab-on"), null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2600);
  for (const [name, target] of scenes) {
    await page.evaluate((t) => {
      if (t === null) return scrollTo(0, 0);
      if (typeof t === "number") return scrollTo(0, t);
      const el = document.querySelector(t);
      const r = el.getBoundingClientRect();
      const card = t.includes("bay-card");
      scrollTo(0, r.top + scrollY + (card ? r.height / 2 - innerHeight * (innerWidth < 900 ? 0.72 : 0.58) : -70));
    }, typeof target === "function" ? target(context.viewport.height) : target);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${out}/${label}-${name}.png` });
  }
  await page.context().close();
}
await browser.close();
console.log(`saved to ${out}`);
