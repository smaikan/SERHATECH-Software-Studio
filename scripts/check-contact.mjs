const required = [
  "RESEND_API_KEY",
  "CONTACT_FROM_EMAIL",
  "CONTACT_TO_EMAIL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RATE_LIMIT_SECRET",
];
const issues = required
  .filter((name) => !process.env[name]?.trim())
  .map((name) => `${name} eksik.`);
if (process.env.RATE_LIMIT_SECRET && process.env.RATE_LIMIT_SECRET.length < 32)
  issues.push("RATE_LIMIT_SECRET en az 32 karakter olmalı.");
if (process.env.UPSTASH_REDIS_REST_URL) {
  try {
    if (new URL(process.env.UPSTASH_REDIS_REST_URL).protocol !== "https:")
      issues.push("UPSTASH_REDIS_REST_URL HTTPS kullanmalı.");
  } catch {
    issues.push("UPSTASH_REDIS_REST_URL geçersiz.");
  }
}
if (
  process.env.CONTACT_TO_EMAIL &&
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.CONTACT_TO_EMAIL)
)
  issues.push("CONTACT_TO_EMAIL tek bir geçerli e-posta adresi olmalı.");
if (issues.length) {
  console.error(
    "Form yapılandırması tamamlanmadı:\n" +
      issues.map((issue) => `- ${issue}`).join("\n"),
  );
  process.exitCode = 1;
} else {
  console.log(
    "Yerel form alanları hazır. Bu kontrol mesaj göndermez; gerçek teslimat henüz doğrulanmadı.",
  );
  if (process.env.CONTACT_FROM_EMAIL.endsWith("@resend.dev"))
    console.log(
      "Test göndereni kullanılıyor: Resend hesabının e-postası alıcıyla aynı olmalı.",
    );
}
