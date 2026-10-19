import {
  AsYouType,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";

// iletişim formu (ziyaretçi forma gelince yükleniyor) ve şemanın ortak telefon
// kuralları. numaralar E.164 olarak gidip geliyor ("+905321234567").

/** ulusal haneler ülkenin okuduğu şekilde: 0532 123 45 67. */
export function formatNational(digits: string, country: string) {
  return digits ? new AsYouType(country as CountryCode).input(digits) : "";
}

/** bir ülkedeki ulusal numaranın E.164 hali, okunamazsa "". */
export function toE164(national: string, country: string) {
  return parsePhoneNumberFromString(national, country as CountryCode)?.number ?? "";
}

/** yapıştırılan ya da otomatik doldurulan uluslararası numarayı ülke ve hanelere ayırıyor. */
export function splitInternational(value: string) {
  const parsed = parsePhoneNumberFromString(value.trim().replace(/^00/, "+"));
  return parsed?.country ? { country: parsed.country as string, national: parsed.nationalNumber } : null;
}

export const isPhone = (e164: string) => isValidPhoneNumber(e164);

/** +90 532 123 45 67 */
export const phoneForPeople = (e164: string) =>
  parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
