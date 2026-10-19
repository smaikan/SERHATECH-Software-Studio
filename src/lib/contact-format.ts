// form ve şemanın ortak kullandığı e-posta kuralları. düz fonksiyonlar, zod yok, form
// şema paketi yüklenmeden de kullanabilsin. telefon kuralları ./phone'da.

// @ işaretinden önce noktayla ayrılmış parçalar (başta, sonda ya da yan yana nokta
// yok), sonra tireyle başlamayan ve bitmeyen alan adı parçaları, sonra sadece harften
// oluşan uzantı.
const emailShape =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

export function isEmail(value: string) {
  const at = value.lastIndexOf("@");
  return value.length <= 254 && at > 0 && at <= 64 && emailShape.test(value);
}

/** alan adında büyük küçük harf fark etmiyor, @ öncesi yazıldığı gibi kalıyor. */
export function normaliseEmail(value: string) {
  const trimmed = value.trim();
  const at = trimmed.lastIndexOf("@");
  return at < 0 ? trimmed : `${trimmed.slice(0, at)}@${trimmed.slice(at + 1).toLowerCase()}`;
}
