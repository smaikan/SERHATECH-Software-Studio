import { describe, expect, it } from "vitest";
import { contactConfigIssues } from "../../src/lib/contact-config.mjs";

const env = {
  NODE_ENV: "production",
  CONTACT_FORM_ENABLED: "false",
  CONTACT_SITE_URL: "https://serha.tech",
  CONTACT_FROM_EMAIL: "SERHATECH Form <form@notify.serha.tech>",
  CONTACT_TO_EMAIL: "serhatvader@gmail.com",
  RESEND_API_KEY: "re_0123456789abcdefghijklmnopqrstuv",
  UPSTASH_REDIS_REST_URL: "https://eu-contact.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "aB0123456789012345678901234567890123",
  RATE_LIMIT_SECRET: "aB0123456789012345678901234567890123",
  TRUSTED_IP_HEADER: "X-Real-IP",
};

describe("contact production configuration", () => {
  it("allows readiness to be checked while sending is disabled", () => {
    expect(contactConfigIssues(env)).toEqual([]);
  });
  it.each([
    ["CONTACT_FORM_ENABLED", "yes"],
    ["RESEND_API_KEY", "re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"],
    ["RESEND_API_KEY", "re_short"],
    ["UPSTASH_REDIS_REST_TOKEN", "your_token"],
    ["UPSTASH_REDIS_REST_URL", "https://redis.example.com"],
    ["UPSTASH_REDIS_REST_URL", "http://eu-contact.upstash.io"],
    ["UPSTASH_REDIS_REST_URL", "https://eu-contact.upstash.io.evil.com"],
    ["UPSTASH_REDIS_REST_URL", "https://eu-contact.upstash.io/?token=secret"],
    ["UPSTASH_REDIS_REST_URL", "https://user:pass@eu-contact.upstash.io"],
    ["CONTACT_FROM_EMAIL", "onboarding@resend.dev"],
    ["CONTACT_FROM_EMAIL", "SERHATECH <broken>"],
    ["CONTACT_FROM_EMAIL", "Form\r\nBcc: attacker@serha.tech <form@notify.serha.tech>"],
    ["CONTACT_TO_EMAIL", ""],
    ["CONTACT_TO_EMAIL", "a@serha.tech,b@serha.tech"],
    ["CONTACT_TO_EMAIL", "a..b@serha.tech"],
    ["CONTACT_SITE_URL", "https://serha.tech/contact"],
    ["CONTACT_SITE_URL", "http://serha.tech"],
    ["CONTACT_SITE_URL", "https://localhost"],
    ["CONTACT_SITE_URL", "https://127.0.0.1"],
    ["TRUSTED_IP_HEADER", "CF-Connecting-IP"],
    ["TRUSTED_IP_HEADER", ""],
    ["RATE_LIMIT_SECRET", "too-short"],
    ["RATE_LIMIT_SECRET", "change-me-change-me-change-me-change-me"],
  ])("rejects unsafe %s configuration", (name, value) => {
    const issues = contactConfigIssues({ ...env, [name]: value });
    expect(issues.some((issue) => issue.startsWith(name))).toBe(true);
    if (value) expect(issues.join(" ")).not.toContain(value);
  });
});
