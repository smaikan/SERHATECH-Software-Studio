"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { site } from "@/config/site";
import {
  languageUrl,
  pathFor,
  text,
  type Locale,
  type PageKey,
} from "@/i18n/routing";
import { duration, ease } from "@/lib/motion/tokens";
import { BrandName, Mark } from "./ui";
import { ChargeLink } from "./motion-ui";

type NavItem = { href: string; label: string };

export function Header({ locale }: { locale: Locale }) {
  const path = usePathname();
  const navigation: NavItem[] = (
    [
      ["services", "Hizmetler", "Services"],
      ["work", "Çalışmalar", "Work"],
      ["about", "Hakkımda", "About"],
      ["process", "Süreç", "Process"],
    ] as const
  ).map(([page, tr, en]) => ({
    href: pathFor(locale, page),
    label: text(locale, tr, en),
  }));
  const other = locale === "tr" ? "en" : "tr";
  const languageLink = useRef<HTMLAnchorElement>(null);
  const header = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (languageLink.current)
      languageLink.current.href = languageUrl(window.location.href, other);
  }, [path, other]);

  // header altındaki bölümün ışığını alıyor (açık ya da koyu).
  useEffect(() => {
    const element = header.current;
    if (!element) return;
    let observer: IntersectionObserver | undefined;
    const update = () => {
      observer?.disconnect();
      const line = element.offsetHeight / 2;
      const bays = document.querySelectorAll<HTMLElement>("main [data-theme='bay']");
      const hits = new Set<Element>();
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) hits.add(entry.target);
            else hits.delete(entry.target);
          }
          element.dataset.theme = hits.size ? "bay" : "day";
        },
        { rootMargin: `-${line}px 0px -${window.innerHeight - line - 1}px 0px` },
      );
      bays.forEach((bay) => observer?.observe(bay));
      if (!bays.length) element.dataset.theme = "day";
    };
    update();
    const onScroll = () =>
      element.toggleAttribute("data-raised", window.scrollY > 8);
    onScroll();
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(update, 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      observer?.disconnect();
      clearTimeout(resizeTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [path]);

  const isCurrent = (href: string) =>
    path === href || (href !== pathFor(locale, "home") && path.startsWith(`${href}/`));

  return (
    <header ref={header} className="site-header" data-theme="day">
      <div className="header-inner container">
        <Link
          prefetch={false}
          href={pathFor(locale, "home")}
          className="brand"
          aria-label={text(locale, `${site.name} ana sayfa`, `${site.name} home`)}
        >
          <Mark />
          <BrandName />
        </Link>
        <nav
          className="desktop-nav"
          aria-label={text(locale, "Ana navigasyon", "Main navigation")}
        >
          {navigation.map((item) => (
            <Link
              prefetch={false}
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <a
            ref={languageLink}
            className="language-switch"
            href={languageUrl(path, other)}
            hrefLang={other}
            lang={other}
            aria-label={other === "en" ? "Switch to English" : "Türkçeye geç"}
            onClick={(event) => {
              event.currentTarget.href = languageUrl(window.location.href, other);
            }}
          >
            {other.toUpperCase()}
          </a>
          <ChargeLink href={pathFor(locale, "contact")} className="header-contact">
            {text(locale, "Projenizi konuşalım", "Let’s talk")}
          </ChargeLink>
          <button
            ref={button}
            type="button"
            className="menu-toggle"
            aria-label={text(locale, "Menüyü aç", "Open menu")}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open ? (
          <MobileMenu
            locale={locale}
            path={path}
            items={[
              ...navigation,
              ...(
                [["contact", "İletişim", "Contact"]] as [PageKey, string, string][]
              ).map(([page, tr, en]) => ({
                href: pathFor(locale, page),
                label: text(locale, tr, en),
              })),
            ]}
            onClose={() => setOpen(false)}
            onClosed={() => button.current?.focus()}
          />
        ) : null}
      </AnimatePresence>
    </header>
  );
}

const panel = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  shown: {
    clipPath: "inset(0 0 0% 0)",
    transition: { duration: 0.46, ease: ease.enter.bezier, staggerChildren: 0.045, delayChildren: 0.12 },
  },
  exit: {
    clipPath: "inset(0 0 100% 0)",
    transition: { duration: duration.ui, ease: ease.scene.bezier },
  },
};
const row = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: ease.enter.bezier } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

function MobileMenu({
  locale,
  path,
  items,
  onClose,
  onClosed,
}: {
  locale: Locale;
  path: string;
  items: NavItem[];
  onClose: () => void;
  onClosed: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closed = useRef(onClosed);
  useEffect(() => {
    closed.current = onClosed;
  }, [onClosed]);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = original;
      // modal kapanıp çıkış animasyonu bitmeden odak dışarı çıkamıyor.
      closed.current();
    };
  }, []);
  return (
    <m.dialog
      ref={dialog}
      id="mobile-menu"
      className="mobile-menu"
      data-theme="bay"
      aria-label={text(locale, "Ana menü", "Main menu")}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      variants={panel}
      initial="hidden"
      animate="shown"
      exit="exit"
    >
      <div className="mobile-menu-top container">
        <span className="brand">
          <Mark />
          <BrandName />
        </span>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label={text(locale, "Menüyü kapat", "Close menu")}
        >
          <X size={22} />
        </button>
      </div>
      <nav
        className="mobile-nav container"
        aria-label={text(locale, "Mobil navigasyon", "Mobile navigation")}
      >
        {/* bu linkler sadece menü açıkken var, yani o dokunuşta prefetch ediliyorlar, sayfa
           yüklenirken değil. bütün sayfalar önceden üretilmiş olduğu için prefetch sadece
           hazır veri, sonraki dokunuşta sunucuya tekrar gidilmiyor. */}
        {items.map((item) => (
          <m.div key={item.href} variants={row}>
            <Link
              prefetch
              href={item.href}
              aria-current={path === item.href ? "page" : undefined}
              onClick={onClose}
            >
              <span>{item.label}</span>
              <ArrowUpRight size={22} aria-hidden="true" />
            </Link>
          </m.div>
        ))}
      </nav>
      <m.div className="mobile-menu-foot container" variants={row}>
        <a href={`mailto:${site.email}`}>{site.email}</a>
        <p>
          {text(locale, site.descriptor, "Independent software & systems studio")}
          <br />
          Türkiye
        </p>
      </m.div>
    </m.dialog>
  );
}
