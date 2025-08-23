"use client";

import { useEffect, useCallback } from 'react';
import { useSettingsStore } from '@/lib/settings';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useSettingsStore();

  // Function to apply theme consistently
  const applyTheme = useCallback((themeToApply: string) => {
    if (typeof window !== 'undefined') {
      const isDark = themeToApply === 'dark';
      
      // Set classes on both html and body
      document.documentElement.className = isDark ? 'dark' : 'light';
      document.body.className = isDark ? 'dark' : 'light';
      
      // Also set as data attribute for additional CSS targeting
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  }, []);

  // Apply theme when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Apply theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Apply the current theme
      applyTheme(theme);
    }
  }, [theme, applyTheme]);

  return <>{children}</>;
}
