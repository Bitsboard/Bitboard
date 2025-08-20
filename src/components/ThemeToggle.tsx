"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/settings";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const dark = theme === 'dark';

    return (
        <div className="relative inline-flex rounded-2xl p-1 shadow-lg border border-neutral-300/50 backdrop-blur-sm bg-white/70 dark:bg-neutral-800/60">
            <div
                className={cn(
                    "absolute inset-1 rounded-xl bg-white shadow-md transition-all duration-300 ease-out",
                    dark ? "translate-x-full" : "translate-x-0"
                )}
                style={{ width: 'calc(50% - 4px)' }}
            />
            <button
                onClick={() => dark && toggleTheme()}
                className={cn(
                    "relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105",
                    !dark
                        ? "text-blue-600 font-extrabold"
                        : "text-neutral-200 hover:text-neutral-50"
                )}
            >
                🌙
            </button>
            <button
                onClick={() => !dark && toggleTheme()}
                className={cn(
                    "relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105",
                    dark
                        ? "text-yellow-400 font-extrabold"
                        : "text-neutral-600 hover:text-neutral-800"
                )}
            >
                ☀️
            </button>
        </div>
    );
}
