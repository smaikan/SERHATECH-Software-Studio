import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("docs/previews");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [name, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
    await page.goto("http://localhost:3200");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(output, `${name}.png`) });
    await page.screenshot({ path: path.join(output, `${name}-full.png`), fullPage: true });
    await page.close();
  }
} finally { await browser.close(); }
console.log(output);
