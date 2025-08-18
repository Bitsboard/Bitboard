"use client";

import { useEffect } from "react";
import { getLang, setLang } from "@/lib/i18n";

export function LocaleHydrator() {
  useEffect(() => {
    try {
      const known = ["en", "fr", "es", "de"] as const;
      const first = window.location.pathname.split("/").filter(Boolean)[0];
      if (first && (known as readonly string[]).includes(first)) {
        // @ts-ignore
        if (first !== getLang()) setLang(first as any);
        document.documentElement.lang = first;
      }
    } catch {}
  }, []);
  return null;
}


