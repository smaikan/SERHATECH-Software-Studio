"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// gsap ve scrolltrigger sayfa yüklenip ana thread boşalınca geliyor. sayfa onlarsız
// da tamam ve okunabilir.
const HomeChoreography = dynamic(
  () => import("./home-choreography").then((m) => m.HomeChoreography),
  { ssr: false },
);

export function HomeClient() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let idle: number | undefined;
    const start = () => {
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(() => setReady(true), { timeout: 1200 });
      else setReady(true);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, []);
  return ready ? <HomeChoreography /> : null;
}
