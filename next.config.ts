import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // test build'i çalışan bir önizleme build'inin yanında durabilsin diye
  // (NEXT_DIST_DIR=.next-e2e).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // sadece geliştirme için: yerel ağdaki bir telefon (http://192.168.x.x:3000) dev
  // sunucusunun scriptlerini yükleyebilsin. bu olmazsa next.js onları engelliyor, sayfa
  // görünüyor ama hiç hydrate olmuyor: webgl yok, kaydırma hareketi yok. production
  // build'ler bunu umursamıyor.
  allowedDevOrigins: ["192.168.*.*"],
  poweredByHeader: false,
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
