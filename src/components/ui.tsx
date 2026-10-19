import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { ChargeLink } from "./motion-ui";
import { site } from "@/config/site";

// marka işareti: iki çizim de html'de var, css yüzeye uygun olanı gösteriyor.
// gündüz yüzeylerinde logo-dark, [data-theme="bay"] içinde logo-light. kaynak dosyalar
// design/brand'de, bu boyutları scripts/build-brand.py üretiyor (36px taban).
const markSet = (tone: "dark" | "light") =>
  `/brand/logo-${tone}-36.webp 1x, /brand/logo-${tone}-72.webp 2x, /brand/logo-${tone}-108.webp 3x`;

export function Mark({ className = "" }: { className?: string }) {
  return (
    <span className={`mark ${className}`} aria-hidden="true">
      {(["dark", "light"] as const).map((tone) => (
        // dosyalar zaten boyutlu ve density srcset var, image optimizer burada bir şey katmıyor.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={tone}
          className={`mark-${tone}`}
          src={`/brand/logo-${tone}-36.webp`}
          srcSet={markSet(tone)}
          width={36}
          height={36}
          alt=""
          decoding="async"
        />
      ))}
    </span>
  );
}

// yazı logosu: isim oxanium büyük harflerle (chrome.css). gündüz yüzeylerinde sondaki
// "tech" tema turuncusu oluyor, bay yüzeylerinde ismin hepsi beyaz kalıyor. dom'da
// yazı olduğu gibi duruyor, tek kelime olarak okunuyor.
export function BrandName() {
  const name = site.name;
  const split = /tech$/i.test(name) ? name.length - 4 : name.length;
  return (
    <span className="brand-name">
      {name.slice(0, split)}
      {split < name.length ? <span className="brand-name-accent">{name.slice(split)}</span> : null}
    </span>
  );
}

export function ActionLink({
  href,
  children,
  secondary = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
  className?: string;
}) {
  return (
    <ChargeLink
      href={href}
      variant={secondary ? "secondary" : "primary"}
      className={className}
    >
      {children}
    </ChargeLink>
  );
}

export function TextLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link prefetch={false} className={`text-link ${className}`} href={href}>
      <span>{children}</span>
      <ArrowUpRight size={18} aria-hidden="true" />
    </Link>
  );
}

export function PageIntro({
  label,
  title,
  description,
  aside,
}: {
  label: string;
  title: ReactNode;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <header className="page-intro surface-day">
      <div className="container page-intro-grid">
        <div className="page-intro-copy">
          <p className="readout">{label}</p>
          <h1>{title}</h1>
          <p className="lead">{description}</p>
        </div>
        {aside ? <div className="page-intro-aside">{aside}</div> : null}
      </div>
    </header>
  );
}
