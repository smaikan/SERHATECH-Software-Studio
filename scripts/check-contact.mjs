import { contactConfigIssues } from "../src/lib/contact-config.mjs";

const issues = contactConfigIssues({ ...process.env, NODE_ENV: "production" });
if (issues.length) {
  console.error("Form yapılandırması tamamlanmadı:\n" + issues.map((issue) => `- ${issue}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Yapılandırma biçimi hazır. Bu kontrol servis bağlantısı veya gerçek teslimat doğrulaması yapmaz.");
}
console.log(process.env.CONTACT_FORM_ENABLED === "true"
  ? "CONTACT_FORM_ENABLED=true: gönderim açık."
  : "CONTACT_FORM_ENABLED=false: gönderim kapalı.");
