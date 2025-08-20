"use client";

import { useEffect } from "react";

export default function ThemeHydrator() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      const isDark = saved ? saved === 'dark' : document.documentElement.classList.contains('dark');
      document.documentElement.classList.toggle('dark', isDark);
    } catch {}
    const onTheme = (e: Event) => {
      const d = (e as CustomEvent).detail as 'dark' | 'light' | undefined;
      if (!d) return;
      try { document.documentElement.classList.toggle('dark', d === 'dark'); } catch {}
    };
    window.addEventListener('bb:theme', onTheme as EventListener);
    return () => window.removeEventListener('bb:theme', onTheme as EventListener);
  }, []);
  return null;
}


