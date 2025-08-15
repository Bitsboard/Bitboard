"use client";

import React from "react";

interface ThemeToggleProps {
    dark: boolean;
    onToggle: () => void;
}

export function ThemeToggle({ dark, onToggle }: ThemeToggleProps) {
    return (
        <div className="relative inline-flex rounded-2xl bg-neutral-200/50 p-1 shadow-lg border border-neutral-300/50 backdrop-blur-sm">
            <div
                className={cn(
                    "absolute inset-1 rounded-xl bg-white shadow-md transition-all duration-300 ease-out",
                    dark ? "translate-x-0" : "translate-x-full"
                )}
                style={{ width: 'calc(50% - 4px)' }}
            />
            <button
                onClick={() => !dark && onToggle()}
                className={cn(
                    "relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105",
                    !dark
                        ? "text-blue-600 font-extrabold"
                        : "text-neutral-600 hover:text-neutral-800"
                )}
            >
                🌙
            </button>
            <button
                onClick={() => dark && onToggle()}
                className={cn(
                    "relative z-10 px-4 py-2 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105",
                    dark
                        ? "text-yellow-600 font-extrabold"
                        : "text-neutral-600 hover:text-neutral-800"
                )}
            >
                ☀️
            </button>
        </div>
    );
}

function cn(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}
