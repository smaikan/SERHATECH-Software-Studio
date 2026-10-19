import { defineConfig } from "@playwright/test";

// testler .next-e2e'deki production build'e karşı çalışıyor (NEXT_DIST_DIR), .next'te
// çalışan önizleme build'i hiç ezilmesin diye. 3100'ü başka bir şey kullanıyorsa
// PW_PORT sunucuyu başka porta taşıyor. portta zaten çalışan bir sunucu varsa olduğu
// gibi kullanılıyor.
const origin = `http://localhost:${process.env.PW_PORT || "3100"}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  fullyParallel: true,
  workers: 2,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: origin,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chrome",
      testIgnore: /scroll-mobile\.spec\.ts/,
      use: {
        browserName: "chromium",
        channel: "chrome",
        viewport: { width: 1440, height: 1000 },
      },
    },
    // kare süresi ve uzun task kontrolleri sessiz bir makine istiyor: fonksiyonel
    // testlerden sonra, tek tek çalışıyorlar.
    {
      name: "chrome-mobile-scroll",
      testMatch: /scroll-mobile\.spec\.ts/,
      dependencies: ["chrome"],
      use: { browserName: "chromium", channel: "chrome" },
    },
    // mobil kaydırma kurallarının ios motorunda çalıştırılması.
    // `playwright install webkit` gerekiyor.
    ...(process.env.PW_WEBKIT
      ? [
          {
            name: "webkit-mobile",
            testMatch: /scroll-mobile\.spec\.ts/,
            use: { browserName: "webkit" as const },
          },
        ]
      : []),
  ],
  webServer: {
    command: `pnpm start --port ${new URL(origin).port}`,
    url: origin,
    env: { CONTACT_SITE_URL: origin, NEXT_DIST_DIR: ".next-e2e" },
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
