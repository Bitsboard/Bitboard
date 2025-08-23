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

  // Apply theme on mount and set up aggressive persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Apply the current theme
      applyTheme(theme);
      
      // Set up aggressive theme persistence that runs frequently but efficiently
      const checkThemePersistence = () => {
        const currentTheme = document.documentElement.className;
        if (currentTheme !== theme && (currentTheme === 'dark' || currentTheme === 'light')) {
          // Theme was changed externally, reapply our theme
          applyTheme(theme);
        }
      };
      
      // Check theme persistence every 500ms for the first 10 seconds
      const themeCheckInterval = setInterval(checkThemePersistence, 500);
      
      // Stop checking after 10 seconds to avoid performance impact
      setTimeout(() => {
        clearInterval(themeCheckInterval);
      }, 10000);
      
      // Also check on various events
      const handleFocus = () => checkThemePersistence();
      const handleVisibilityChange = () => {
        if (!document.hidden) checkThemePersistence();
      };
      const handleScroll = () => checkThemePersistence();
      
      // Add event listeners
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Cleanup
      return () => {
        clearInterval(themeCheckInterval);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [theme, applyTheme]);

  return <>{children}</>;
}
