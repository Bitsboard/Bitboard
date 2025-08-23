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
        
        // Force immediate application with multiple methods
        document.documentElement.style.display = 'none';
        document.documentElement.offsetHeight; // Trigger reflow
        document.documentElement.style.display = '';
        
        // Also force body reflow
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
        
        // Set up a periodic check to ensure theme persists
        const themeCheckInterval = setInterval(() => {
          const currentTheme = document.documentElement.className;
          if (currentTheme !== theme && (currentTheme === 'dark' || currentTheme === 'light')) {
            console.log('Theme check: reapplying', theme, 'over', currentTheme);
            document.documentElement.className = theme;
            document.body.className = theme;
            document.documentElement.setAttribute('data-theme', theme);
            document.body.setAttribute('data-theme', theme);
          }
        }, 100); // Check every 100ms
        
        // Cleanup interval after 5 seconds
        setTimeout(() => clearInterval(themeCheckInterval), 5000);
      } catch {}
    } catch {}
  }, []);
  return <>{children}</>;
}


