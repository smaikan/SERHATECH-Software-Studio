import { getProjects, getServices } from "@/content/english";
import { pageMetadata } from "@/lib/seo";
import { type Locale, type Route, pathFor, text } from "./routing";

const copy = {
  home: [
    "Özel yazılım, web uygulamaları ve otomasyon",
    "İşletmelere özel web uygulamaları, sistem entegrasyonları ve otomasyonlar. İhtiyaç analizinden yayına kadar tek elden yönetilen yazılım projeleri.",
    "Custom software, web applications and automation",
    "Web applications, system integrations and automations built around your business, managed end to end from analysis to launch.",
  ],
  services: [
    "Yazılım geliştirme hizmetleri",
    "Özel web uygulamaları, sistem entegrasyonları, e-ticaret çözümleri, iş süreci otomasyonu, kurulum ve yayın, yapay zekâ entegrasyonları.",
    "Software development services",
    "Custom web applications, system integrations, e-commerce solutions, workflow automation, setup and launch, and AI integrations.",
  ],
  work: [
    "Çalışmalar",
    "Eleven Accessory, Nemora Diary ve Meta Analiz Paneli: ne işe yaradıkları ve nasıl kurgulandıkları.",
    "Work",
    "Eleven Accessory, Nemora Diary and the Meta Analysis Panel: what they do and how they are put together.",
  ],
  about: [
    "Hakkında — Serhat Kucı",
    "Serhatech'in kurucusu Serhat Kucı ve projelere yaklaşımı: tek muhatap, yazılı kapsam, düzenli ilerleme.",
    "About — Serhat Kucı",
    "Serhat Kucı, founder of Serhatech, and how projects are run: one point of contact, written scope, steady progress.",
  ],
  process: [
    "Çalışma süreci",
    "Keşif görüşmesi, ihtiyaç analizi, planlama, geliştirme, test ve yayın: bir projenin baştan sona nasıl yönetildiği.",
    "The process",
    "Discovery, needs analysis, planning, development, testing and launch: how a project is managed from start to finish.",
  ],
  contact: [
    "İletişim — Projenizi konuşalım",
    "Projenizi kısaca anlatın; isterseniz telefon numaranızı bırakın, size telefonla dönüş yapılsın.",
    "Contact — Let’s discuss your project",
    "Describe your project briefly and leave a phone number if you would like a call back.",
  ],
  privacy: [
    "Gizlilik politikası",
    "İletişim formu, e-posta hizmetleri, tarayıcı tercihleri ve kişisel verilerin saklanmasına ilişkin gizlilik politikası.",
    "Privacy policy",
    "How contact enquiries, email services, browser preferences and personal data retention are handled.",
  ],
  kvkk: [
    "KVKK aydınlatma metni",
    "Veri sorumlusu, kişisel veri işleme amaçları ve hukuki sebepler, alıcılar ve KVKK kapsamındaki başvuru haklarınız.",
    "Data protection notice",
    "The data controller, processing purposes and legal bases, recipients, and your rights under Türkiye’s data protection law.",
  ],
} as const;

export function routeMetadata(locale: Locale, route: Route | null) {
  if (!route)
    return {
      title: text(locale, "Sayfa bulunamadı", "Page not found"),
      robots: { index: false, follow: false },
    };
  const item = route.slug
    ? (route.page === "services"
        ? getServices(locale)
        : getProjects(locale)
      ).find((item) => item.slug === route.slug)
    : null;
  const entry = copy[route.page];
  const title = item
    ? "title" in item
      ? item.title
      : item.name
    : entry[locale === "tr" ? 0 : 2];
  const description = item?.description || entry[locale === "tr" ? 1 : 3];
  return {
    ...pageMetadata(
      title,
      description,
      pathFor(locale, route.page, route.slug),
      locale,
    ),
    ...(["privacy", "kvkk"].includes(route.page)
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}
