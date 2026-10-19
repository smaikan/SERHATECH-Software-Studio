import type { StageName } from "./store";

// `rest`: sticky sahne yapışıkken çerçevenin üst kenarı (sadece sticky sahnelerde).
export type StageRect = {
  left: number;
  top: number;
  width: number;
  height: number;
  rest?: number;
};

type Geometry = {
  left: number;
  width: number;
  height: number;
  // çerçevenin sticky sahnesi içindeki kayması (sticky değilse 0).
  offsetTop: number;
  // hiçbir şey yapışık değilken çerçevenin sayfadaki konumu.
  docTop: number;
  sticky: null | {
    top: number; // sticky sahnenin css `top` değeri
    naturalTop: number; // yapışık değilken sahnenin sayfadaki üst kenarı
    limit: number; // içinde bulunduğu bloğun sayfadaki alt kenarı
    height: number;
  };
};

// sahne geometrisini her layout değişiminde bir kere ölçüyor, sonra "bu sahne şu an
// nerede" sorusunu sadece scrollY ile cevaplıyor, position: sticky'yi taklit ederek.
// render döngüsü layout okumuyor, kaydırırken zorunlu reflow olmuyor.
export function createStageTracker(stages: Record<StageName, HTMLElement | null>) {
  const geometry: Partial<Record<StageName, Geometry>> = {};

  function measure() {
    const y = window.scrollY;
    for (const name of Object.keys(stages) as StageName[]) {
      const el = stages[name];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const stage = el.closest<HTMLElement>(".bay-stage");
      let sticky: Geometry["sticky"] = null;
      let offsetTop = 0;
      if (stage && getComputedStyle(stage).position === "sticky") {
        const sr = stage.getBoundingClientRect();
        const grid = stage.parentElement!;
        const gr = grid.getBoundingClientRect();
        offsetTop = r.top - sr.top;
        sticky = {
          top: parseFloat(getComputedStyle(stage).top) || 0,
          // sahne grid'in ilk elemanı: yapışık değilken grid'in tepesinden başlıyor.
          naturalTop: gr.top + y,
          limit: gr.bottom + y,
          height: sr.height,
        };
      }
      geometry[name] = {
        left: r.left,
        width: r.width,
        height: r.height,
        offsetTop,
        docTop: r.top + y,
        sticky,
      };
    }
  }

  function rect(name: StageName, scrollY: number): StageRect | null {
    const g = geometry[name];
    if (!g || !g.width || !g.height) return null;
    if (!g.sticky) return { left: g.left, top: g.docTop - scrollY, width: g.width, height: g.height };
    const s = g.sticky;
    let top = Math.max(s.naturalTop - scrollY, s.top);
    top = Math.min(top, s.limit - scrollY - s.height);
    return {
      left: g.left,
      top: top + g.offsetTop,
      width: g.width,
      height: g.height,
      rest: s.top + g.offsetTop,
    };
  }

  measure();
  return { measure, rect };
}
