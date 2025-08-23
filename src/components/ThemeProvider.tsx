"use client";

import { useEffect } from 'react';
import { initializeTheme } from '@/lib/themeManager';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize the theme system when this component mounts
    initializeTheme();
  }, []);

  return <>{children}</>;
}
