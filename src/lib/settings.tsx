"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, Unit, Layout, UserSettings } from './types';

const DEFAULT_SETTINGS: UserSettings = {
    theme: 'dark',
    unit: 'sats',
    layout: 'grid',
};

interface SettingsStore extends UserSettings {
    setTheme: (theme: Theme) => void;
    setUnit: (unit: Unit) => void;
    setLayout: (layout: Layout) => void;
    toggleTheme: () => void;
    reset: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            ...DEFAULT_SETTINGS,

            setTheme: (theme: Theme) => {
                set({ theme });
                // Apply theme to document
                if (typeof window !== 'undefined') {
                    const isDark = theme === 'dark';
                    document.documentElement.classList.toggle('dark', isDark);
                    // Trigger resize event for components that depend on it
                    window.dispatchEvent(new Event('resize'));
                }
            },

            setUnit: (unit: Unit) => {
                set({ unit });
            },

            setLayout: (layout: Layout) => {
                set({ layout });
            },

            toggleTheme: () => {
                const currentTheme = get().theme;
                const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
                get().setTheme(newTheme);
            },

            reset: () => {
                set(DEFAULT_SETTINGS);
                if (typeof window !== 'undefined') {
                    document.documentElement.classList.toggle('dark', DEFAULT_SETTINGS.theme === 'dark');
                }
            },
        }),
        {
            name: 'bitsbarter-settings',
            partialize: (state) => ({
                theme: state.theme,
                unit: state.unit,
                layout: state.layout,
            }),
            onRehydrateStorage: () => (state) => {
                // Apply theme on rehydration
                if (state && typeof window !== 'undefined') {
                    const isDark = state.theme === 'dark';
                    document.documentElement.classList.toggle('dark', isDark);
                }
            },
        }
    )
);

// Hook to use settings
export function useSettings() {
    const store = useSettingsStore();
    return store;
}

// Individual hooks for convenience
export const useTheme = () => {
    const { theme, setTheme, toggleTheme } = useSettingsStore();
    return { theme, setTheme, toggleTheme };
};

export const useUnit = () => {
    const { unit, setUnit } = useSettingsStore();
    return { unit, setUnit };
};

export const useLayout = () => {
    const { layout, setLayout } = useSettingsStore();
    return { layout, setLayout };
};

// Legacy compatibility - remove after migration
export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};
