"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LazyMotion, MotionConfig, m } from "motion/react";
import type { ReactNode } from "react";
import { duration, ease } from "@/lib/motion/tokens";

// animasyon motoru sayfa yüklenip ana thread boşalınca geliyor, ilk boyamanın yolunda
// değil. o zamana kadar m bileşenleri ilk hallerini gösteriyor, o da zaten durgun
// halleri. hydration ortasında gelseydi kökteki güncellemesi react'i hydration'ı tek
// uzun bir task'ta bitirmeye zorlardı.
function settled() {
  return new Promise<void>((resolve) => {
    const idle = () => {
      if ("requestIdleCallback" in window) window.requestIdleCallback(() => resolve(), { timeout: 1500 });
      else setTimeout(resolve, 300);
    };
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  });
}
const loadFeatures = () =>
  settled()
    .then(() => import("./motion-features"))
    .then((mod) => mod.default);

// motion sadece küçük arayüz tepkilerini yapıyor (butonlar, menü, form durumları).
// sahne ve svg koreografisi gsap'te, ikisi aynı özelliği asla paylaşmıyor.
export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

const MotionLink = m.create(Link);

const charge = {
  rest: { scaleX: 0, transition: { duration: duration.ui, ease: ease.micro.bezier } },
  hover: { scaleX: 1, transition: { duration: duration.enter, ease: ease.enter.bezier } },
};
const arrow = {
  rest: { x: 0, y: 0 },
  hover: { x: 3, y: -3 },
};

export function ChargeLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <MotionLink
      prefetch={false}
      href={href}
      className={`btn btn-${variant} ${className}`}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
      whileTap={{ scale: 0.985 }}
      transition={{ duration: duration.micro, ease: ease.micro.bezier }}
    >
      <m.span className="btn-charge" variants={charge} aria-hidden="true" />
      <span>{children}</span>
      <m.span
        className="btn-icon"
        variants={arrow}
        transition={{ duration: duration.micro, ease: ease.micro.bezier }}
      >
        <ArrowUpRight size={18} aria-hidden="true" />
      </m.span>
    </MotionLink>
  );
}
