import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("docs/previews/motion-audit");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const findings = {
  capturedAt: new Date().toISOString(),
  pages: [],
  interactions: {},
  scrollProfile: {},
};
const routes = [
  ["home", "/"],
  ["services", "/hizmetler"],
  ["work", "/calismalar"],
  ["about", "/hakkimda"],
  ["process", "/surec"],
  ["contact", "/iletisim"],
  ["project-commerce", "/calismalar/eleven-accessory"],
  ["project-diary", "/calismalar/nemora-diary"],
  ["project-analysis", "/calismalar/meta-analiz-paneli"],
  ["project-migration", "/calismalar/e-ticaret-migrasyonu"],
  ["project-workflow", "/calismalar/horoz-lojistik"],
  ["service-detail", "/hizmetler/backend-api-gelistirme"],
  ["home-en", "/en"],
  ["process-en", "/en/process"],
  ["contact-en", "/en/contact"],
];

try {
  for (const [device, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      isMobile: device === "mobile",
      hasTouch: device === "mobile",
      reducedMotion: "no-preference",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [name, route] of routes) {
      const response = await page.goto(`http://localhost:3200${route}`);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      const details = await page.evaluate(() => ({
        title: document.title,
        lang: document.documentElement.lang,
        coarsePointer: matchMedia("(pointer: coarse)").matches,
        height: document.documentElement.scrollHeight,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        headings: [...document.querySelectorAll("h1,h2,h3")].map((el) => ({
          tag: el.tagName,
          text: el.textContent.trim(),
          y: Math.round(el.getBoundingClientRect().top + scrollY),
        })),
        header: {
          position: getComputedStyle(document.querySelector("header")).position,
          height: document.querySelector("header").getBoundingClientRect()
            .height,
        },
        animationCount: document.getAnimations().length,
        diagrams: document.querySelectorAll(".project-visual svg").length,
        realProjectImages: document.querySelectorAll(".project-visual img")
          .length,
        mainTextCharacters: document.querySelector("main").textContent.length,
        loadedScripts: performance
          .getEntriesByType("resource")
          .filter((entry) => entry.initiatorType === "script")
          .map((entry) => ({
            name: new URL(entry.name).pathname,
            bytes: entry.encodedBodySize,
          })),
      }));
      findings.pages.push({
        name,
        route,
        device,
        width,
        height,
        status: response.status(),
        ...details,
      });
      if (
        [
          "home",
          "process",
          "work",
          "project-commerce",
          "project-migration",
          "contact",
          "home-en",
        ].includes(name)
      ) {
        await page.screenshot({
          path: path.join(output, `${name}-${device}.png`),
          fullPage: true,
        });
      }
      if (name === "home") {
        for (const [section, selector] of [
          ["services", ".services-section"],
          ["work", ".work-section"],
          ["founder", ".founder-band"],
          ["process", ".process-preview"],
        ]) {
          await page.locator(selector).scrollIntoViewIfNeeded();
          await page.screenshot({
            path: path.join(output, `home-${section}-${device}.png`),
          });
        }
        const secondService = page.locator(".service-row button").nth(1);
        await secondService.scrollIntoViewIfNeeded();
        const firstWorkY = await page
          .locator(".work-section")
          .evaluate((el) => el.getBoundingClientRect().top + scrollY);
        await secondService.click();
        const secondWorkY = await page
          .locator(".work-section")
          .evaluate((el) => el.getBoundingClientRect().top + scrollY);
        findings.interactions[`service-${device}`] = {
          expanded: await secondService.getAttribute("aria-expanded"),
          downstreamShift: secondWorkY - firstWorkY,
        };
        const card = page.locator(".project-card-link").first();
        await card.scrollIntoViewIfNeeded();
        const before = await card
          .locator("svg")
          .first()
          .evaluate((el) => getComputedStyle(el).transform);
        if (device === "desktop") await card.hover();
        const after = await card
          .locator("svg")
          .first()
          .evaluate((el) => getComputedStyle(el).transform);
        findings.interactions[`project-${device}`] = {
          interaction: device === "desktop" ? "hover" : "static touch view",
          before,
          after,
        };
      }
    }
    findings.pages.push({ name: `runtime-errors-${device}`, errors });
    await page.close();
  }

  for (const [device, width, height] of [
    ["small-mobile", 320, 844],
    ["tablet", 820, 1180],
    ["short-landscape", 900, 500],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      hasTouch: true,
      isMobile: true,
      reducedMotion: "reduce",
    });
    for (const [name, route] of routes.filter(([name]) =>
      [
        "home",
        "home-en",
        "process",
        "process-en",
        "contact",
        "project-migration",
      ].includes(name),
    )) {
      const response = await page.goto(`http://localhost:3200${route}`);
      await page.waitForLoadState("networkidle");
      findings.pages.push({
        name,
        route,
        device,
        width,
        height,
        status: response.status(),
        ...(await page.evaluate(() => ({
          height: document.documentElement.scrollHeight,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          lang: document.documentElement.lang,
          coarsePointer: matchMedia("(pointer: coarse)").matches,
        }))),
      });
      if (name === "home-en")
        await page.screenshot({
          path: path.join(output, `${name}-${device}.png`),
        });
    }
    await page.close();
  }

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  await page.goto("http://localhost:3200");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    window.__motionAudit = { longTasks: [], frames: [], shifts: [] };
    new PerformanceObserver((list) =>
      list
        .getEntries()
        .forEach((entry) =>
          window.__motionAudit.longTasks.push(entry.duration),
        ),
    ).observe({ type: "longtask", buffered: false });
    new PerformanceObserver((list) =>
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput)
          window.__motionAudit.shifts.push(entry.value);
      }),
    ).observe({ type: "layout-shift", buffered: false });
  });
  const before = (await cdp.send("Performance.getMetrics")).metrics;
  await cdp.send("Tracing.start", {
    categories: "devtools.timeline,blink.user_timing",
    transferMode: "ReturnAsStream",
  });
  const sample = await page.evaluate(async () => {
    const audit = window.__motionAudit;
    let previous = performance.now();
    let running = true;
    function frame(now) {
      audit.frames.push(now - previous);
      previous = now;
      if (running) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    const max = document.documentElement.scrollHeight - innerHeight;
    await new Promise((resolve) => {
      const start = performance.now();
      function step(now) {
        const progress = Math.min(1, (now - start) / 6000);
        scrollTo({ top: progress * max, behavior: "instant" });
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
    running = false;
    const sorted = audit.frames
      .filter((value) => value > 0)
      .sort((a, b) => a - b);
    return {
      durationMs: 6000,
      viewport: { width: innerWidth, height: innerHeight },
      scrollDistance: max,
      frames: sorted.length,
      p50FrameMs: sorted[Math.floor(sorted.length * 0.5)],
      p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
      framesOver32Ms: sorted.filter((value) => value > 32).length,
      longTasks: audit.longTasks,
      cls: audit.shifts.reduce((sum, value) => sum + value, 0),
    };
  });
  const traceFinished = new Promise((resolve) =>
    cdp.once("Tracing.tracingComplete", resolve),
  );
  await cdp.send("Tracing.end");
  const { stream } = await traceFinished;
  let trace = "";
  while (true) {
    const chunk = await cdp.send("IO.read", { handle: stream });
    trace += chunk.data;
    if (chunk.eof) break;
  }
  await cdp.send("IO.close", { handle: stream });
  await writeFile(path.join(output, "desktop-scroll-trace.json"), trace);
  const after = (await cdp.send("Performance.getMetrics")).metrics;
  const names = [
    "LayoutCount",
    "RecalcStyleCount",
    "LayoutDuration",
    "RecalcStyleDuration",
    "ScriptDuration",
    "TaskDuration",
  ];
  findings.scrollProfile = {
    ...sample,
    conditions:
      "Headless installed Chrome, desktop 1440×1000, localhost production, no CPU/network throttling. Diagnostic only, not a mobile performance score.",
    cdpDelta: Object.fromEntries(
      names.map((name) => [
        name,
        (after.find((item) => item.name === name)?.value || 0) -
          (before.find((item) => item.name === name)?.value || 0),
      ]),
    ),
  };
  await page.close();
  await writeFile(
    path.join(output, "findings.json"),
    JSON.stringify(findings, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        output,
        pages: findings.pages.filter((page) => page.status).length,
        overflow: findings.pages
          .filter((page) => page.overflow)
          .map((page) => page.route),
        runtimeErrors: findings.pages.filter((page) => page.errors?.length),
        interactions: findings.interactions,
        scrollProfile: findings.scrollProfile,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
