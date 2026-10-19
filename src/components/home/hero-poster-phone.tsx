"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { heroSettle } from "@/components/lab/director/store";
import { prefersReducedMotion } from "@/lib/motion/tokens";

// telefonda: canlı sahne gelene kadar görünen sabit çekirdek, canlı çizimin yapacağı
// hareketin aynısını yapıyor (director.ts). butonların hemen üstünden başlıyor, sayfa
// kaydıkça yavaşça hero alanına iniyor. hero ile birlikte hydrate oluyor, yani gsap
// ya da webgl yüklenmesini beklemeden ilk kaydırmada hareket ediyor.
export function HeroPosterPhone({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const poster = ref.current;
    const stage = document.querySelector<HTMLElement>(".hero-stage");
    if (!poster || !stage) return;
    const phone = window.matchMedia("(max-width: 899px)");
    let travel = 0;
    let frame = 0;
    const place = () => {
      frame = 0;
      const offset = phone.matches && !prefersReducedMotion() ? heroSettle(window.scrollY, travel) : 0;
      poster.style.transform = offset ? `translate3d(0, ${offset.toFixed(1)}px, 0)` : "";
    };
    // layout'u sadece değişmiş olabileceği zaman okuyoruz, kaydırırken asla.
    const measure = () => {
      poster.style.transform = "";
      const p = poster.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      travel = Math.max(s.top + s.height / 2 - (p.top + p.height / 2), 0);
      place();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(document.documentElement);
    window.addEventListener("scroll", onScroll, { passive: true });
    phone.addEventListener("change", measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      phone.removeEventListener("change", measure);
      poster.style.transform = "";
    };
  }, []);

  return (
    <div ref={ref} className="hero-poster-phone" aria-hidden="true">
      {children}
    </div>
  );
}
