import { text, type Locale } from "@/i18n/routing";
import { createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import {
  createContactSchema,
  type ContactPayload,
} from "./contact-schema";
import { services } from "@/content/studio";
import { contactConfigIssues } from "./contact-config.mjs";

const MAX_BYTES = 16_384;

const timelineLabels: Record<ContactPayload["timeline"], string> = {
  "": "Belirtilmedi",
  hemen: "Hemen",
  "1-3-ay": "1–3 ay içinde",
  "belli-degil": "Henüz belli değil",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// stüdyonun gelen kutusuna düşen mesaj. geri arama istendiyse ilk o göze çarpıyor:
// konuda, mesajın en üstünde ve resend etiketinde.
export function composeEmail(data: ContactPayload, service: string) {
  // şema numarayı zaten +90 532 123 45 67 diye yazdı, tel: linki ise boşluksuz istiyor.
  const phone = data.phone.replace(/[^\d+]/g, "");
  const callback = data.callback && phone;
  const subject = `${callback ? "📞 Arama talebi – " : ""}Yeni proje talebi: ${service}`;
  const rows: [string, string][] = [
    ["Ad soyad", data.name],
    ["Şirket", data.company || "Belirtilmedi"],
    ["E-posta", data.email],
    ["Telefon", data.phone || "Belirtilmedi"],
    ["Geri arama", callback ? "Evet, lütfen arayın" : "Hayır"],
    ["Konu", service],
    ["Başlangıç", timelineLabels[data.timeline]],
  ];
  const plain = [
    ...(callback ? [`>>> ARAMA TALEBİ: ${data.phone} (tel:${phone})`, ""] : []),
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    data.message,
  ].join("\n");
  const html = `<!doctype html><html lang="tr"><body style="font-family:Arial,sans-serif;color:#0d1621;line-height:1.5">
${
  callback
    ? `<div style="border-left:4px solid #ffb547;background:#fff6e6;padding:12px 16px;margin:0 0 16px"><strong>Sizi aramamı istiyor:</strong> <a href="tel:${escapeHtml(phone)}">${escapeHtml(data.phone)}</a></div>`
    : ""
}<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="color:#4a5866;font-weight:normal">${escapeHtml(label)}</th><td>${
          label === "Telefon" && phone
            ? `<a href="tel:${escapeHtml(phone)}">${escapeHtml(value)}</a>`
            : escapeHtml(value)
        }</td></tr>`,
    )
    .join("")}</table>
<p style="white-space:pre-wrap;border-top:1px solid #d5dde5;padding-top:12px">${escapeHtml(data.message)}</p>
</body></html>`;
  return { subject, text: plain, html };
}
export function contactIsConfigured() {
  return process.env.CONTACT_FORM_ENABLED === "true" && contactConfigIssues(process.env).length === 0;
}

const rateScript = `
if tonumber(redis.call('GET', KEYS[1]) or '0') >= 5 or tonumber(redis.call('GET', KEYS[2]) or '0') >= 50 then return 0 end
local visitor = redis.call('INCR', KEYS[1])
if visitor == 1 then redis.call('EXPIRE', KEYS[1], 600) end
local global = redis.call('INCR', KEYS[2])
if global == 1 then redis.call('EXPIRE', KEYS[2], 600) end
return 1`;

function json(message: string, status: number, extra = {}, headers = {}) {
  return Response.json(
    { message, ...extra },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
}

async function readBody(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_BYTES)
    throw new RangeError();
  if (!request.body) throw new SyntaxError();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new RangeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

export async function handleContact(request: Request) {
  const locale: Locale = /^en(?:[-,;]|$)/i.test(
    request.headers.get("accept-language") || "",
  )
    ? "en"
    : "tr";
  const unavailable = text(
    locale,
    "İletişim formu şu anda gönderim kabul edemiyor. Mesajınız gönderilmedi. Lütfen daha sonra yeniden deneyin.",
    "The contact form is currently unavailable. Your message was not sent. Please try again later.",
  );
  const production = process.env.NODE_ENV === "production";
  const origin = request.headers.get("origin");
  let allowedOrigin: string | null = null;
  try {
    const configuredOrigin =
      process.env.CONTACT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
    allowedOrigin = configuredOrigin
      ? new URL(configuredOrigin).origin
      : production
        ? null
        : new URL(request.url).origin;
  } catch {
    return json(unavailable, 503);
  }
  if (!allowedOrigin || origin !== allowedOrigin)
    return json(
      text(
        locale,
        "Bu kaynaktan gönderim kabul edilmiyor.",
        "Submissions from this origin are not accepted.",
      ),
      403,
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json(
      text(locale, "Geçersiz istek biçimi.", "Invalid request format."),
      415,
    );
  let body: unknown;
  try {
    body = await readBody(request);
  } catch (error) {
    return json(
      error instanceof RangeError
        ? text(locale, "Mesaj çok uzun.", "The message is too long.")
        : text(
            locale,
            "Form verisi okunamadı.",
            "Couldn’t read the form data.",
          ),
      error instanceof RangeError ? 413 : 400,
    );
  }
  const parsed = createContactSchema(locale).safeParse(body);
  if (!parsed.success)
    return json(
      text(
        locale,
        "Lütfen işaretli alanları kontrol edin.",
        "Please check the highlighted fields.",
      ),
      400,
      {
        errors: parsed.error.flatten().fieldErrors,
      },
    );
  const data = parsed.data;
  if (
    data.website ||
    Date.now() - data.startedAt < 2500 ||
    Date.now() - data.startedAt > 86_400_000
  )
    return json(
      text(
        locale,
        "Gönderim doğrulanamadı. Sayfayı yenileyip tekrar deneyin.",
        "Couldn’t verify the submission. Refresh the page and try again.",
      ),
      400,
    );
  if (!contactIsConfigured()) return json(unavailable, 503);
  const header = process.env.TRUSTED_IP_HEADER;
  const ip = header
    ? request.headers.get(header)?.trim()
    : "127.0.0.1";
  if (!ip || !isIP(ip)) return json(unavailable, 503);
  const visitor = createHmac("sha256", process.env.RATE_LIMIT_SECRET!)
    .update(ip)
    .digest("hex");
  const operationId = randomUUID();
  let stage = "rate-limit";
  let statusCode: number | null = null;
  try {
    const limit = await fetch(process.env.UPSTASH_REDIS_REST_URL!, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        rateScript,
        "2",
        `studio:contact:${visitor}`,
        "studio:contact:global",
      ]),
    });
    statusCode = limit.status;
    if (!limit.ok) throw new Error("rate-limit-service");
    const result = (await limit.json()) as { result?: number; error?: string };
    if (result.error || (result.result !== 0 && result.result !== 1))
      throw new Error("rate-limit-response");
    if (result.result !== 1)
      return json(
        text(
          locale,
          "Kısa sürede çok fazla gönderim yapıldı. Lütfen 10 dakika sonra tekrar deneyin.",
          "Too many submissions. Please try again in 10 minutes.",
        ),
        429,
        {},
        { "Retry-After": "600" },
      );
    // eski istemciler hala hizmet slug'ı gönderebilir, onun yerine başlığını göster.
    const service =
      services.find((item) => item.slug === data.service)?.title || data.service;
    const email = composeEmail(data, service);
    stage = "resend";
    statusCode = null;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        // resend `<olay-tipi>/<kayıt-id>` biçiminde anahtar öneriyor, tekrar denemelerde aynı
        // id kullanılıyor.
        "Idempotency-Key": `contact-request/${data.submissionId}`,
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL,
        to: [process.env.CONTACT_TO_EMAIL],
        reply_to: [data.email],
        subject: email.subject,
        text: email.text,
        html: email.html,
        tags: [
          { name: "source", value: "contact_form" },
          { name: "callback", value: data.callback ? "yes" : "no" },
        ],
      }),
    });
    statusCode = response.status;
    if (!response.ok) throw new Error("delivery-service");
    const receipt = (await response.json()) as { id?: string };
    if (typeof receipt.id !== "string" || !/^[a-zA-Z0-9-]{1,128}$/.test(receipt.id)) throw new Error("delivery-response");
    console.info({ operationId, stage: "accepted", statusCode, resendMessageId: receipt.id });
    return json(
      data.callback
        ? text(
            locale,
            "Talebiniz alındı. Belirttiğiniz numaradan en kısa sürede aranacaksınız.",
            "Your request has been received. You will be called back on the number you provided shortly.",
          )
        : text(
            locale,
            "Talebiniz alındı. Değerlendirildikten sonra e-posta adresinizden dönüş yapılacak.",
            "Your request has been received. You will get a reply by email once it has been reviewed.",
          ),
      200,
    );
  } catch (error) {
    console.error({ operationId, stage, statusCode });
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return json(stage === "resend" ? text(
      locale,
      "Gönderim sonucu doğrulanamadı. Formunuz korundu; aynı içerikle yeniden deneyebilirsiniz.",
      "Couldn’t confirm the submission. Your form has been kept; you can retry with the same content.",
    ) : unavailable, timedOut ? 504 : 503);
  }
}
