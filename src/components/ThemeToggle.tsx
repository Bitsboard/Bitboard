"use client";

import { useTheme } from "@/lib/settings";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 shadow-lg"
            style={{
                background: isDark 
                    ? 'linear-gradient(135deg, #f97316, #dc2626)' 
                    : 'linear-gradient(135deg, #fbbf24, #f59e0b)'
            }}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-all duration-300 ${isDark ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    );
}
