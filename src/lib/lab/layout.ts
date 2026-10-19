// Serhatech Core'un toplanmış düzeni, webgl sahnesi ve svg poster ortak kullanıyor.
export const CORE = {
  radius: 2.3, // modül merkezinin reaktöre uzaklığı
  reactor: 0.92, // reaktör halkasının yarıçapı
  hudRing: 3.85,
  modules: 6,
} as const;

// i. modül halkanın üstünde duruyor, genişliği çembere teğet, derinliği reaktöre
// bakıyor. 0 açısı kameraya bakıyor (+z), modüller yukarıdan bakınca saat yönünde
// diziliyor.
export function moduleAngle(i: number) {
  return Math.PI / 2 - (i * Math.PI * 2) / CORE.modules;
}

export function modulePosition(i: number, radius: number = CORE.radius) {
  const a = moduleAngle(i);
  return [Math.cos(a) * radius, 0, Math.sin(a) * radius] as const;
}

// modülün yerel +z'sini halkanın dışına çeviren Y ekseni etrafındaki dönüş.
export function moduleYaw(i: number) {
  return Math.PI / 2 - moduleAngle(i);
}

// i. modülü öne (+z'deki kameraya) getiren grup dönüşü. Y etrafında ψ kadar dönüş,
// halkadaki a açısındaki noktayı a − ψ'ye taşıyor, yani ψ = a_i − π/2.
export function yawToFront(i: number) {
  return -(i * Math.PI * 2) / CORE.modules;
}
