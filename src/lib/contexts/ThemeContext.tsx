"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { useTheme } from '@/lib/settings';

interface ThemeContextType {
    dark: boolean;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme, setTheme, toggleTheme } = useTheme();
    const dark = theme === 'dark';

    // Initialize theme on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isDark = theme === 'dark';
            document.documentElement.classList.toggle('dark', isDark);
        }
    }, [theme]);

    const value: ThemeContextType = {
        dark,
        theme,
        toggleTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
}
