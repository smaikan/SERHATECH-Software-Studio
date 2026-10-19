// kaydırma kontrolcüleri (yazanlar) ile render director'ı (okuyan) arasındaki düz,
// değiştirilebilir depo. burada react state'e dokunulmuyor, kaydırınca yeniden render
// olmuyor.

export type StageName = "hero" | "services" | "work";

export type LabTargets = {
  explode: number; // 0 toplanmış hero duruşu → 1 patlatılmış hizmetler duruşu
  service: number; // altı modül içinde mıknatıslanmış ondalık sıra
  arch: number; // 0 → 1 mimari (çalışmalar) duruşu
  project: number; // öne çıkan projeler içinde mıknatıslanmış ondalık sıra
  night: number; // 0 gündüz ışığı → 1 bay ışığı
  visible: number; // 0 → 1 çekirdeğin görünürlüğü
  pointerX: number; // -1 … 1, sadece masaüstü
  pointerY: number;
};

export function createTargets(): LabTargets {
  return {
    explode: 0,
    service: 0,
    arch: 0,
    project: 0,
    night: 0,
    visible: 1,
    pointerX: 0,
    pointerY: 0,
  };
}

// kart okunurken sabit kalıyor, kartlar arasında yumuşakça geçiyor.
export function magnetise(f: number, max: number) {
  const clamped = Math.min(Math.max(f, 0), max);
  const base = Math.floor(clamped);
  const t = clamped - base;
  const s = Math.min(Math.max((t - 0.28) / 0.44, 0), 1);
  return base + s * s * (3 - 2 * s);
}

// half-life ile üstel yaklaşma, kare hızından bağımsız.
export function damp(current: number, target: number, halfLife: number, dt: number) {
  if (halfLife <= 0) return target;
  return target + (current - target) * Math.pow(2, -dt / halfLife);
}

export function dampAngle(current: number, target: number, halfLife: number, dt: number) {
  return current + angleDelta(current, target) * (1 - Math.pow(2, -dt / halfLife));
}

export function angleDelta(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

// telefon hero: çizim ilk butonun hemen üstünden başlıyor, sayfa kaydıkça kendi
// sahnesine iniyor. bu iniş, gideceği mesafenin HERO_SETTLE katı kadar kaydırmada
// oluyor. canlı sahne (director.ts) ve ondan önce görünen sabit çekirdek ortak kullanıyor.
export const HERO_SETTLE = 2.5;
export const heroSettle = (scrolled: number, travel: number) => {
  if (travel <= 0) return travel;
  const x = clamp01(scrolled / (travel * HERO_SETTLE));
  return travel * (1 - (1 - x) * (1 - x));
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (edge0: number, edge1: number, v: number) => {
  const t = clamp01((v - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
