// gsap ve motion için tek bir hareket sözlüğü. süreler saniye cinsinden. hız önemine
// göre: küçük tepkiler hızlı, sahne değişimleri acele etmiyor.
export const duration = {
  micro: 0.18,
  ui: 0.32,
  enter: 0.7,
  scene: 0.9,
  intro: 2.2,
} as const;

// gsap ease isimleri ve motion / css için cubic-bezier karşılıkları.
export const ease = {
  micro: { gsap: "power2.out", bezier: [0.33, 1, 0.68, 1] },
  enter: { gsap: "expo.out", bezier: [0.16, 1, 0.3, 1] },
  scene: { gsap: "power3.inOut", bezier: [0.65, 0, 0.35, 1] },
  settle: { gsap: "sine.inOut", bezier: [0.37, 0, 0.63, 1] },
} as const;

// kaydırma ile sahne arasındaki kritik sönümlü takipçilerin half-life'ı (saniye).
// parmağa bağlı hissettirecek kadar kısa, her sarsıntıyı alacak kadar uzun.
export const damping = {
  scroll: 0.14,
  framing: 0.22,
  pointer: 0.35,
  lighting: 0.18,
} as const;

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "reduced")
  );
}
