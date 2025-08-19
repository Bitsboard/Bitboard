"use client";

import { useEffect } from "react";
import { getLang, setLang } from "@/lib/i18n";

export function LocaleHydrator() {
  useEffect(() => {
    try {
      const known = ["en", "fr", "es", "de"] as const;
      const first = window.location.pathname.split("/").filter(Boolean)[0];
      if (first && (known as readonly string[]).includes(first)) {
        // Always set the runtime lang to match the URL immediately
        // @ts-ignore
        setLang(first as any);
        try { localStorage.setItem('lang', first); } catch {}
        document.documentElement.lang = first;
      }
    } catch {}
  }, []);
  return null;
}


