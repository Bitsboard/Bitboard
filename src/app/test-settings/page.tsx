"use client";

import React from "react";
import { useSettings } from "@/lib/settings";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { UnitToggle, ThemeToggle, ViewToggle } from "@/components";

export default function TestSettingsPage() {
    const { unit, layout } = useSettings();
    const { theme } = useTheme();

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-neutral-900 dark:text-white">
                    Settings Test Page
                </h1>

                <div className="grid gap-8 md:grid-cols-2">
                    {/* Current Settings Display */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200">
                            Current Settings
                        </h2>

                        <div className="space-y-4">
                            <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Theme</div>
                                <div className="text-lg font-medium text-neutral-900 dark:text-white">
                                    {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                                </div>
                            </div>

                            <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Unit</div>
                                <div className="text-lg font-medium text-neutral-900 dark:text-white">
                                    {unit === 'sats' ? '⚡ Sats' : '₿ BTC'}
                                </div>
                            </div>

                            <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Layout</div>
                                <div className="text-lg font-medium text-neutral-900 dark:text-white">
                                    {layout === 'grid' ? '⊞ Grid' : '☰ List'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Controls */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200">
                            Settings Controls
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">Theme Toggle</div>
                                <ThemeToggle />
                            </div>

                            <div>
                                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">Unit Toggle</div>
                                <UnitToggle />
                            </div>

                            <div>
                                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">Layout Toggle</div>
                                <ViewToggle />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-12 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-blue-50 dark:bg-blue-900/20">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                        How to Test
                    </h3>
                    <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                        <li>• Change any setting using the controls above</li>
                        <li>• Navigate to other pages (like /terms, /search, /profile)</li>
                        <li>• Return to this page - your settings should persist</li>
                        <li>• Refresh the page - settings should still be there</li>
                        <li>• Open a new tab - settings should be consistent</li>
                    </ul>
                </div>

                {/* Navigation */}
                <div className="mt-8 flex gap-4">
                    <a
                        href="/terms"
                        className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                    >
                        Go to Terms Page
                    </a>
                    <a
                        href="/search"
                        className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                    >
                        Go to Search Page
                    </a>
                    <a
                        href="/profile"
                        className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                    >
                        Go to Profile Page
                    </a>
                </div>
            </div>
        </div>
    );
}
