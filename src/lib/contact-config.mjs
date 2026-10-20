// Shared by the server and the offline readiness check. Never return secret values.
import { isIP } from "node:net";

const placeholder = /example|placeholder|your[_-]|change[_-]?me|replace[_-]?me|dummy|test[_-]|x{4,}/i;
const mailbox = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;
const validMailbox = (value) => value.length <= 254 && value.indexOf("@") <= 64 && mailbox.test(value);

export function contactConfigIssues(env) {
  const issues = [];
  const required = ["RESEND_API_KEY", "CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "RATE_LIMIT_SECRET"];
  for (const name of required) {
    if (!env[name]?.trim()) issues.push(`${name} eksik.`);
    else if (placeholder.test(env[name])) issues.push(`${name} örnek değer içeriyor.`);
  }
  if (env.RESEND_API_KEY && !/^re_[A-Za-z0-9_-]{20,}$/.test(env.RESEND_API_KEY))
    issues.push("RESEND_API_KEY biçimi geçersiz.");
  if (env.UPSTASH_REDIS_REST_TOKEN && !/^\S{32,}$/.test(env.UPSTASH_REDIS_REST_TOKEN))
    issues.push("UPSTASH_REDIS_REST_TOKEN geçersiz.");
  if (env.RATE_LIMIT_SECRET && (env.RATE_LIMIT_SECRET.trim().length < 32 || /\s/.test(env.RATE_LIMIT_SECRET)))
    issues.push("RATE_LIMIT_SECRET en az 32 karakter olmalı ve boşluk içermemeli.");
  const sender = env.CONTACT_FROM_EMAIL || "";
  const senderAddress = sender.includes("<") ? sender.match(/^[^<>\r\n]+<([^<>]+)>$/)?.[1] : sender;
  if (!senderAddress || !validMailbox(senderAddress) || /[\r\n]/.test(sender) || /@resend\.dev$/i.test(senderAddress))
    issues.push("CONTACT_FROM_EMAIL doğrulanmış bir alan adındaki gönderici olmalı; test göndereni kullanılamaz.");
  if (!validMailbox(env.CONTACT_TO_EMAIL || ""))
    issues.push("CONTACT_TO_EMAIL tek bir geçerli e-posta adresi olmalı.");
  try {
    const redis = new URL(env.UPSTASH_REDIS_REST_URL);
    if (redis.protocol !== "https:" || !redis.hostname.endsWith(".upstash.io") || redis.username || redis.password || redis.port || redis.pathname !== "/" || redis.search || redis.hash)
      throw new Error();
  } catch {
    issues.push("UPSTASH_REDIS_REST_URL geçerli bir Upstash HTTPS adresi olmalı.");
  }
  const origin = env.CONTACT_SITE_URL || env.NEXT_PUBLIC_SITE_URL;
  if (origin || env.NODE_ENV === "production") {
    try {
      const url = new URL(origin);
      if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
        (env.NODE_ENV === "production" && (url.protocol !== "https:" || isIP(url.hostname) || !url.hostname.includes(".") || /localhost|\.local$|\.test$|\.example$|example\.(com|org|net)$/.test(url.hostname))))
        throw new Error();
    } catch {
      issues.push("CONTACT_SITE_URL geçerli bir site origin adresi olmalı; production için HTTPS gerekli.");
    }
  }
  if ((env.NODE_ENV === "production" || env.TRUSTED_IP_HEADER) && env.TRUSTED_IP_HEADER?.toLowerCase() !== "x-real-ip")
    issues.push("TRUSTED_IP_HEADER Caddy tarafından üzerine yazılan X-Real-IP olmalı.");
  if (env.CONTACT_FORM_ENABLED && !["true", "false"].includes(env.CONTACT_FORM_ENABLED))
    issues.push("CONTACT_FORM_ENABLED true veya false olmalı.");
  return issues;
}
