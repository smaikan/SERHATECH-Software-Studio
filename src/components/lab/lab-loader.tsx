"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { ArchLayout, LabelData } from "./director/director";
import type { Quality } from "./engine/core";
import { MOTION_EVENT } from "@/components/motion-preference";
import { prefersReducedMotion } from "@/lib/motion/tokens";

const LabExperience = dynamic(() => import("./lab-experience"), { ssr: false });

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const ok = Boolean(gl);
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

function pickQuality(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const small = window.matchMedia("(max-width: 899px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return small || coarse || weak ? "B" : "A";
}

// webgl sahnesini sadece düzgün çalışabileceği zaman yüklüyor: sayfa etkileşime hazır
// olunca, webgl varsa ve hareket açıksa. yoksa svg sahneler kalıyor.
export function LabLoader({
  services,
  archs,
  compactArchs,
}: {
  services: LabelData[];
  archs: ArchLayout[];
  compactArchs: ArchLayout[];
}) {
  const [state, setState] = useState<{ on: boolean; quality: Quality }>({ on: false, quality: "B" });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let onLoad: (() => void) | undefined;
    let lastScroll = -Infinity;
    const onScroll = () => {
      lastScroll = performance.now();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const cancel = () => {
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer) clearTimeout(timer);
      if (onLoad) window.removeEventListener("load", onLoad);
      idle = timer = onLoad = undefined;
    };
    const evaluate = () => {
      cancel();
      if (prefersReducedMotion() || new URLSearchParams(location.search).has("static")) {
        setState((s) => ({ ...s, on: false }));
        return;
      }
      if (!webglAvailable()) return;
      const start = () => {
        // açılış birkaç uzun task yiyor, hızlı kaydırmanın ortasında asla başlatma.
        if (performance.now() - lastScroll < 250) {
          timer = setTimeout(start, 250);
          return;
        }
        cancel();
        setState({ on: true, quality: pickQuality() });
      };
      // svg çekirdek zaten ekranda. gpu sahnesi sayfa yüklenip ana thread sakinleşene kadar
      // bekliyor, ilk boyamayı geciktirmesin.
      const whenIdle = () => {
        if ("requestIdleCallback" in window) idle = window.requestIdleCallback(start, { timeout: 2500 });
        else timer = setTimeout(start, 600);
      };
      if (document.readyState === "complete") whenIdle();
      else {
        onLoad = whenIdle;
        window.addEventListener("load", whenIdle, { once: true });
      }
    };
    evaluate();
    media.addEventListener("change", evaluate);
    window.addEventListener(MOTION_EVENT, evaluate);
    return () => {
      cancel();
      window.removeEventListener("scroll", onScroll);
      media.removeEventListener("change", evaluate);
      window.removeEventListener(MOTION_EVENT, evaluate);
    };
  }, [failed]);

  if (!state.on || failed) return null;
  return (
    <LabExperience
      services={services}
      archs={archs}
      compactArchs={compactArchs}
      quality={state.quality}
      onFallback={() => setFailed(true)}
    />
  );
}
