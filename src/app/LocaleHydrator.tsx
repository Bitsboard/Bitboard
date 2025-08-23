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
        // First, ensure dark mode is set to prevent light mode flash
        document.documentElement.className = 'dark';
        document.body.className = 'dark';
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.setAttribute('data-theme', 'dark');
        
        // Then get the actual theme from localStorage
        const theme = localStorage.getItem('theme') || 'dark'; // Default to dark
        
        // Apply the actual theme immediately
        document.documentElement.className = theme;
        document.body.className = theme;
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        
        // Set up aggressive theme persistence
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
        const initialChecks = [10, 25, 50, 100, 200, 500, 1000, 2000, 3000, 5000]; // Even more frequent
        initialChecks.forEach(delay => {
          setTimeout(checkThemePersistence, delay);
        });
        
        // Also check every 100ms for the first 5 seconds (more aggressive)
        const themeCheckInterval = setInterval(checkThemePersistence, 100);
        setTimeout(() => clearInterval(themeCheckInterval), 5000);
      } catch {}
    } catch {}
  }, []);
  return <>{children}</>;
}


