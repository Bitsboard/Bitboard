"use client";

import { useLang } from '@/lib/i18n-client';
import { t } from '@/lib/i18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function SupportPage() {
    const lang = useLang();

    const supportTopics = [
        {
            title: t('account_issues', lang),
            description: t('account_issues_description', lang),
            icon: "👤",
            color: "bg-blue-500"
        },
        {
            title: t('payment_problems', lang),
            description: t('payment_problems_description', lang),
            icon: "⚡",
            color: "bg-orange-500"
        },
        {
            title: t('listing_problems', lang),
            description: t('listing_problems_description', lang),
            icon: "📝",
            color: "bg-green-500"
        },
        {
            title: t('safety_concerns', lang),
            description: t('safety_concerns_description', lang),
            icon: "🔒",
            color: "bg-red-500"
        },
        {
            title: t('technical_issues', lang),
            description: t('technical_issues_description', lang),
            icon: "🛠️",
            color: "bg-purple-500"
        },
        {
            title: t('general_questions', lang),
            description: t('general_questions_description', lang),
            icon: "❓",
            color: "bg-gray-500"
        }
    ];

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-white dark:bg-neutral-950">
                <div className="mx-auto max-w-4xl px-4 py-16">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                            {t('support_center', lang)}
                        </h1>
                        <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                            {t('support_description', lang)}
                        </p>
                    </div>

                    {/* Support Topics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {supportTopics.map((topic, index) => (
                            <div
                                key={index}
                                className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors duration-200"
                            >
                                <div className={`w-12 h-12 ${topic.color} rounded-lg flex items-center justify-center mb-4`}>
                                    <span className="text-white text-xl">{topic.icon}</span>
                                </div>
                                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                                    {topic.title}
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                                    {topic.description}
                                </p>
                                <a
                                    href="/contact"
                                    className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
                                >
                                    {t('get_help', lang)} →
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* Priority Support */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-8 mb-16 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xl">🚨</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-3">
                                    {t('urgent_safety_issues', lang)}
                                </h2>
                                <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                                    {t('urgent_safety_description', lang)}
                                </p>
                                <a
                                    href="/contact"
                                    className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200"
                                >
                                    {t('contact_support_now', lang)}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Self-Service Resources */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8 text-center">
                            {t('self_service_resources', lang)}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800">
                                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                                    {t('help_center', lang)}
                                </h3>
                                <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                                    {t('help_center_description', lang)}
                                </p>
                                <a
                                    href="/help"
                                    className="inline-flex items-center justify-center px-4 py-2 border border-orange-600 text-orange-600 font-medium rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
                                >
                                    {t('visit_help_center', lang)}
                                </a>
                            </div>

                            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800">
                                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                                    {t('safety_guidelines', lang)}
                                </h3>
                                <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                                    {t('safety_guidelines_description', lang)}
                                </p>
                                <a
                                    href="/safety"
                                    className="inline-flex items-center justify-center px-4 py-2 border border-orange-600 text-orange-600 font-medium rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
                                >
                                    {t('view_safety_tips', lang)}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Response Times */}
                    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 mb-16">
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6">
                            {t('expected_response_times', lang)}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-white text-xl">🚨</span>
                                </div>
                                <h3 className="font-medium text-neutral-900 dark:text-white mb-2">{t('safety_issues', lang)}</h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {t('within_2_hours', lang)}
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-white text-xl">⚡</span>
                                </div>
                                <h3 className="font-medium text-neutral-900 dark:text-white mb-2">{t('payment_issues', lang)}</h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {t('within_4_hours', lang)}
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-white text-xl">📧</span>
                                </div>
                                <h3 className="font-medium text-neutral-900 dark:text-white mb-2">{t('general_support', lang)}</h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {t('within_24_hours', lang)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Options */}
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                            {t('need_more_help', lang)}
                        </h2>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                            {t('support_team_ready', lang)}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/contact"
                                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
                            >
                                {t('contact_support', lang)}
                            </a>
                            <a
                                href="/help"
                                className="inline-flex items-center justify-center px-6 py-3 border border-orange-600 text-base font-medium rounded-md text-orange-600 bg-transparent hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
                            >
                                {t('browse_help_center', lang)}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}
