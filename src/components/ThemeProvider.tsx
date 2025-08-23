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

  // Apply theme on mount and set up lightweight persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Apply the current theme
      applyTheme(theme);
      
      // Set up a simple theme persistence check that runs only when needed
      const checkThemePersistence = () => {
        const currentTheme = document.documentElement.className;
        if (currentTheme !== theme && (currentTheme === 'dark' || currentTheme === 'light')) {
          // Theme was changed externally, reapply our theme
          applyTheme(theme);
        }
      };
      
      // Check theme persistence on focus (when user returns to tab)
      const handleFocus = () => {
        // Small delay to ensure DOM is ready
        setTimeout(checkThemePersistence, 100);
      };
      
      // Check theme persistence on visibility change
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          setTimeout(checkThemePersistence, 100);
        }
      };
      
      // Add event listeners for theme persistence
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Cleanup event listeners
      return () => {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [theme, applyTheme]);

  return <>{children}</>;
}
