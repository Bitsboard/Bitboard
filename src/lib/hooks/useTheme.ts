import { useState, useEffect, useCallback } from 'react';
import { themeManager, type Theme } from '../themeManager';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => themeManager.getTheme());

  useEffect(() => {
    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe((newTheme) => {
      setThemeState(newTheme);
    });

    // Initialize theme if not already done
    if (!themeManager.getInitializedStatus()) {
      themeManager.initialize();
    }

    return unsubscribe;
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    themeManager.setTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    themeManager.toggleTheme();
  }, []);

  const isDark = theme === 'dark';

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark,
  };
}
