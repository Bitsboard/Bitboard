"use client";

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/settings';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useSettingsStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Apply theme immediately
      const isDark = theme === 'dark';
      
      // Set classes on both html and body
      document.documentElement.className = isDark ? 'dark' : 'light';
      document.body.className = isDark ? 'dark' : 'light';
      
      // Also set as data attribute for additional CSS targeting
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  }, [theme]);

  // Apply theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = theme === 'dark';
      document.documentElement.className = isDark ? 'dark' : 'light';
      document.body.className = isDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  }, []);

  return <>{children}</>;
}
