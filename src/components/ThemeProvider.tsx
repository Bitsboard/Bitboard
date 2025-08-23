"use client";

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/settings';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useSettingsStore();

  useEffect(() => {
    // Ensure theme is applied to document as soon as possible
    if (typeof window !== 'undefined') {
      const isDark = theme === 'dark';
      
      // Remove both classes first to ensure clean state
      document.documentElement.classList.remove('dark', 'light');
      
      // Add the correct class
      if (isDark) {
        document.documentElement.classList.add('dark');
        // Also set body class for additional safety
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        // Also set body class for additional safety
        document.body.classList.add('light');
        document.body.classList.remove('dark');
      }
      
      // Force a repaint to ensure theme is applied
      document.documentElement.style.display = 'none';
      document.documentElement.offsetHeight; // Trigger reflow
      document.documentElement.style.display = '';
    }
  }, [theme]);

  // Also apply theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = theme === 'dark';
      document.documentElement.classList.remove('dark', 'light');
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.body.classList.add('light');
        document.body.classList.remove('dark');
      }
    }
  }, []);

  return <>{children}</>;
}
