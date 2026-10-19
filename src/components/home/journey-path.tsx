"use client";

import { useEffect, useRef } from "react";

export const JOURNEY_LAYOUT = "serhatech:journey-layout";

// çizgi boyunca eşit aralıklı noktaların yüksekliği (track pikseli). böylece kaydırma
// "çizginin ne kadarı bu yüksekliğin üstünde" diye layout'a dokunmadan sorabiliyor.
export const journeyHeights = new WeakMap<SVGSVGElement, Float32Array>();

type Point = { x: number; y: number };

// yol duraklarının arasından akan çizgiyi çiziyor. geometriyi sadece layout değişince
// ölçüyoruz (mount, resize, fontlar), kaydırma döngüsü layout okumuyor.
export function JourneyPath() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    const track = svg?.parentElement;
    if (!svg || !track) return;
    const base = svg.querySelector<SVGPathElement>(".journey-line-base")!;
    const line = svg.querySelector<SVGPathElement>(".journey-line")!;
    let frame = 0;

    const build = () => {
      const tr = track.getBoundingClientRect();
      const stops = Array.from(track.querySelectorAll<HTMLElement>(".journey-stop"));
      const nodes: Point[] = stops.map((stop) => {
        const r = stop.querySelector(".journey-node")!.getBoundingClientRect();
        return { x: r.left + r.width / 2 - tr.left, y: r.top + r.height / 2 - tr.top };
      });
      // her durağın yazısının dikey alanı, çizgi sadece boşluklarda kıvrılsın diye.
      const copies = stops.map((stop) => {
        const r = stop.querySelector(".journey-copy")!.getBoundingClientRect();
        return { top: r.top - tr.top, bottom: r.bottom - tr.top };
      });
      if (!nodes.length || !tr.width) return;
      // alt alta düzen (telefon): bütün düğümler aynı dikey çizgide.
      const compact = nodes.every((node) => Math.abs(node.x - nodes[0].x) < 4);
      svg.setAttribute("viewBox", `0 0 ${tr.width.toFixed(0)} ${tr.height.toFixed(0)}`);
      const f = (n: number) => n.toFixed(1);
      const start = { x: nodes[0].x, y: Math.max(0, nodes[0].y - 90) };
      let d = `M${f(start.x)} ${f(start.y)}L${f(nodes[0].x)} ${f(nodes[0].y)}`;
      for (let i = 1; i < nodes.length; i++) {
        const a = nodes[i - 1];
        const b = nodes[i];
        if (compact) {
          // dar ekran: yazı sütununun yanında hafif bir dalga.
          const dy = b.y - a.y;
          const sway = i % 2 ? 22 : -22;
          d += `C${f(a.x + sway)} ${f(a.y + dy * 0.35)} ${f(b.x + sway)} ${f(b.y - dy * 0.35)} ${f(b.x)} ${f(b.y)}`;
          continue;
        }
        // geniş ekran: önceki yazının altına in, boşluktan karşıya geç, yukarıdan gel.
        const ya = Math.min(Math.max(a.y + 24, copies[i - 1].bottom + 22), b.y - 60);
        const yb = Math.max(ya + 40, Math.min(b.y - 24, copies[i].top - 14));
        const mid = (ya + yb) / 2;
        d += `L${f(a.x)} ${f(ya)}C${f(a.x)} ${f(mid)} ${f(b.x)} ${f(mid)} ${f(b.x)} ${f(yb)}L${f(b.x)} ${f(b.y)}`;
      }
      const last = nodes[nodes.length - 1];
      d += `L${f(last.x)} ${f(last.y + 70)}`;
      base.setAttribute("d", d);
      line.setAttribute("d", d);

      // her durağın çizginin neresinde olduğu (çizgi hep aşağı doğru gidiyor).
      const total = line.getTotalLength();
      stops.forEach((stop, i) => {
        let lo = 0;
        let hi = total;
        for (let k = 0; k < 22; k++) {
          const mid = (lo + hi) / 2;
          if (line.getPointAtLength(mid).y < nodes[i].y) lo = mid;
          else hi = mid;
        }
        stop.dataset.at = (lo / total).toFixed(4);
      });
      const samples = Math.min(Math.max(Math.ceil(total / 4), 2), 2400);
      const heights = new Float32Array(samples);
      for (let k = 0; k < samples; k++)
        heights[k] = line.getPointAtLength((total * k) / (samples - 1)).y;
      journeyHeights.set(svg, heights);
      svg.dataset.length = total.toFixed(1);
      window.dispatchEvent(new Event(JOURNEY_LAYOUT));
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(build);
    };
    build();
    const observer = new ResizeObserver(schedule);
    observer.observe(track);
    document.fonts?.ready.then(schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <svg ref={ref} className="journey-path" aria-hidden="true" preserveAspectRatio="none">
      <path className="journey-line-base" />
      <path className="journey-line" pathLength={1} />
      <circle className="journey-tip" r="5" />
    </svg>
  );
}
