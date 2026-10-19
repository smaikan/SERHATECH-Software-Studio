import type { Locale } from "@/i18n/routing";
import { getCountries, getCountryCallingCode } from "libphonenumber-js/max";
import { Metadata } from "libphonenumber-js/core";
import metadata from "libphonenumber-js/max/metadata";

// sadece sunucuda: iletişim formundaki telefon alanı için ülke listesi. tam metadata
// sunucuda kalıyor, sayfaya liste düz veri olarak gidiyor.
export type PhoneCountry = {
  code: string; // iso 3166 kodu, "TR"
  dial: string; // "+" olmadan ülke kodu, "90"
  name: string; // sayfanın dilinde
  digits: number; // en uzun cep ya da sabit hat ulusal numarası
  prefix: string; // numaranın önüne yazılan şehir öneki ("0"), yoksa ""
};

export const DEFAULT_PHONE_COUNTRY = "TR";

type NumberingPlan = {
  possibleLengths(): number[];
  nationalPrefix(): string | undefined;
  type(name: string): { possibleLengths(): number[] } | undefined;
};

export function phoneCountries(locale: Locale): PhoneCountry[] {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const plan = new Metadata(metadata);
  const list = getCountries().map((code) => {
    plan.selectNumberingPlan(code);
    // çalışma anındaki numaralandırma planında bunlar var, paketin tiplerinde yok.
    const numbering = plan.numberingPlan as unknown as NumberingPlan;
    // sadece cep ve sabit hat uzunlukları. yoksa servis numaraları (türkiye'de 444'lü
    // hatlar, 12–13 haneli kodlar) sınırı insanların yazdığından fazlasına çıkarırdı.
    const lengths = ["MOBILE", "FIXED_LINE"].flatMap(
      (type) => numbering.type(type)?.possibleLengths() ?? [],
    );
    return {
      code,
      dial: getCountryCallingCode(code),
      name: names.of(code) ?? code,
      digits: Math.max(...(lengths.length ? lengths : numbering.possibleLengths())),
      prefix: numbering.nationalPrefix() ?? "",
    };
  });
  const collator = new Intl.Collator(locale);
  return list.sort((a, b) =>
    a.code === DEFAULT_PHONE_COUNTRY
      ? -1
      : b.code === DEFAULT_PHONE_COUNTRY
        ? 1
        : collator.compare(a.name, b.name),
  );
}
