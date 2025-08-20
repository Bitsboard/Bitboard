"use client";

import { useEffect } from 'react';
import { useSettings } from '@/lib/settings';

interface SettingsProviderProps {
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { initialize } = useSettings();

  // Initialize settings on mount with error handling
  useEffect(() => {
    try {
      // Only initialize in browser environment
      if (typeof window !== 'undefined') {
        initialize();
      }
    } catch (error) {
      console.warn('Settings initialization failed:', error);
      // Don't crash the app if settings fail to initialize
    }
  }, [initialize]);

  return <>{children}</>;
}
