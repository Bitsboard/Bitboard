"use client";

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/settings';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useSettingsStore();

  useEffect(() => {
    // Ensure theme is applied to document as soon as possible
    if (typeof window !== 'undefined') {
      const isDark = theme === 'dark';
      const currentlyDark = document.documentElement.classList.contains('dark');
      
      if (isDark !== currentlyDark) {
        document.documentElement.classList.toggle('dark', isDark);
      }
    }
  }, [theme]);

  return <>{children}</>;
}
