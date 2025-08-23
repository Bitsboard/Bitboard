"use client";

import { useTheme } from "@/lib/contexts/ThemeContext";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="relative inline-flex rounded-2xl p-1 shadow-lg border backdrop-blur-sm bg-white/70 dark:bg-neutral-800/60 dark:border-neutral-700/50 w-32">
            <div
                className={`absolute inset-1 rounded-xl transition-all duration-300 ease-out ${
                    isDark 
                        ? 'translate-x-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg' 
                        : 'translate-x-0 bg-gradient-to-r from-orange-400 to-orange-500 shadow-lg'
                }`}
                style={{ width: 'calc(50% - 4px)' }}
            />
            <button
                onClick={toggleTheme}
                className={`relative z-10 px-3 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105 flex-1 ${
                    !isDark
                        ? 'text-white font-extrabold drop-shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-50'
                }`}
                title="Light mode"
            >
                Light
            </button>
            <button
                onClick={toggleTheme}
                className={`relative z-10 px-3 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105 flex-1 ${
                    isDark
                        ? 'text-white font-extrabold drop-shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-50'
                }`}
                title="Dark mode"
            >
                Dark
            </button>
        </div>
    );
}
