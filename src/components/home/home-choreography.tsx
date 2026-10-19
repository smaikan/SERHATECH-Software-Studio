"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { labTargets } from "@/components/lab/director/targets";
import { clamp01, magnetise } from "@/components/lab/director/store";
import { duration, ease, prefersReducedMotion } from "@/lib/motion/tokens";
import { JOURNEY_LAYOUT, journeyHeights } from "./journey-path";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

type Cards = {
  root: HTMLElement;
  cards: HTMLElement[];
  centers: number[];
  active: number;
};

function cacheCenters(group: Cards) {
  const y = window.scrollY;
  group.centers = group.cards.map((card) => {
    const r = card.getBoundingClientRect();
    return r.top + y + r.height / 2;
  });
}

// odak çizgisinden geçen kartın ondalıklı sırası.
function cardIndex(group: Cards, focus: number) {
  const c = group.centers;
  if (!c.length) return 0;
  if (focus <= c[0]) return 0;
  for (let i = 0; i < c.length - 1; i++) {
    if (focus < c[i + 1]) return i + (focus - c[i]) / (c[i + 1] - c[i]);
  }
  return c.length - 1;
}

function setActive(group: Cards, index: number) {
  if (index === group.active) return;
  group.active = index;
  group.cards.forEach((card, i) => card.classList.toggle("is-active", i === index));
  const bay = group.root.closest("[data-bay]");
  bay
    ?.querySelectorAll<HTMLElement>("[data-rail-index]")
    .forEach((link, i) => {
      link.classList.toggle("is-active", i === index);
      if (i === index) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  bay
    ?.querySelectorAll<HTMLElement>(".stage-glyph, .stage-diagram")
    .forEach((el, i) => el.classList.toggle("is-active", i === index));
}

// kaydırma → sahne hedefleri ve küçük dom durumları. hiçbir yerde pin yok, sahneler
// css sticky. böylece dokunarak kaydırma ve ios araç çubuğu normal davranıyor.
export function HomeChoreography() {
  const scope = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      ScrollTrigger.config({ ignoreMobileResize: true });
      const reduced = prefersReducedMotion();
      const main = document.getElementById("main");
      if (!main) return;

      const cleanups: (() => void)[] = [];

      // ışık, çekirdeğin görünürlüğü ve mimari ağırlığı eşiklerden hesaplanıyor.
      const thresholds = gsap.utils.toArray<HTMLElement>("[data-threshold]", main);
      const progress = thresholds.map(() => 0);
      // telefonda: bir bay'den hemen sonra gelen eşik, o bay'in sahnesinin çıkışını takip
      // ediyor. sahne pinden kurtulduğu andan yukarıdan çıkana kadar. böylece sahne hala
      // yapışıkken solmaya başlamıyor.
      const exitProgress = thresholds.map(() => 0);
      const exitsBay = thresholds.map(
        (el) => el.previousElementSibling?.matches("[data-bay]") ?? false,
      );
      // telefonda: sahne tepeye yapışıkken navbar kenara çekiliyor, sahne solmaya
      // başlayınca geri geliyor.
      const header = document.querySelector<HTMLElement>(".site-header");
      const phone = window.matchMedia("(max-width: 899px)");
      const stuck = new Set<number>();
      let coreVisible = 1;
      const syncHeader = () => {
        const hide = phone.matches && stuck.size > 0 && coreVisible > 0.97;
        if (header && header.hasAttribute("data-concealed") !== hide)
          header.toggleAttribute("data-concealed", hide);
      };
      const recompute = () => {
        let night = 0;
        let visible = 1;
        let arch = 0;
        thresholds.forEach((el, i) => {
          const leaving = phone.matches && exitsBay[i];
          const p = leaving ? exitProgress[i] : progress[i];
          night += Number(el.dataset.light ?? 0) * p;
          // çekirdek ışıklar büyük ölçüde kısılınca görünüyor, ışıklar tekrar açılmadan gidiyor.
          // böylece gündüz yazılarının üstünde yarım yamalak asılı kalmıyor.
          const core = Number(el.dataset.core ?? 0);
          const pc = leaving ? p : core > 0 ? clamp01((p - 0.4) / 0.6) : clamp01(p / 0.6);
          visible += core * pc;
          if (el.dataset.arch === "in") arch = Math.max(arch, p);
        });
        labTargets.night = clamp01(night);
        labTargets.visible = clamp01(visible);
        coreVisible = clamp01(visible);
        syncHeader();
        labTargets.arch = clamp01(arch);
      };
      thresholds.forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 78%",
          end: "bottom 22%",
          onUpdate: (self) => {
            progress[i] = self.progress;
            recompute();
          },
          onRefresh: (self) => {
            progress[i] = self.progress;
            recompute();
          },
        });
        const bay = exitsBay[i] ? (el.previousElementSibling as HTMLElement) : null;
        const grid = bay?.querySelector<HTMLElement>(".bay-grid");
        const stage = bay?.querySelector<HTMLElement>(".bay-stage");
        if (grid && stage)
          ScrollTrigger.create({
            trigger: grid,
            start: () => `bottom top+=${stage.offsetHeight}`,
            end: "bottom top",
            onUpdate: (self) => {
              exitProgress[i] = self.progress;
              recompute();
            },
            onRefresh: (self) => {
              exitProgress[i] = self.progress;
              recompute();
            },
          });
      });

      // patlatılmış görünüm: hizmetlerden önce ışıklar kısılırken başlıyor, bay oturunca
      // bitiyor. çekirdek orada zaten açılmaya başlamış halde tekrar görünüyor.
      const servicesBay = main.querySelector<HTMLElement>("[data-bay='services']");
      const explodeThreshold = thresholds.find((el) => el.dataset.explode === "in");
      if (servicesBay && explodeThreshold) {
        ScrollTrigger.create({
          trigger: explodeThreshold,
          start: "top 70%",
          endTrigger: servicesBay.querySelector(".bay-grid") ?? servicesBay,
          end: "top 45%",
          onUpdate: (self) => (labTargets.explode = self.progress),
          onRefresh: (self) => (labTargets.explode = self.progress),
        });
      }

      // kart grupları aktif modülü / projeyi belirliyor.
      const compact = window.matchMedia("(max-width: 899px)");
      const groups: { group: Cards; key: "service" | "project" }[] = [];
      for (const [bayName, key] of [
        ["services", "service"],
        ["work", "project"],
      ] as const) {
        const bay = main.querySelector<HTMLElement>(`[data-bay='${bayName}']`);
        const root = bay?.querySelector<HTMLElement>(".bay-cards");
        if (!bay || !root) continue;
        const group: Cards = {
          root,
          cards: gsap.utils.toArray<HTMLElement>("[data-card-index]", root),
          centers: [],
          active: 0,
        };
        groups.push({ group, key });
        const meter = bay.querySelector<HTMLElement>(".bay-rail-meter span");
        const grid = bay.querySelector<HTMLElement>(".bay-grid");
        const stage = bay.querySelector<HTMLElement>(".bay-stage");
        const bayIndex = groups.length;
        if (grid && stage) {
          // sahne, grid'i tepeye değdiği andan grid'in altı onu tekrar itene kadar yapışık
          // kalıyor. sahne navbar'ın alt kenarına değince başlıyor, böylece sahne navbar'ı
          // yukarı itip tepeye çıkıyormuş gibi görünüyor.
          ScrollTrigger.create({
            trigger: grid,
            start: () => `top ${header?.offsetHeight ?? 0}px`,
            end: () => `bottom top+=${stage.offsetHeight}`,
            onToggle: (self) => {
              if (self.isActive) stuck.add(bayIndex);
              else stuck.delete(bayIndex);
              syncHeader();
            },
          });
        }
        // telefonda yapışık sahne ekranın üstünü kapatıyor, o yüzden kartı altta kalan
        // boşluğun ortasında okunmuş sayıyoruz. bunu refresh'te ölçüyoruz, her karede değil.
        let phoneFocus = 0.72;
        const update = () => {
          const focus = window.scrollY + window.innerHeight * (compact.matches ? phoneFocus : 0.58);
          const f = cardIndex(group, focus);
          const max = group.cards.length - 1;
          labTargets[key] = magnetise(f, max);
          setActive(group, Math.round(Math.min(Math.max(f, 0), max)));
          if (meter) meter.style.transform = `scaleY(${(f / Math.max(max, 1)).toFixed(4)})`;
        };
        ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          onUpdate: update,
          onRefresh: () => {
            cacheCenters(group);
            if (stage) phoneFocus = (stage.offsetHeight / window.innerHeight + 1) / 2;
            update();
          },
        });
      }

      // hareketli başlıklar: satırlar ekrana girince bir kere maskenin içinden yükseliyor.
      if (!reduced) {
        gsap.utils.toArray<HTMLElement>("[data-split]", main).forEach((heading) => {
          SplitText.create(heading, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 105,
                duration: duration.enter * 1.3,
                ease: ease.enter.gsap,
                stagger: 0.09,
                scrollTrigger: { trigger: heading, start: "top 88%", once: true },
              }),
          });
        });
      }

      // problem → cevap satırları: satır gelince aradaki ok çiziliyor.
      ScrollTrigger.batch(gsap.utils.toArray<HTMLElement>(".problem-row", main), {
        start: "top 86%",
        once: true,
        onEnter: (rows) =>
          rows.forEach((row, i) =>
            setTimeout(() => row.classList.add("is-in"), reduced ? 0 : i * 90),
          ),
      });

      // yol bölümü: kaydırdıkça çizilen tek yumuşak çizgi, çizgi bir durağa gelince o durak
      // yanıyor. çizginin ucu okuma çizgisini takip ediyor (ekranın %62'si), uzunluğa göre
      // değil yüksekliğe göre. böylece duraklar arasındaki kıvrımlarda da yazıyla birlikte
      // kalıyor. geometri JourneyPath'ten geliyor, burada her karede layout okunmuyor.
      const journey = main.querySelector<HTMLElement>("[data-journey] .journey-track");
      if (journey) {
        const line = journey.querySelector<SVGPathElement>(".journey-line");
        const tip = journey.querySelector<SVGCircleElement>(".journey-tip");
        const stops = gsap.utils.toArray<HTMLElement>(".journey-stop", journey);
        const state = { p: reduced ? 1 : 0 };
        let total = 0;
        let marks: number[] = [];
        let heights: Float32Array | undefined;
        let trackTop = 0;
        // çizginin y yüksekliğinin üstünde kalan kısmının oranı (track pikseli). çizgi hep
        // aşağı gittiği için örneklenen yükseklikler zaten sıralı.
        const drawnTo = (y: number) => {
          if (!heights || heights.length < 2) return 0;
          const last = heights.length - 1;
          if (y <= heights[0]) return 0;
          if (y >= heights[last]) return 1;
          let lo = 0;
          let hi = last;
          while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (heights[mid] < y) lo = mid;
            else hi = mid;
          }
          const span = heights[hi] - heights[lo];
          return (lo + (span > 0 ? (y - heights[lo]) / span : 0)) / last;
        };
        const toP = reduced
          ? null
          : gsap.quickTo(state, "p", { duration: 0.45, ease: "power3.out", onUpdate: () => apply() });
        const follow = () => {
          toP?.(drawnTo(window.scrollY + window.innerHeight * 0.62 - trackTop));
        };
        const measureTrack = () => {
          trackTop = journey.getBoundingClientRect().top + window.scrollY;
        };
        const readLayout = () => {
          const svg = line?.ownerSVGElement;
          total = Number(svg?.dataset.length ?? 0);
          heights = svg ? journeyHeights.get(svg) : undefined;
          marks = stops.map((stop) => Number(stop.dataset.at ?? 1));
          measureTrack();
          apply();
          follow();
        };
        const apply = () => {
          const p = state.p;
          if (line) line.style.strokeDashoffset = String(1 - p);
          if (tip && line && total) {
            const point = line.getPointAtLength(p * total);
            tip.style.transform = `translate(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px)`;
            tip.style.opacity = p > 0.002 && p < 0.998 ? "1" : "0";
          }
          stops.forEach((stop, i) => stop.classList.toggle("is-on", p >= (marks[i] ?? 1) - 0.015));
        };
        if (!reduced) journey.classList.add("journey-armed");
        window.addEventListener(JOURNEY_LAYOUT, readLayout);
        readLayout();
        if (!reduced) {
          ScrollTrigger.create({
            trigger: journey,
            start: "top bottom",
            end: "bottom top",
            onUpdate: follow,
            onRefresh: () => {
              measureTrack();
              follow();
            },
          });
        }
        cleanups.push(() => {
          window.removeEventListener(JOURNEY_LAYOUT, readLayout);
          journey.classList.remove("journey-armed");
        });
      }

      // hero'daki eğim için fare: sadece masaüstü, dokunmatiğe karışmıyoruz.
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
      const onPointer = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        labTargets.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
        labTargets.pointerY = (event.clientY / window.innerHeight) * 2 - 1;
      };
      if (fine.matches && !reduced) window.addEventListener("pointermove", onPointer, { passive: true });

      // sayfa içi linkler (hizmet rayı) sadece ziyaretçi isterse kayarak gidiyor.
      const onAnchor = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
        const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href^='#']");
        const id = link?.getAttribute("href")?.slice(1);
        const target = id ? document.getElementById(decodeURIComponent(id)) : null;
        if (!link || !target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", `#${id}`);
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      };
      main.addEventListener("click", onAnchor);

      // scrolltrigger yüklenince ve boyut değişince kendini yeniliyor, splittext de font
      // yüklenince satırları tekrar bölüyor.

      const onPhoneChange = () => recompute();
      phone.addEventListener("change", onPhoneChange);

      return () => {
        phone.removeEventListener("change", onPhoneChange);
        header?.removeAttribute("data-concealed");
        main.removeEventListener("click", onAnchor);
        window.removeEventListener("pointermove", onPointer);
        groups.forEach(({ group }) => (group.centers = []));
        cleanups.forEach((fn) => fn());
      };
    },
    { scope },
  );

  return <span ref={scope} hidden />;
}
