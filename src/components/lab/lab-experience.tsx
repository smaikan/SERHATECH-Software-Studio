"use client";

import { useEffect, useRef } from "react";
import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { gsap } from "gsap";
import { buildCore, type Quality } from "./engine/core";
import { createDirector, type ArchLayout, type IntroState, type LabelData } from "./director/director";
import { labTargets } from "./director/targets";
import { createStageTracker } from "./director/stage-tracker";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion as reduced } from "@/lib/motion/tokens";

export type LabExperienceProps = {
  services: LabelData[];
  archs: ArchLayout[];
  compactArchs: ArchLayout[];
  quality: Quality;
  onFallback: () => void;
};

// sitedeki tek webgl sahnesi: içeriğin arkasında sabit, şeffaf bir canvas. çekirdek
// hangi sahnedeyse kadraj ona göre ayarlanıyor.
export default function LabExperience({
  services,
  archs,
  compactArchs,
  quality,
  onFallback,
}: LabExperienceProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const measureSmallRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef(onFallback);
  useEffect(() => {
    fallbackRef.current = onFallback;
  }, [onFallback]);

  useEffect(() => {
    const layer = layerRef.current;
    const hud = hudRef.current;
    const measure = measureRef.current;
    const measureSmall = measureSmallRef.current;
    if (!layer || !hud || !measure || !measureSmall) return;
    // her mount'ta yeni canvas. cleanup'ta kaybolan context bir daha kullanılamıyor.
    const canvas = document.createElement("canvas");
    canvas.className = "lab-canvas";
    layer.insertBefore(canvas, hud);

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: quality === "A",
        powerPreference: "high-performance",
        premultipliedAlpha: true,
      });
    } catch {
      canvas.remove();
      fallbackRef.current();
      return;
    }
    const maxRatio = quality === "A" ? 2 : 1.5;
    let pixelRatio = Math.min(window.devicePixelRatio || 1, maxRatio);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);

    const scene = new Scene();
    const camera = new PerspectiveCamera(30, 1, 0.1, 100);
    const core = buildCore(quality, pixelRatio);
    scene.add(core.group);

    const size = { width: 1, height: 1, small: 1 };
    const applySize = () => {
      size.width = document.documentElement.clientWidth;
      size.height = measure.offsetHeight || window.innerHeight;
      size.small = measureSmall.offsetHeight || window.innerHeight;
      renderer.setSize(size.width, size.height, false);
      camera.aspect = size.width / size.height;
      for (const set of core.lineSets) set.material.resolution.set(size.width, size.height);
    };
    applySize();

    const intro: IntroState = {
      hud: 0,
      draw: core.modules.map(() => 0),
      assemble: core.modules.map(() => 0),
      ignite: 0,
      signal: 0,
      idle: 0,
    };

    const stages = {
      hero: document.querySelector<HTMLElement>("[data-stage='hero']"),
      services: document.querySelector<HTMLElement>("[data-stage='services']"),
      work: document.querySelector<HTMLElement>("[data-stage='work']"),
    };
    const tracker = createStageTracker(stages);
    // telefonda: hero çizimi ilk butonun hemen üstünden başlıyor, üstteki yazı açık
    // kalsın diye. butonun sayfadaki yerini sahnelerle birlikte ölçüyoruz.
    const heroActions = document.querySelector<HTMLElement>(".hero-actions");
    let heroAnchor: number | null = null;
    const measureAnchor = () => {
      heroAnchor = heroActions ? heroActions.getBoundingClientRect().top + window.scrollY : null;
    };
    measureAnchor();
    // kaydırma konumunu pasif bir listener'dan alıyoruz. karenin içinde scrollY okusak
    // önceki karenin dom yazmalarından sonra zorunlu layout olurdu.
    const scroll = { y: window.scrollY };
    let lastScroll = 0;
    const onScroll = () => {
      scroll.y = window.scrollY;
      lastScroll = performance.now();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const labels = Array.from(hud.querySelectorAll<HTMLElement>("[data-label]"));
    const compactQuery = window.matchMedia("(max-width: 899px)");

    const director = createDirector({
      renderer,
      scene,
      camera,
      core,
      targets: labTargets,
      intro,
      stageRect: (name) => tracker.rect(name, scroll.y),
      heroAnchor: () =>
        heroAnchor === null ? null : { top: heroAnchor - scroll.y, scrolled: scroll.y },
      labels,
      services,
      archs,
      compactArchs,
      canvas,
      size: () => size,
      compact: () => compactQuery.matches,
    });

    // intro: teknik çizgiler → modüller yerine oturuyor → reaktör yanıyor → ilk sinyal.
    // boşta katmanı bunun altında yavaşça açılıyor, intro bitince "tık" diye geçiş olmuyor.
    const introTl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
    introTl.to(intro, { hud: 1, duration: 0.9, ease: "power1.inOut" }, 0);
    core.modules.forEach((_, i) => {
      introTl.to(intro.draw, { [i]: 1, duration: 0.8 }, 0.12 + i * 0.07);
      introTl.to(intro.assemble, { [i]: 1, duration: 0.95, ease: "expo.out" }, 0.42 + i * 0.06);
    });
    introTl
      .to(intro, { ignite: 1, duration: 0.7, ease: "power3.inOut" }, 1.05)
      .to(intro, { signal: 1, duration: 0.6 }, 1.5)
      .to(intro, { idle: 1, duration: 1.4, ease: "sine.inOut" }, 1.35);
    if (reduced()) introTl.progress(1);

    // kare süresi kontrolü: kare atlamak yerine kaliteyi düşürüyor.
    let ema = 16;
    let slowFor = 0;
    let started = false;
    let disposed = false;
    // telefonda boşta duran sahne (bir süredir kaydırma yoksa) yarı hızda çalışıyor.
    // hareket zaten yavaş olduğu için fark edilmiyor, pil ve işlemci yükü yarıya iniyor.
    let pending = 0;
    let frame = 0;
    const tick = (_time: number, deltaMs: number) => {
      if (disposed) return;
      pending += deltaMs;
      frame++;
      const idleScene =
        quality === "B" && started && introTl.progress() >= 1 && performance.now() - lastScroll > 500;
      if (idleScene && frame % 2) return;
      const dt = pending / 1000;
      pending = 0;
      director.update(dt);
      if (!started) {
        started = true;
        document.documentElement.classList.add("lab-on");
        canvas.dataset.ready = "true";
        introTl.play();
        return;
      }
      if (introTl.progress() < 1 || document.hidden) return;
      ema = ema * 0.94 + Math.min(deltaMs, 100) * 0.06; // her rAF'te, yarı hızdan bağımsız
      if (ema > (quality === "A" ? 24 : 34)) slowFor += dt;
      else slowFor = Math.max(0, slowFor - dt * 0.5);
      if (slowFor > 2.5) {
        slowFor = 0;
        if (pixelRatio > 1.01) {
          pixelRatio = Math.max(1, pixelRatio - 0.35);
          renderer.setPixelRatio(pixelRatio);
          applySize();
        } else {
          fallbackRef.current();
        }
      }
    };
    // bütün programları kritik yolun dışında derle (destekleniyorsa paralel).
    renderer
      .compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (!disposed) gsap.ticker.add(tick);
      });

    let lastW = size.width;
    let lastH = size.height;
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const w = document.documentElement.clientWidth;
        const h = measure.offsetHeight;
        // 120px altındaki sadece yükseklik değişimleri mobil araç çubuğu, onları boşver.
        if (w === lastW && Math.abs(h - lastH) < 120) return;
        lastW = w;
        lastH = h;
        applySize();
      }, 120);
    };
    window.addEventListener("resize", onResize);
    // sahne geometrisi layout değişimlerini (fontlar, resize) scrolltrigger refresh'i
    // üzerinden takip ediyor.
    const remeasure = () => {
      size.small = measureSmall.offsetHeight || window.innerHeight;
      tracker.measure();
      measureAnchor();
      scroll.y = window.scrollY;
    };
    ScrollTrigger.addEventListener("refresh", remeasure);

    const onLost = (event: Event) => {
      event.preventDefault();
      fallbackRef.current();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      disposed = true;
      gsap.ticker.remove(tick);
      introTl.kill();
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      ScrollTrigger.removeEventListener("refresh", remeasure);
      window.removeEventListener("scroll", onScroll);
      canvas.removeEventListener("webglcontextlost", onLost);
      document.documentElement.classList.remove("lab-on");
      core.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [quality, services, archs, compactArchs]);

  return (
    <div ref={layerRef} className="lab-layer" aria-hidden="true">
      <div ref={measureRef} className="lab-measure" />
      <div ref={measureSmallRef} className="lab-measure lab-measure-small" />
      <div ref={hudRef} className="lab-hud">
        {services.map((_, i) => (
          <div key={i} className="hud-label" data-label={i} style={{ opacity: 0 }}>
            <span className="hud-label-line" />
            <span className="hud-label-text">
              <span data-title />
              <span data-sub />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
