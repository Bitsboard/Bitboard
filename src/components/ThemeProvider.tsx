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
      
      // Force a repaint to ensure theme is applied
      document.documentElement.style.display = 'none';
      document.documentElement.offsetHeight; // Trigger reflow
      document.documentElement.style.display = '';
    }
  }, []);

  // Apply theme when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Apply theme on mount and also check for theme overrides
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Apply the current theme
      applyTheme(theme);
      
      // Set up a mutation observer to watch for theme class changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const target = mutation.target as Element;
            const currentTheme = target.className;
            if (currentTheme !== theme && (currentTheme === 'dark' || currentTheme === 'light')) {
              // Theme was overridden, reapply our theme
              console.log('Theme was overridden, reapplying:', theme);
              applyTheme(theme);
            }
          }
        });
      });
      
      // Observe both html and body elements
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      
      // Cleanup observer
      return () => observer.disconnect();
    }
  }, [theme, applyTheme]);

  return <>{children}</>;
}
