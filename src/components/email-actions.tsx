"use client";
import { text, type Locale } from "@/i18n/routing";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { site } from "@/config/site";

// clipboard api varsa (https, localhost) onunla kopyalıyoruz. yoksa, mesela telefondan
// yerel ağ üzerinden dev sunucuya girilince ya da eski tarayıcıda, ekran dışında bir
// textarea'yı seçip öyle kopyalıyoruz.
async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // izin verilmedi, seçerek kopyalama yöntemine geçiyoruz.
    }
  }
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
  document.body.append(area);
  area.select();
  area.setSelectionRange(0, value.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  return copied;
}

export function EmailActions({
  locale = "tr",
  subject,
}: {
  subject?: string;
  locale?: Locale;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const reset = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (reset.current) clearTimeout(reset.current);
    };
  }, []);

  async function copyAddress() {
    if (reset.current) clearTimeout(reset.current);
    const copied = await copyText(site.email);
    if (mounted.current) setStatus(copied ? "copied" : "failed");
    if (mounted.current)
      reset.current = setTimeout(() => setStatus("idle"), 4000);
  }

  return (
    <div className="email-actions">
      <a
        className="btn btn-primary"
        href={`mailto:${site.email}?subject=${encodeURIComponent(subject || text(locale, "Proje hakkında", "About a project"))}`}
      >
        {text(locale, "E-posta yaz", "Write an email")}
        <ArrowUpRight size={18} aria-hidden="true" />
      </a>
      {/* buton kopyaladığı adresi gösteriyor. */}
      <button
        className="copy-email"
        type="button"
        onClick={copyAddress}
        aria-label={`${text(locale, "Adresi kopyala", "Copy address")}: ${site.email}`}
        data-copied={status === "copied" || undefined}
      >
        {status === "copied" ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Copy size={16} aria-hidden="true" />
        )}
        <span className="copy-email-address">{site.email}</span>
        <span className="copy-email-state" aria-hidden="true">
          {status === "copied"
            ? text(locale, "Kopyalandı", "Copied")
            : text(locale, "Kopyala", "Copy")}
        </span>
      </button>
      <p className="email-feedback" role="status">
        {status === "failed"
          ? text(
              locale,
              "Adres kopyalanamadı. Adresi seçerek kopyalayabilirsiniz:",
              "Couldn’t copy the address. You can select it and copy it:",
            )
          : status === "copied"
            ? text(
                locale,
                "E-posta adresi panoya kopyalandı.",
                "Email address copied to clipboard.",
              )
            : ""}
        {status === "failed" ? <span className="email-select"> {site.email}</span> : null}
      </p>
    </div>
  );
}
