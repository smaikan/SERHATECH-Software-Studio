"use client";

import { useSyncExternalStore } from "react";
import { text, type Locale } from "@/i18n/routing";

const KEY = "serhatdev-motion";
export const MOTION_EVENT = "serhatdev:motion";

function subscribe(callback: () => void) {
  window.addEventListener(MOTION_EVENT, callback);
  return () => window.removeEventListener(MOTION_EVENT, callback);
}
const read = () => document.documentElement.dataset.motion === "reduced";

// işletim sistemi ayarına dokunmamış ziyaretçi de siteyi sakinleştirebilsin diye.
export function MotionPreference({ locale }: { locale: Locale }) {
  const reduced = useSyncExternalStore(subscribe, read, () => false);
  return (
    <button
      type="button"
      className="motion-toggle"
      aria-pressed={reduced}
      onClick={() => {
        const next = !reduced;
        if (next) document.documentElement.dataset.motion = "reduced";
        else delete document.documentElement.dataset.motion;
        try {
          if (next) localStorage.setItem(KEY, "reduced");
          else localStorage.removeItem(KEY);
        } catch {}
        window.dispatchEvent(new Event(MOTION_EVENT));
      }}
    >
      {text(locale, "Hareketi azalt", "Reduce motion")}
    </button>
  );
}

// inline, ilk boyamadan önce: kayıtlı tercihi yanıp sönme olmadan uyguluyor.
export const motionPreferenceScript = `try{if(localStorage.getItem("${KEY}")==="reduced")document.documentElement.dataset.motion="reduced"}catch(e){}`;
