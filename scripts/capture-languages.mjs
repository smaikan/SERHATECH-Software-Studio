import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("docs/previews/i18n");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [device, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
    ["small-mobile", 320, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    for (const [name, url] of [
      ["home-tr", "/"],
      ["home-en", "/en"],
      ["contact-en", "/en/contact"],
      ["service-en", "/en/services/custom-web-applications"],
    ]) {
      await page.goto(`http://localhost:3200${url}`);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.join(output, `${name}-${device}.png`),
      });
      if (device === "mobile")
        await page.screenshot({
          path: path.join(output, `${name}-${device}-full.png`),
          fullPage: true,
        });
    }
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(output);
