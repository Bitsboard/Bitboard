"use client";

import { useLang } from '@/lib/i18n-client';
import { t } from '@/lib/i18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AboutPage() {
    const lang = useLang();

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-white dark:bg-neutral-950">
                <div className="mx-auto max-w-4xl px-4 py-16">
                    <div className="text-center mb-16">
                        <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-white text-3xl">⚡</span>
                        </div>
                        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                            {t('about_bitsbarter', lang)}
                        </h1>
                        <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                            {t('bitcoin_native_marketplace', lang)}
                        </p>
                    </div>

                    <div className="prose prose-lg dark:prose-invert max-w-none mb-16">
                        <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
                            {t('about_description_1', lang)}
                        </p>

                        <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
                            {t('about_description_2', lang)}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-2xl">🔒</span>
                            </div>
                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                                {t('secure', lang)}
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                {t('secure_description', lang)}
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-2xl">⚡</span>
                            </div>
                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                                {t('fast', lang)}
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                {t('fast_description', lang)}
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-2xl">🌍</span>
                            </div>
                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                                {t('local', lang)}
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                {t('local_description', lang)}
                            </p>
                        </div>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 mb-16">
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                            {t('our_mission', lang)}
                        </h2>
                        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                            {t('mission_description', lang)}
                        </p>
                    </div>

                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                            {t('join_revolution', lang)}
                        </h2>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                            {t('start_today', lang)}
                        </p>
                        <a
                            href="/"
                            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
                        >
                            {t('get_started', lang)}
                        </a>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}
