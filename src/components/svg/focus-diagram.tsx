"use client";

import { useEffect } from "react";

// ekrandaki paragrafın anlattığı mimari düğümleri vurguluyor.
export function FocusDiagram() {
  useEffect(() => {
    const diagram = document.querySelector<HTMLElement>("[data-focus-diagram]");
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-focus]"));
    if (!diagram || !sections.length) return;
    const nodes = Array.from(diagram.querySelectorAll<SVGGElement>("[data-node]"));
    const visible = new Map<Element, number>();
    const apply = () => {
      let best: HTMLElement | null = null;
      let ratio = 0;
      for (const [el, r] of visible) {
        if (r > ratio) {
          ratio = r;
          best = el as HTMLElement;
        }
      }
      const focus = new Set((best?.dataset.focus ?? "").split(" ").filter(Boolean));
      nodes.forEach((node) => node.classList.toggle("is-focus", focus.has(node.dataset.node ?? "")));
      sections.forEach((section) => section.classList.toggle("is-reading", section === best));
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target, entry.intersectionRatio);
          else visible.delete(entry.target);
        }
        apply();
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return null;
}
