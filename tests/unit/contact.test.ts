import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleContact } from "../../src/lib/contact-server";

const valid = () => ({
  name: "Test Kullanıcısı",
  company: "",
  email: "test@example.com",
  service: "ozel-web-uygulamalari",
  message: "İşletmem için sipariş takip uygulaması geliştirmek istiyorum.",
  phone: "",
  callback: false,
  timeline: "",
  website: "",
  startedAt: Date.now() - 5000,
  submissionId: "123e4567-e89b-42d3-a456-426614174000",
});
function request(
  data: unknown,
  options: { origin?: string; type?: string; raw?: string } = {},
) {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      Origin: options.origin ?? "http://localhost:3000",
      "Content-Type": options.type ?? "application/json",
    },
    body: options.raw ?? JSON.stringify(data),
  });
}
function configure() {
  vi.stubEnv("CONTACT_FORM_ENABLED", "true");
  vi.stubEnv("RESEND_API_KEY", "re_0123456789abcdefghijklmnopqrstuv");
  vi.stubEnv("CONTACT_FROM_EMAIL", "SERHATECH Form <form@notify.serha.tech>");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://eu-contact.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "aB0123456789012345678901234567890123");
  vi.stubEnv("RATE_LIMIT_SECRET", "aB0123456789012345678901234567890123");
  vi.stubEnv("CONTACT_TO_EMAIL", "serhatvader@gmail.com");
}
describe("contact delivery boundary", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("CONTACT_SITE_URL", "");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("CONTACT_FORM_ENABLED", "false");
    vi.stubEnv("CONTACT_TO_EMAIL", "");
    vi.stubEnv("TRUSTED_IP_HEADER", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  it("rejects another origin", async () => {
    expect(
      (
        await handleContact(
          request(valid(), { origin: "https://evil.example" }),
        )
      ).status,
    ).toBe(403);
  });
  it("localizes server validation and unavailable responses for English visitors", async () => {
    const invalid = request({ ...valid(), name: "" });
    invalid.headers.set("accept-language", "en");
    const response = await handleContact(invalid);
    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result.message).toBe("Please check the highlighted fields.");
    expect(result.errors.name).toEqual(["Enter your full name."]);
    const unavailable = request(valid());
    unavailable.headers.set("accept-language", "en-US,en;q=0.9");
    expect((await (await handleContact(unavailable)).json()).message).toContain(
      "Your message was not sent",
    );
  });
  it("returns English success while delivering the original visitor message to the fixed recipient", async () => {
    configure();
    const mock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ result: 1 }))
      .mockResolvedValueOnce(Response.json({ id: "receipt" }));
    vi.stubGlobal("fetch", mock);
    const req = request({
      ...valid(),
      message: "I need a custom order management application.",
    });
    req.headers.set("accept-language", "en");
    const response = await handleContact(req);
    expect(response.status).toBe(200);
    expect((await response.json()).message).toContain(
      "Your request has been received",
    );
    const email = JSON.parse(mock.mock.calls[1][1].body);
    expect(email.to).toEqual(["serhatvader@gmail.com"]);
    expect(email.text).toContain(
      "I need a custom order management application.",
    );
  });
  it("rejects absent origin", async () => {
    const req = request(valid());
    req.headers.delete("origin");
    expect((await handleContact(req)).status).toBe(403);
  });
  it("requires JSON", async () => {
    expect(
      (await handleContact(request(valid(), { type: "text/plain" }))).status,
    ).toBe(415);
  });
  it("rejects malformed JSON", async () => {
    expect((await handleContact(request(null, { raw: "{" }))).status).toBe(400);
  });
  it("limits the actual body size", async () => {
    expect(
      (await handleContact(request(null, { raw: "x".repeat(17000) }))).status,
    ).toBe(413);
  });
  it("returns inline errors for empty fields", async () => {
    const response = await handleContact(
      request({ ...valid(), name: "", message: "" }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).errors.name).toBeDefined();
  });
  it("rejects invalid email server-side", async () => {
    expect(
      (await handleContact(request({ ...valid(), email: "bad" }))).status,
    ).toBe(400);
  });
  it("requires a topic in the visitor's own words", async () => {
    expect((await handleContact(request({ ...valid(), service: " " }))).status).toBe(400);
  });
  it("rejects populated honeypot", async () => {
    expect(
      (await handleContact(request({ ...valid(), website: "spam" }))).status,
    ).toBe(400);
  });
  it("rejects impossibly fast submission", async () => {
    expect(
      (await handleContact(request({ ...valid(), startedAt: Date.now() })))
        .status,
    ).toBe(400);
  });
  it("rejects expired form", async () => {
    expect(
      (
        await handleContact(
          request({ ...valid(), startedAt: Date.now() - 90_000_000 }),
        )
      ).status,
    ).toBe(400);
  });
  it("never claims delivery without configuration", async () => {
    const response = await handleContact(request(valid()));
    expect(response.status).toBe(503);
    expect((await response.json()).message).toContain("gönderilmedi");
  });
  it("requires a configured sender", async () => {
    configure();
    vi.stubEnv("CONTACT_FROM_EMAIL", "");
    expect((await handleContact(request(valid()))).status).toBe(503);
  });
  it("rejects malformed recipient configuration without contacting services", async () => {
    configure();
    vi.stubEnv("CONTACT_TO_EMAIL", "not-an-email");
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    expect((await handleContact(request(valid()))).status).toBe(503);
    expect(mock).not.toHaveBeenCalled();
  });
  it("handles malformed site URL configuration without an unhandled error", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "invalid");
    expect((await handleContact(request(valid()))).status).toBe(503);
  });
  it("accepts the server-only origin independently of preview SEO configuration", async () => {
    vi.stubEnv("CONTACT_SITE_URL", "http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://different.example");
    const response = await handleContact(request({}));
    expect(response.status).toBe(400);
  });
  it("uses the server recipient setting instead of client data", async () => {
    configure();
    vi.stubEnv("CONTACT_TO_EMAIL", "configured@serha.tech");
    const mock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ result: 1 }))
      .mockResolvedValueOnce(Response.json({ id: "receipt" }));
    vi.stubGlobal("fetch", mock);
    expect(
      (await handleContact(request({ ...valid(), to: "attacker@example.com" })))
        .status,
    ).toBe(200);
    expect(JSON.parse(mock.mock.calls[1][1].body).to).toEqual([
      "configured@serha.tech",
    ]);
  });
  it("fails closed when Redis is unavailable", async () => {
    configure();
    const mock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", mock);
    expect((await handleContact(request(valid()))).status).toBe(503);
    expect(mock).toHaveBeenCalledTimes(1);
  });
  it("never contacts providers while the switch is off", async () => {
    configure();
    vi.stubEnv("CONTACT_FORM_ENABLED", "false");
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    expect((await handleContact(request(valid()))).status).toBe(503);
    expect(mock).not.toHaveBeenCalled();
  });
  it.each([401, 429, 500])("handles Resend status %s without claiming success", async (status) => {
    configure();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(Response.json({ result: 1 }))
      .mockResolvedValueOnce(Response.json({ message: "private provider details" }, { status })));
    const response = await handleContact(request(valid()));
    expect(response.status).toBe(503);
    expect((await response.json()).message).toContain("doğrulanamadı");
    const log = vi.mocked(console.error).mock.calls[0][0];
    expect(log).toEqual({ operationId: expect.any(String), stage: "resend", statusCode: status });
  });
  it.each(["rate-limit", "resend"])("handles a %s timeout and logs no personal data", async (stage) => {
    configure();
    const mock = vi.fn();
    if (stage === "resend") mock.mockResolvedValueOnce(Response.json({ result: 1 }));
    mock.mockRejectedValueOnce(new DOMException("contains secrets and personal data", "TimeoutError"));
    vi.stubGlobal("fetch", mock);
    const req = request(valid());
    req.headers.set("accept-language", "en");
    const response = await handleContact(req);
    expect(response.status).toBe(504);
    expect((await response.json()).message).toContain(stage === "resend" ? "Couldn’t confirm" : "was not sent");
    expect(vi.mocked(console.error).mock.calls[0][0]).toEqual({ operationId: expect.any(String), stage, statusCode: null });
    expect(mock).toHaveBeenCalledTimes(stage === "resend" ? 2 : 1);
  });
  it("rejects a list of proxy IPs instead of trusting the first address", async () => {
    configure();
    vi.stubEnv("TRUSTED_IP_HEADER", "X-Real-IP");
    const req = request(valid());
    req.headers.set("X-Real-IP", "203.0.113.1, 203.0.113.2");
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    expect((await handleContact(req)).status).toBe(503);
    expect(mock).not.toHaveBeenCalled();
  });
  it("keeps the same provider key on retry", async () => {
    configure();
    const mock = vi.fn()
      .mockResolvedValueOnce(Response.json({ result: 1 }))
      .mockRejectedValueOnce(new DOMException("timeout", "TimeoutError"))
      .mockResolvedValueOnce(Response.json({ result: 1 }))
      .mockResolvedValueOnce(Response.json({ id: "receipt" }));
    vi.stubGlobal("fetch", mock);
    const data = valid();
    expect((await handleContact(request(data))).status).toBe(504);
    expect((await handleContact(request(data))).status).toBe(200);
    expect(mock.mock.calls[1][1].headers["Idempotency-Key"]).toBe(mock.mock.calls[3][1].headers["Idempotency-Key"]);
    expect(mock.mock.calls[1][1].body).toBe(mock.mock.calls[3][1].body);
  });
  it("enforces shared rate limits before sending", async () => {
    configure();
    const mock = vi.fn().mockResolvedValue(Response.json({ result: 0 }));
    vi.stubGlobal("fetch", mock);
    const response = await handleContact(request(valid()));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("600");
    expect(mock).toHaveBeenCalledTimes(1);
  });
  it("rejects malformed rate-limit responses", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ error: "broken" })),
    );
    expect((await handleContact(request(valid()))).status).toBe(503);
  });
  it("reports provider failure honestly", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ result: 1 }))
        .mockResolvedValueOnce(
          Response.json({ error: "failed" }, { status: 500 }),
        ),
    );
    expect((await handleContact(request(valid()))).status).toBe(503);
  });
  it("requires a delivery receipt", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ result: 1 }))
        .mockResolvedValueOnce(Response.json({})),
    );
    expect((await handleContact(request(valid()))).status).toBe(503);
  });
  it("sends validated plain text with idempotency and no raw IP in Redis", async () => {
    configure();
    const mock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ result: 1 }))
      .mockResolvedValueOnce(Response.json({ id: "receipt" }));
    vi.stubGlobal("fetch", mock);
    const response = await handleContact(request(valid()));
    expect(response.status).toBe(200);
    const redis = mock.mock.calls[0][1];
    expect(redis.body).not.toContain("127.0.0.1");
    const email = JSON.parse(mock.mock.calls[1][1].body);
    expect(email.reply_to).toEqual(["test@example.com"]);
    expect(email.to).toEqual(["serhatvader@gmail.com"]);
    expect(email.text).toContain("Ad soyad: Test Kullanıcısı");
    expect(email.text).toContain(valid().message);
    expect(email.html).toContain("Test Kullanıcısı");
    expect(email.tags).toContainEqual({ name: "callback", value: "no" });
    expect(email.text).toContain("Geri arama: Hayır");
    expect(email.subject).not.toContain("Arama talebi");
    expect(mock.mock.calls[1][1].headers["Idempotency-Key"]).toBe(
      `contact-request/${valid().submissionId}`,
    );
  });
  it("keeps every supplied field and fixes the recipient server-side", async () => {
    configure();
    const mock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ result: 1 }))
      .mockResolvedValueOnce(Response.json({ id: "receipt" }));
    vi.stubGlobal("fetch", mock);
    const response = await handleContact(
      request({
        ...valid(),
        company: "Test Marka",
        timeline: "1-3-ay",
        to: "attacker@example.com",
      }),
    );
    expect(response.status).toBe(200);
    const email = JSON.parse(mock.mock.calls[1][1].body);
    expect(email.to).toEqual(["serhatvader@gmail.com"]);
    expect(email.text).toContain("Şirket: Test Marka");
    expect(email.text).toContain("Başlangıç: 1–3 ay içinde");
    expect(email.subject).toContain("Özel web uygulamaları");
  });
  it("puts a requested call back in the subject, body, html and tags", async () => {
    configure();
    const mock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ result: 1 }))
      .mockResolvedValueOnce(Response.json({ id: "receipt" }));
    vi.stubGlobal("fetch", mock);
    const response = await handleContact(
      request({ ...valid(), phone: "+905321234567", callback: true }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).message).toContain("aranacaksınız");
    const email = JSON.parse(mock.mock.calls[1][1].body);
    expect(email.subject).toMatch(/^📞 Arama talebi/);
    expect(email.text).toContain("ARAMA TALEBİ: +90 532 123 45 67 (tel:+905321234567)");
    expect(email.text).toContain("Telefon: +90 532 123 45 67");
    expect(email.text).toContain("Geri arama: Evet, lütfen arayın");
    expect(email.html).toContain('href="tel:+905321234567"');
    expect(email.tags).toContainEqual({ name: "callback", value: "yes" });
  });
  it("refuses a call back without a phone number", async () => {
    configure();
    const response = await handleContact(request({ ...valid(), callback: true }));
    expect(response.status).toBe(400);
    expect((await response.json()).errors.phone).toBeDefined();
  });
  it("rejects malformed phone numbers", async () => {
    configure();
    for (const phone of [
      "abc",
      "12",
      "0532 123",
      "0132 123 45 67",
      "532a1234567",
      "+90 532 123 45 67 89 01 23",
      "+1 23",
    ]) {
      const response = await handleContact(request({ ...valid(), phone }));
      expect(response.status, phone).toBe(400);
      expect((await response.json()).errors.phone, phone).toBeDefined();
    }
  });
  it("rejects malformed email addresses", async () => {
    configure();
    for (const email of [
      "ad",
      "ad@",
      "ad@sirket",
      "ad soyad@sirket.com",
      "ad..soyad@sirket.com",
      ".ad@sirket.com",
      "ad@-sirket.com",
      "ad@sirket.c",
      "ayşe@sirket.com",
    ]) {
      const response = await handleContact(request({ ...valid(), email }));
      expect(response.status, email).toBe(400);
      expect((await response.json()).errors.email, email).toBeDefined();
    }
  });
  it("escapes visitor input in the html body", async () => {
    configure();
    const mock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ result: 1 }))
      .mockResolvedValueOnce(Response.json({ id: "receipt" }));
    vi.stubGlobal("fetch", mock);
    await handleContact(
      request({
        ...valid(),
        name: "<b>Test</b>",
        message: "<script>alert(1)</script> bir sipariş paneli istiyorum.",
      }),
    );
    const email = JSON.parse(mock.mock.calls[1][1].body);
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("&lt;b&gt;Test&lt;/b&gt;");
  });
  it("production requires a trusted proxy header", async () => {
    configure();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CONTACT_SITE_URL", "https://serha.tech");
    expect((await handleContact(request(valid(), { origin: "https://serha.tech" }))).status).toBe(503);
  });
  it("production rejects missing client identity", async () => {
    configure();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CONTACT_SITE_URL", "https://serha.tech");
    vi.stubEnv("TRUSTED_IP_HEADER", "x-real-ip");
    expect((await handleContact(request(valid(), { origin: "https://serha.tech" }))).status).toBe(503);
  });
  it("production accepts a single proxy IP and logs only the provider receipt metadata", async () => {
    configure();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CONTACT_SITE_URL", "https://serha.tech");
    vi.stubEnv("TRUSTED_IP_HEADER", "X-Real-IP");
    const mock = vi.fn()
      .mockResolvedValueOnce(Response.json({ result: 1 }))
      .mockResolvedValueOnce(Response.json({ id: "receipt" }));
    vi.stubGlobal("fetch", mock);
    const req = request(valid(), { origin: "https://serha.tech" });
    req.headers.set("X-Real-IP", "2001:db8::1");
    expect((await handleContact(req)).status).toBe(200);
    expect(mock.mock.calls[0][1].body).not.toContain("2001:db8::1");
    expect(vi.mocked(console.info).mock.calls[0][0]).toEqual({ operationId: expect.any(String), stage: "accepted", statusCode: 200, resendMessageId: "receipt" });
  });
});
