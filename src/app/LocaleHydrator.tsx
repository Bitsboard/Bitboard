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
        const theme = localStorage.getItem('theme') || 'dark'; // Default to dark
        
        // Apply theme immediately using className for immediate effect
        document.documentElement.className = theme;
        document.body.className = theme;
        
        // Also set as data attribute
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        
        // Apply theme immediately and set up aggressive persistence
        const checkThemePersistence = () => {
          const currentTheme = document.documentElement.className;
          if (currentTheme !== theme && (currentTheme === 'dark' || currentTheme === 'light')) {
            document.documentElement.className = theme;
            document.body.className = theme;
            document.documentElement.setAttribute('data-theme', theme);
            document.body.setAttribute('data-theme', theme);
          }
        };
        
        // Check theme persistence aggressively during initial load
        const initialChecks = [50, 100, 200, 500, 1000, 2000, 3000, 5000]; // More frequent checks
        initialChecks.forEach(delay => {
          setTimeout(checkThemePersistence, delay);
        });
        
        // Also check every 200ms for the first 5 seconds
        const themeCheckInterval = setInterval(checkThemePersistence, 200);
        setTimeout(() => clearInterval(themeCheckInterval), 5000);
      } catch {}
    } catch {}
  }, []);
  return <>{children}</>;
}


