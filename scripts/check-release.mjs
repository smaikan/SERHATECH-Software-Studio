import { readFileSync } from "node:fs";

const required = [
  "NEXT_PUBLIC_COMPANY_NAME",
  "NEXT_PUBLIC_SITE_URL",
  "COMPANY_LEGAL_NAME",
  "RESEND_API_KEY",
  "CONTACT_FROM_EMAIL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RATE_LIMIT_SECRET",
  "TRUSTED_IP_HEADER",
];
const missing = required.filter((name) => !process.env[name]);
const issues = missing.map((name) => `${name} eksik.`);
if (process.env.SITE_INDEXING_ENABLED !== "true")
  issues.push(
    "SITE_INDEXING_ENABLED kapalı; yayına hazırlıkta ayrıca açılmalı.",
  );
if (process.env.LEGAL_CONTENT_APPROVED !== "true")
  issues.push("Hukuki metinler henüz onaylı değil.");
if ((process.env.RATE_LIMIT_SECRET?.length || 0) < 32)
  issues.push("RATE_LIMIT_SECRET en az 32 karakter olmalı.");
if (process.env.CONTACT_FROM_EMAIL?.includes("@resend.dev"))
  issues.push(
    "CONTACT_FROM_EMAIL test göndereni kullanıyor; yayın için doğrulanmış alan adınızı kullanın.",
  );
for (const name of ["NEXT_PUBLIC_SITE_URL", "UPSTASH_REDIS_REST_URL"]) {
  try {
    if (new URL(process.env[name]).protocol !== "https:")
      issues.push(`${name} HTTPS kullanmalı.`);
  } catch {
    if (process.env[name]) issues.push(`${name} geçerli bir URL olmalı.`);
  }
}
const legal = readFileSync(
  new URL("../src/components/legal-content.tsx", import.meta.url),
  "utf8",
);
if (/kesinleşmiş bir hukuki metin değildir/.test(legal))
  issues.push("Hukuki sayfalar hâlâ taslak içerik taşıyor.");
if (issues.length) {
  console.error(
    "Yayın hazırlığı tamamlanmadı:\n" +
      issues.map((issue) => `- ${issue}`).join("\n"),
  );
  process.exitCode = 1;
} else {
  console.log(
    "Yapılandırma alanları mevcut. E-posta bağlantısı, DNS ve hukuki içerik ayrıca doğrulanmalıdır.",
  );
}
