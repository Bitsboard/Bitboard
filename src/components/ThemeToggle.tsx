"use client";

import { useTheme } from "@/lib/settings";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900"
            style={{
                backgroundColor: isDark ? '#3b82f6' : '#e5e7eb'
            }}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    );
}
