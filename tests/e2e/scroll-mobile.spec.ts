import { test, expect, devices, type Page } from "@playwright/test";

// ana sayfanın mobil kaydırma kuralları: normal kaydırma (geri zıplama yok, kaydırmayı
// ele geçirme yok), yerinde duran sticky sahneler, sırayla aktif olan kartlar, sert bir
// fırlatmadan sonra oturan bir durum ve mobil araç çubuğu viewport yüksekliğini
// değiştirince layout zıplamaması.

const isWebkit = (page: Page) => page.context().browser()?.browserType().name() === "webkit";

async function installSampler(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as {
      __samples: { y: number; t: number; stageTop: number | null; active: number; concealed: boolean }[];
      __longTasks: number[];
      __frames: number[];
      __stop: boolean;
    };
    w.__samples = [];
    w.__longTasks = [];
    w.__frames = [];
    w.__stop = false;
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) w.__longTasks.push(entry.duration);
      }).observe({ type: "longtask" });
    } catch {}
    let last = performance.now();
    const loop = (now: number) => {
      if (w.__stop) return;
      w.__frames.push(now - last);
      last = now;
      const stage = document.querySelector<HTMLElement>("[data-bay='services'] .bay-stage");
      const cards = Array.from(
        document.querySelectorAll<HTMLElement>("[data-bay='services'] .bay-card"),
      );
      w.__samples.push({
        y: window.scrollY,
        t: now,
        stageTop: stage ? stage.getBoundingClientRect().top : null,
        active: cards.findIndex((card) => card.classList.contains("is-active")),
        concealed: document.querySelector(".site-header")?.hasAttribute("data-concealed") ?? false,
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}

// parmakla kaydırma: ham dokunma olayları, parmak hala hareket ederken bırakılıyor ki
// tarayıcı kendi momentumuyla devam etsin. olaylar gerçek dokunmatik donanımdaki gibi
// kendi zaman damgalarını taşıyor. yoksa cdp onları geldikleri an damgalıyor ve meşgul
// bir kare bırakma hızını sıfır gösteriyor. (cdp'nin yapay "touch" hareketi headless
// chrome'da hiç kaydırmıyor, o yüzden kullanmıyoruz.)
async function fling(page: Page, distance: number, duration = 140) {
  if (isWebkit(page)) {
    // playwright'ta webkit için dokunarak sürükleme yok, küçük tekerlek adımlarıyla kaydır.
    const steps = Math.ceil(Math.abs(distance) / 120);
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, Math.sign(distance) * 120);
      await page.waitForTimeout(16);
    }
    return;
  }
  const cdp = await page.context().newCDPSession(page);
  const size = page.viewportSize()!;
  const x = Math.round(size.width / 2);
  const start = Math.round(size.height * 0.8);
  const span = Math.min(Math.abs(distance), size.height * 0.6) * Math.sign(distance);
  const steps = 12;
  const step = duration / steps / 1000;
  let timestamp = Date.now() / 1000;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: start }], timestamp });
  for (let i = 1; i <= steps; i++) {
    timestamp += step;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: Math.round(start - (span * i) / steps) }],
      timestamp,
    });
    await page.waitForTimeout(duration / steps);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [], timestamp: timestamp + step });
  await cdp.detach();
}

async function readSamples(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as {
      __samples: { y: number; t: number; stageTop: number | null; active: number; concealed: boolean }[];
      __longTasks: number[];
      __frames: number[];
      __stop: boolean;
    };
    w.__stop = true;
    return { samples: w.__samples, longTasks: w.__longTasks, frames: w.__frames };
  });
}

function p95(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)] ?? 0;
}

for (const device of ["Pixel 7", "iPhone 14"] as const) {
  test.describe(`mobile scroll on ${device}`, () => {
    test.describe.configure({ mode: "serial" });
    // tarayıcı projeden geliyor, burada sadece cihaz ölçüleri uygulanıyor.
    const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices[device];
    test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });
    test.skip(
      ({ browserName }) => (device === "Pixel 7") !== (browserName === "chromium"),
      "Pixel runs on Chromium, iPhone on WebKit",
    );

    test("touch flings scroll natively through every scene", async ({ page }) => {
      test.setTimeout(120000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      // webgl katmanına başlaması için fırsat ver, sayfa her iki durumda da çalışmalı.
      await page
        .waitForFunction(() => document.documentElement.classList.contains("lab-on"), null, {
          timeout: 8000,
        })
        .catch(() => {});
      const header = await page.locator(".site-header").evaluate((el) => el.getBoundingClientRect().height);
      await installSampler(page);

      const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      if (!isWebkit(page)) {
        // bırakınca kaydırma tarayıcının kendi momentumuna geçmeli, aniden durmamalı.
        await fling(page, 450);
        const released = await page.evaluate(() => scrollY);
        await page.waitForTimeout(1200);
        const coasted = await page.evaluate(() => scrollY);
        expect(coasted - released, "fling momentum was cancelled").toBeGreaterThan(40);
      }
      let guard = 0;
      while ((await page.evaluate(() => scrollY)) < total - 4 && guard++ < 40) {
        await fling(page, 900);
        await page.waitForTimeout(450);
      }
      await page.waitForTimeout(600);
      const { samples, longTasks, frames } = await readSamples(page);

      // 1. parmak ileri giderken asla geri fırlatılmıyor.
      let backwards = 0;
      for (let i = 1; i < samples.length; i++) {
        if (samples[i].y < samples[i - 1].y - 2) backwards++;
      }
      expect(backwards, "scroll position jumped backwards").toBe(0);

      // 2. hizmetler sahnesi kartları geçerken header'ın altında yapışık kalıyor. telefonda
      // navbar kenara çekilirken sahne en tepeye yapışıyor.
      const stuck = samples.filter((s) => s.stageTop !== null && Math.abs(s.stageTop) <= 2);
      const tops = samples.map((s) => s.stageTop ?? NaN).filter((v) => !Number.isNaN(v));
      expect(
        stuck.length,
        `sticky stage never held at the top (header ${header}, stage top ${Math.min(...tops).toFixed(1)}…${Math.max(...tops).toFixed(1)}, ${samples.length} samples, max y ${Math.max(...samples.map((s) => s.y))})`,
      ).toBeGreaterThan(10);
      // …ve sahne yapışıkken navbar yolda değil.
      const concealedWhileStuck = stuck.filter((s) => s.concealed).length;
      expect(concealedWhileStuck, "navbar stayed over the pinned scene").toBeGreaterThan(stuck.length * 0.8);

      // 3. hizmet kartları okuma sırasıyla aktif oluyor: asla geriye doğru değil, ilkten
      // sonuncuya. (hızlı bir fırlatma tek kaydırma olayında bir kartı atlayabilir, bu
      // normal.)
      const order = samples.map((s) => s.active).filter((a, i, all) => a >= 0 && a !== all[i - 1]);
      for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThan(order[i - 1]);
      expect(order[0]).toBe(0);
      expect(order[order.length - 1]).toBe(5);
      expect(new Set(order).size).toBeGreaterThanOrEqual(4);

      // 4. sona gelindi ve hiçbir şey yana taşmıyor.
      expect(await page.evaluate(() => scrollY)).toBeGreaterThan(total - 8);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ).toBeLessThanOrEqual(0);

      // 5. fırlatmayı bozacak kadar uzun ana thread takılması yok.
      expect(longTasks.filter((d) => d > 100), "long tasks over 100ms").toEqual([]);

      test.info().annotations.push({
        type: "frame-time",
        description: `${device}: ${frames.length} frames, p95 ${p95(frames.slice(5)).toFixed(1)} ms, lab ${
          (await page.evaluate(() => document.documentElement.classList.contains("lab-on"))) ? "on" : "off"
        }`,
      });
    });

    test("a hard fling settles on the card under the focus line", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const top = await page
        .locator("[data-bay='services'] .bay-cards")
        .evaluate((el) => el.getBoundingClientRect().top + scrollY - innerHeight * 0.4);
      await page.evaluate((y) => window.scrollTo(0, y), top);
      await page.waitForTimeout(300);
      await fling(page, 900, 90);
      await page.waitForTimeout(150);
      await fling(page, 900, 90);
      await page.waitForTimeout(1400);
      const result = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-bay='services'] .bay-card"));
        const focus = innerHeight * 0.72; // telefonda kartlar sticky sahnenin altında okunuyor
        let nearest = 0;
        let best = Infinity;
        cards.forEach((card, i) => {
          const r = card.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - focus);
          if (d < best) {
            best = d;
            nearest = i;
          }
        });
        const active = cards.findIndex((card) => card.classList.contains("is-active"));
        const rail = Array.from(
          document.querySelectorAll<HTMLElement>("[data-bay='services'] [data-rail-index]"),
        ).findIndex((a) => a.classList.contains("is-active"));
        return { nearest, active, rail };
      });
      expect(Math.abs(result.active - result.nearest)).toBeLessThanOrEqual(1);
      expect(result.rail).toBe(result.active);
    });

    test("a toolbar-sized height change does not move the page or resize the scene", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page
        .waitForFunction(() => document.documentElement.classList.contains("lab-on"), null, {
          timeout: 8000,
        })
        .catch(() => {});
      const y = await page
        .locator("[data-bay='services'] .bay-cards")
        .evaluate((el) => el.getBoundingClientRect().top + scrollY);
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(500);
      const before = await page.evaluate(() => ({
        y: scrollY,
        canvas: document.querySelector<HTMLCanvasElement>(".lab-canvas")?.height ?? 0,
        anchor: document.querySelector("[data-bay='services'] .bay-card")!.getBoundingClientRect().top,
      }));
      const size = page.viewportSize()!;
      await page.setViewportSize({ width: size.width, height: size.height - 64 });
      await page.waitForTimeout(500);
      await page.setViewportSize(size);
      await page.waitForTimeout(500);
      const after = await page.evaluate(() => ({
        y: scrollY,
        canvas: document.querySelector<HTMLCanvasElement>(".lab-canvas")?.height ?? 0,
        anchor: document.querySelector("[data-bay='services'] .bay-card")!.getBoundingClientRect().top,
      }));
      expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(2);
      expect(Math.abs(after.anchor - before.anchor)).toBeLessThanOrEqual(2);
      expect(after.canvas).toBe(before.canvas);
    });
  });
}
