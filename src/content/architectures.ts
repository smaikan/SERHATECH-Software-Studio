import type { Locale } from "@/i18n/routing";

// gerçek projelerin mimari haritaları. sadece proje tanımında adı geçen parçalar var,
// proje açıklamasında olmayan hiçbir bağlantı eklenmedi. aynı veri ana sayfadaki
// hologramı ve her vaka sayfasındaki svg diyagramı besliyor.

type Copy = { tr: string; en: string };

export type ArchNode = {
  id: string;
  label: Copy;
  tech: string;
  column: number; // 0 arayüz, 1 uygulama, 2 veri / servis, 3 dış servis
  row: number; // sütun içindeki konum, ondalıklı olabilir
};

export type Architecture = {
  nodes: ArchNode[];
  edges: [string, string][];
  // bir grup düğümün etrafına çizilen isteğe bağlı çalışma sınırı (mesela docker
  // servisleri).
  frame?: { label: Copy; nodeIds: string[] };
};

export const architectures: Record<string, Architecture> = {
  "eleven-accessory": {
    nodes: [
      {
        id: "store",
        label: { tr: "Mağaza arayüzü", en: "Storefront" },
        tech: "Next.js / React",
        column: 0,
        row: 0,
      },
      {
        id: "api",
        label: { tr: "Backend API", en: "Backend API" },
        tech: "ASP.NET Core",
        column: 1,
        row: 0,
      },
      {
        id: "db",
        label: { tr: "Veritabanı", en: "Database" },
        tech: "SQL Server",
        column: 2,
        row: -0.7,
      },
      {
        id: "payment",
        label: { tr: "Test ödeme", en: "Test payments" },
        tech: "Entegrasyon",
        column: 2,
        row: 0.7,
      },
      {
        id: "mail",
        label: { tr: "E-posta", en: "Email" },
        tech: "Entegrasyon",
        column: 1,
        row: 1.4,
      },
    ],
    edges: [
      ["store", "api"],
      ["api", "db"],
      ["api", "payment"],
      ["api", "mail"],
    ],
    frame: {
      label: { tr: "Docker servisleri", en: "Docker services" },
      nodeIds: ["api", "db"],
    },
  },
  "nemora-diary": {
    nodes: [
      {
        id: "ui",
        label: { tr: "Günlük arayüzü", en: "Diary interface" },
        tech: "React",
        column: 0,
        row: 0,
      },
      {
        id: "backend",
        label: { tr: "Uygulama backend'i", en: "Application backend" },
        tech: ".NET",
        column: 1,
        row: 0,
      },
      {
        id: "llm",
        label: { tr: "Dil modeli servisi", en: "Language model" },
        tech: "LLM API",
        column: 3,
        row: 0,
      },
    ],
    edges: [
      ["ui", "backend"],
      ["backend", "llm"],
    ],
  },
  "meta-analiz-paneli": {
    nodes: [
      {
        id: "data",
        label: { tr: "Reklam ve ürün verisi", en: "Ad and product data" },
        tech: "Veri",
        column: 0,
        row: 0,
      },
      {
        id: "filter",
        label: { tr: "Filtreleme", en: "Filtering" },
        tech: "TypeScript",
        column: 1,
        row: -0.6,
      },
      {
        id: "view",
        label: { tr: "Analiz ekranları", en: "Analysis views" },
        tech: "Next.js / React",
        column: 2,
        row: 0,
      },
    ],
    edges: [
      ["data", "filter"],
      ["filter", "view"],
      ["data", "view"],
    ],
  },
};

export function nodeLabel(node: ArchNode, locale: Locale) {
  return node.label[locale];
}

export function nodeTech(node: ArchNode, locale: Locale) {
  if (locale === "tr") return node.tech;
  const english: Record<string, string> = {
    Entegrasyon: "Integration",
    Veri: "Data",
  };
  return english[node.tech] ?? node.tech;
}
