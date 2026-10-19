import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { text, type Locale } from "@/i18n/routing";
export const size = { width: 1200, height: 630 };
export function socialImage(locale: Locale) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#070b12",
        color: "#e8f1f7",
        padding: 70,
      }}
    >
      <div style={{ color: "#ffb547", fontSize: 25, display: "flex" }}>
        {site.name} / {site.domain}
      </div>
      <div
        style={{
          fontSize: 76,
          lineHeight: 1.12,
          letterSpacing: -4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span>
          {text(locale, "Fikrinizden çalışan ürüne.", "From idea to working software.")}
        </span>
        <span style={{ color: "#6fe7ff" }}>
          {text(locale, "Analizden yayına tek süreç.", "One process, from analysis to launch.")}
        </span>
      </div>
      <div
        style={{
          fontSize: 20,
          color: "#9fb2c2",
          display: "flex",
          borderTop: "1px solid #1f3346",
          paddingTop: 24,
        }}
      >
        {text(
          locale,
          "Web uygulamaları / Entegrasyon / Otomasyon",
          "Web applications / Integration / Automation",
        )}
      </div>
    </div>,
    size,
  );
}
