"use client";

import { useEffect } from "react";
import { getLang, setLang } from "@/lib/i18n";

export function LocaleHydrator({ children }: { children: React.ReactNode }) {
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
      
      // Always restore persisted UI prefs (theme/layout/unit) regardless of locale
      try {
        const theme = localStorage.getItem('theme');
        
        // Remove any existing theme classes first
        document.documentElement.classList.remove('dark', 'light');
        document.body.classList.remove('dark', 'light');
        
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.add('light');
          document.body.classList.add('light');
        } else {
          // If no theme is saved, default to dark mode
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
        }
        
        // Force immediate application
        document.documentElement.style.display = 'none';
        document.documentElement.offsetHeight; // Trigger reflow
        document.documentElement.style.display = '';
      } catch {}
    } catch {}
  }, []);
  return <>{children}</>;
}


