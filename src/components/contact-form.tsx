"use client";
import { text, pathFor, type Locale } from "@/i18n/routing";

import { useEffect, useRef, useState, type FocusEvent, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { ease } from "@/lib/motion/tokens";

import type { ContactFieldErrors } from "@/lib/contact-schema";
import type { PhoneCountry } from "@/lib/phone-countries";

// zod ve telefon kuralları (libphonenumber) ziyaretçi forma gelince yükleniyor, her
// sayfada değil. sayfaların hepsi aynı client paketini paylaşıyor, ana sayfa da dahil.
const loadSchemas = () => import("@/lib/contact-schema");
const loadPhone = () => import("@/lib/phone");
type PhoneRules = Awaited<ReturnType<typeof loadPhone>>;

// gönderim id'si için v4 uuid. crypto.randomUUID sadece güvenli bağlamda (https,
// localhost) ve yeni tarayıcılarda var, getRandomValues ise her yerde çalışıyor.
function submissionUuid() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

type CheckedField = "email" | "phone";

export function ContactForm({
  configured,
  locale = "tr",
  initialService = "",
  phoneCountries,
}: {
  configured: boolean;
  locale?: Locale;
  initialService?: string;
  // ülke kodları ve numara uzunlukları sunucuda hazırlanıyor (lib/phone-countries.ts).
  // listedeki ilk ülke varsayılan.
  phoneCountries: PhoneCountry[];
}) {
  const form = useRef<HTMLFormElement>(null);
  const startedAt = useRef(0);
  const submissionId = useRef("");
  const pending = useRef(false);
  const pointerHeld = useRef(false);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [sending, setSending] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const defaultCountry = phoneCountries[0]?.code ?? "TR";
  const [country, setCountry] = useState(defaultCountry);
  const countryRef = useRef(defaultCountry);
  const phoneRules = useRef<PhoneRules | null>(null);
  const lastPhoneDigits = useRef("");
  const countryOf = (code: string) =>
    phoneCountries.find((item) => item.code === code) ?? phoneCountries[0];
  const [status, setStatus] = useState<{ message: string; ok: boolean } | null>(
    null,
  );
  useEffect(() => {
    startedAt.current = Date.now();
    submissionId.current = submissionUuid();
  }, []);

  useEffect(() => {
    const release = () => {
      pointerHeld.current = false;
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  useEffect(() => {
    const input = form.current?.elements.namedItem("service") as HTMLInputElement | null;
    if (input && initialService && !input.value) input.value = initialService;
  }, [initialService]);

  function focusError(nextErrors: ContactFieldErrors) {
    const key = Object.keys(nextErrors)[0];
    const element = key ? form.current?.elements.namedItem(key) : null;
    if (element instanceof HTMLElement) element.focus();
  }

  const unconfirmed = () =>
    text(
      locale,
      "Gönderim sonucu doğrulanamadı. Bağlantınızı kontrol edip yeniden deneyin.",
      "Couldn’t confirm delivery. Check your connection and try again.",
    );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setStatus(null);
    const fields: Record<string, unknown> = Object.fromEntries(new FormData(event.currentTarget));
    fields.phone = phoneE164();
    delete fields.phoneCountry;
    let createContactSchema: Awaited<ReturnType<typeof loadSchemas>>["createContactSchema"];
    try {
      ({ createContactSchema } = await loadSchemas());
    } catch {
      pending.current = false;
      setStatus({ ok: false, message: unconfirmed() });
      return;
    }
    const parsed = createContactSchema(locale).safeParse({
      ...fields,
      startedAt: startedAt.current,
      submissionId: submissionId.current,
    });
    if (!parsed.success) {
      pending.current = false;
      const nextErrors = parsed.error.flatten().fieldErrors;
      setErrors(nextErrors);
      focusError(nextErrors);
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
        },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(20000),
      });
      const data = (await response.json()) as {
        message: string;
        errors?: ContactFieldErrors;
      };
      setStatus({ message: data.message, ok: response.ok });
      if (data.errors) {
        setErrors(data.errors);
        focusError(data.errors);
      }
      if (response.ok) {
        form.current?.reset();
        lastPhoneDigits.current = "";
        setHasPhone(false);
        countryRef.current = defaultCountry;
        setCountry(defaultCountry);
        startedAt.current = Date.now();
        submissionId.current = submissionUuid();
      }
    } catch {
      setStatus({ ok: false, message: unconfirmed() });
    } finally {
      pending.current = false;
      setSending(false);
    }
  }
  // e-posta ve telefonu ziyaretçi alandan çıkar çıkmaz kontrol ediyoruz. alanda hata
  // varken her tuşta tekrar bakıyoruz, düzelince mesaj hemen kayboluyor.
  async function checkField(name: CheckedField, value: string, clearOnly: boolean) {
    let result;
    try {
      result = (await loadSchemas()).createFieldSchemas(locale)[name].safeParse(value);
    } catch {
      return;
    }
    setErrors((current) => {
      if (result.success) {
        if (!current[name]) return current;
        const next = { ...current };
        delete next[name];
        return next;
      }
      if (clearOnly) return current;
      return { ...current, [name]: result.error.issues.map((issue) => issue.message) };
    });
  }

  // kullanıcı alandan başka bir şeye basarak çıkarsa (geri arama kutusu, gönder butonu)
  // hatayı tıklama bittikten sonra gösteriyoruz. yoksa araya giren hata satırı butonu
  // parmağın altından kaydırıyor ve tıklama boşa gidiyor.
  function afterClick(run: () => void) {
    if (!pointerHeld.current) return run();
    let done = false;
    const once = () => {
      if (done) return;
      done = true;
      window.removeEventListener("pointerup", later);
      run();
    };
    const later = () => setTimeout(once, 0);
    window.addEventListener("pointerup", later, { once: true });
    setTimeout(once, 1500);
  }

  const phoneInput = () => form.current?.elements.namedItem("phone") as HTMLInputElement | null;

  // numaranın gönderilen ve kontrol edilen hali: seçilen ülke + ulusal haneler ile
  // E.164. başa yazılan 0 gibi şehir öneki atılıyor.
  function phoneE164() {
    const digits = phoneInput()?.value.replace(/\D/g, "") ?? "";
    if (!digits) return "";
    const { code, dial, prefix } = countryOf(countryRef.current);
    const fromRules = phoneRules.current?.toE164(digits, code);
    if (fromRules) return fromRules;
    return `+${dial}${prefix && digits.startsWith(prefix) ? digits.slice(prefix.length) : digits}`;
  }

  // sadece rakam bırakıyoruz, ülkenin numarasında kaç hane varsa en fazla o kadar (başa
  // yazılan önek hariç). rakamları ülkenin grupladığı gibi yazıyoruz, imleç de aynı
  // rakamın arkasında kalıyor.
  function applyPhone(input: HTMLInputElement, raw: string, caret: number) {
    const { code, digits: longest, prefix } = countryOf(countryRef.current);
    let digits = raw.replace(/\D/g, "");
    const limit = longest + (prefix && digits.startsWith(prefix) ? prefix.length : 0);
    digits = digits.slice(0, limit);
    const before = Math.min(raw.slice(0, caret).replace(/\D/g, "").length, digits.length);
    const formatted = phoneRules.current ? phoneRules.current.formatNational(digits, code) : digits;
    if (formatted !== input.value) {
      input.value = formatted;
      if (document.activeElement === input) {
        let position = 0;
        for (let seen = 0; position < formatted.length && seen < before; position++)
          if (/\d/.test(formatted[position])) seen++;
        input.setSelectionRange(position, position);
      }
    }
    lastPhoneDigits.current = digits;
    setHasPhone(digits.length > 0);
    if (errors.phone) void checkField("phone", phoneE164(), true);
  }

  function changeCountry(code: string, national?: string) {
    countryRef.current = code;
    setCountry(code);
    const input = phoneInput();
    if (input) applyPhone(input, national ?? input.value, (national ?? input.value).length);
  }

  function onPhoneInput(input: HTMLInputElement, inputType: string) {
    let raw = input.value;
    let caret = input.selectionStart ?? raw.length;
    // boşluğu ya da tireyi silmek işe yaramıyor, gruplarken geri geliyor. o yüzden onun
    // yerine yanındaki rakamı siliyoruz.
    const digitsNow = raw.replace(/\D/g, "");
    if (inputType.startsWith("delete") && digitsNow === lastPhoneDigits.current) {
      let index = raw.slice(0, caret).replace(/\D/g, "").length;
      if (inputType === "deleteContentBackward") index -= 1;
      if (index >= 0 && index < digitsNow.length) {
        raw = digitsNow.slice(0, index) + digitsNow.slice(index + 1);
        caret = index;
        input.value = raw;
      }
    }
    // yapıştırılan ya da otomatik doldurulan uluslararası numara ülkeyi kendisi seçiyor.
    const split = /^\s*(\+|00)/.test(raw) ? phoneRules.current?.splitInternational(raw) : null;
    if (split && phoneCountries.some((item) => item.code === split.country)) {
      changeCountry(split.country, split.national);
      return;
    }
    applyPhone(input, raw, caret);
  }

  function onPhoneBlur() {
    const value = phoneE164();
    afterClick(() => void checkField("phone", value, false));
  }

  function loadPhoneRules() {
    if (phoneRules.current) return;
    loadPhone()
      .then((rules) => {
        phoneRules.current = rules;
        // kurallar yüklenmeden önce yazılan rakamları şimdi grupluyoruz.
        const input = phoneInput();
        if (input?.value) applyPhone(input, input.value, input.value.length);
      })
      .catch(() => undefined);
  }

  function onEmailBlur(event: FocusEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    input.value = input.value.trim();
    // hiç dokunulmamış boş alan henüz hata sayılmaz, gönderirken zaten soracağız.
    const value = input.value;
    if (value) afterClick(() => void checkField("email", value, false));
  }

  const fieldError = (name: keyof ContactFieldErrors) =>
    errors[name] ? (
      <span id={`${name}-error`} className="field-error">
        {errors[name]?.[0]}
      </span>
    ) : null;
  const a11y = (name: keyof ContactFieldErrors) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form
      ref={form}
      className="contact-form"
      onSubmit={submit}
      onFocus={() => {
        loadSchemas().catch(() => undefined);
        loadPhoneRules();
      }}
      onPointerDownCapture={() => {
        pointerHeld.current = true;
      }}
      noValidate
      aria-label={text(locale, "Proje talep formu", "Project enquiry form")}
      aria-busy={sending}
    >
      {!configured ? (
        <p className="notice">
          {text(
            locale,
            "Formun e-posta bağlantısı henüz etkin değil. Şimdilik bu sayfadaki e-posta adresine doğrudan yazabilirsiniz.",
            "Email delivery is not enabled yet. For now, please write directly to the email address on this page.",
          )}
        </p>
      ) : null}
      <div className="field">
        <label htmlFor="name">{text(locale, "Ad soyad", "Full name")}</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          placeholder={text(locale, "Adınız ve soyadınız", "Your full name")}
          {...a11y("name")}
        />
        {fieldError("name")}
      </div>
      <div className="field">
        <label htmlFor="email">
          {text(locale, "E-posta adresi", "Email address")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          spellCheck={false}
          autoComplete="email"
          required
          maxLength={254}
          placeholder={text(locale, "ad@sirketiniz.com", "name@company.com")}
          onInput={(event) => {
            // e-posta adresinde boşluk olmaz, yazarken ya da yapıştırırken siliyoruz.
            const input = event.currentTarget;
            if (/\s/.test(input.value)) input.value = input.value.replace(/\s+/g, "");
            if (errors.email) void checkField("email", input.value, true);
          }}
          onBlur={onEmailBlur}
          {...a11y("email")}
        />
        {fieldError("email")}
      </div>
      <div className="field">
        <label htmlFor="phone">
          {text(locale, "Telefon", "Phone")}
          {" "}
          <span>{text(locale, "İsteğe bağlı", "Optional")}</span>
        </label>
        <div className="phone-input">
          {/* görünen kod şeffaf bir native select'in üstüne çiziliyor. böylece her cihazda
             gerçek bir liste açılıyor, klavye ve ekran okuyucu da sorunsuz çalışıyor. */}
          <div className="phone-country">
            <span className="phone-country-code" aria-hidden="true">
              {country} +{countryOf(country).dial}
            </span>
            <select
              id="phone-country"
              name="phoneCountry"
              value={country}
              autoComplete="tel-country-code"
              aria-label={text(locale, "Ülke telefon kodu", "Country calling code")}
              onChange={(event) => changeCountry(event.currentTarget.value)}
              onFocus={loadPhoneRules}
            >
              {phoneCountries.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name} (+{item.dial})
                </option>
              ))}
            </select>
          </div>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={country === "TR" ? "532 123 45 67" : ""}
            onInput={(event) =>
              onPhoneInput(event.currentTarget, (event.nativeEvent as InputEvent).inputType ?? "")
            }
            onBlur={onPhoneBlur}
            {...a11y("phone")}
          />
        </div>
        {fieldError("phone")}
      </div>
      <div className="field">
        <label htmlFor="company">
          {text(locale, "Şirket / marka", "Company / brand")}
          {" "}
          <span>{text(locale, "İsteğe bağlı", "Optional")}</span>
        </label>
        <input
          id="company"
          name="company"
          autoComplete="organization"
          maxLength={150}
          placeholder={text(locale, "Şirketinizin adı", "Your company name")}
          {...a11y("company")}
        />
        {fieldError("company")}
      </div>
      <label className="field-wide callback" data-disabled={!hasPhone || undefined}>
        <input id="callback" name="callback" type="checkbox" disabled={!hasPhone} />
        <span>{text(locale, "Beni telefonla arayın", "Call me back")}</span>
      </label>
      <div className="field field-wide">
        <label htmlFor="service">
          {text(locale, "Ne konuda yardım istiyorsunuz?", "What do you need help with?")}
        </label>
        <input
          id="service"
          name="service"
          required
          maxLength={120}
          defaultValue={initialService}
          placeholder={text(
            locale,
            "Örneğin: sipariş takip paneli",
            "For example: an order tracking panel",
          )}
          {...a11y("service")}
        />
        {fieldError("service")}
      </div>
      <div className="field field-wide">
        <label htmlFor="message">
          {text(locale, "Projenizi kısaca anlatın", "Describe your project briefly")}
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={20}
          maxLength={5000}
          placeholder={text(
            locale,
            "Neye ihtiyacınız var? Bugün sizi zorlayan ne?",
            "What do you need? What is getting in the way today?",
          )}
          {...a11y("message")}
        />
        {fieldError("message")}
      </div>
      <fieldset className="field-wide timeline">
        <legend>
          {text(locale, "Ne zaman başlamak istersiniz?", "When would you like to start?")}
          {" "}
          <span>{text(locale, "İsteğe bağlı", "Optional")}</span>
        </legend>
        <div className="timeline-options">
          {(
            [
              ["hemen", "Hemen", "Right away"],
              ["1-3-ay", "1–3 ay içinde", "Within 1–3 months"],
              ["belli-degil", "Henüz belli değil", "Not decided yet"],
            ] as const
          ).map(([value, tr, en]) => (
            <label key={value} className="timeline-option">
              <input type="radio" name="timeline" value={value} />
              <span>{text(locale, tr, en)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">
          {text(locale, "Bu alanı boş bırakın", "Leave this field empty")}
        </label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className="form-foot">
        <p>
          {text(
            locale,
            "Paylaştığınız bilgiler yalnızca talebinizi değerlendirmek ve size dönüş yapmak için kullanılır; telefon numarası yalnızca geri arama içindir.",
            "The information you share is used only to assess your request and get back to you; the phone number is used only for a call back.",
          )}{" "}
          <Link prefetch={false} href={pathFor(locale, "kvkk")}>
            {text(locale, "Aydınlatma metni", "Data protection notice")}
          </Link>{" "}
          {text(locale, "ve", "and")}{" "}
          <Link prefetch={false} href={pathFor(locale, "privacy")}>
            {text(locale, "gizlilik bilgileri", "privacy information")}
          </Link>
          .
        </p>
        <button
          className="btn btn-primary"
          type="submit"
          disabled={sending}
        >
          <span>
            {sending
              ? text(locale, "Gönderiliyor…", "Sending…")
              : text(locale, "Talebi gönder", "Send request")}
          </span>
          <span className={`btn-icon${sending ? " is-sending" : ""}`} aria-hidden="true">
            <ArrowUpRight size={18} />
          </span>
        </button>
      </div>
      <div className="field-wide" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait" initial={false}>
          {status ? (
            <m.p
              key={status.message}
              className={`form-status ${status.ok ? "success" : "error"}`}
              role={status.ok ? "status" : "alert"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: ease.enter.bezier } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {status.message}
            </m.p>
          ) : null}
        </AnimatePresence>
      </div>
    </form>
  );
}
