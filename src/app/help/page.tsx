"use client";

import { useLang } from '@/lib/i18n-client';
import { t } from '@/lib/i18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function HelpPage() {
    const lang = useLang();

    const faqs = [
        {
            question: t('how_lightning_escrow_works', lang),
            answer: t('lightning_escrow_help_answer', lang)
        },
        {
            question: t('what_if_dispute', lang),
            answer: t('dispute_help_answer', lang)
        },
        {
            question: t('are_there_escrow_fees', lang),
            answer: t('escrow_fees_help_answer', lang)
        },
        {
            question: t('how_create_listing', lang),
            answer: t('create_listing_help_answer', lang)
        },
        {
            question: t('is_safe_meet_strangers', lang),
            answer: t('meet_strangers_help_answer', lang)
        },
        {
            question: t('what_payment_methods', lang),
            answer: t('payment_methods_answer', lang)
        }
    ];

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-white dark:bg-neutral-950">
                <div className="mx-auto max-w-4xl px-4 py-16">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                            {t('help_center', lang)}
                        </h1>
                        <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                            {t('help_description', lang)}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        <a
                            href="/escrow"
                            className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors duration-200"
                        >
                            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-white text-xl">⚡</span>
                            </div>
                            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                                {t('lightning_escrow', lang)}
                            </h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {t('learn_escrow_system', lang)}
                            </p>
                        </a>

                        <a
                            href="/safety"
                            className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
                        >
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-white text-xl">🔒</span>
                            </div>
                            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                                {t('safety_tips', lang)}
                            </h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {t('stay_safe_buying_selling', lang)}
                            </p>
                        </a>

                        <a
                            href="/contact"
                            className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200"
                        >
                            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-white text-xl">💬</span>
                            </div>
                            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                                {t('contact_support', lang)}
                            </h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {t('get_help_support_team', lang)}
                            </p>
                        </a>
                    </div>

                    {/* FAQ Section */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8 text-center">
                            {t('frequently_asked_questions', lang)}
                        </h2>

                        <div className="space-y-6">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800"
                                >
                                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                                        {faq.question}
                                    </h3>
                                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Getting Started Guide */}
                    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 mb-16">
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6">
                            {t('getting_started', lang)}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
                                    {t('for_buyers', lang)}
                                </h3>
                                <ol className="list-decimal list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                                    <li>{t('browse_listings_area', lang)}</li>
                                    <li>{t('use_filters_find', lang)}</li>
                                    <li>{t('contact_sellers_chat', lang)}</li>
                                    <li>{t('agree_terms_escrow', lang)}</li>
                                    <li>{t('meet_safely_complete', lang)}</li>
                                </ol>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
                                    {t('for_sellers', lang)}
                                </h3>
                                <ol className="list-decimal list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
                                    <li>{t('create_detailed_listing', lang)}</li>
                                    <li>{t('set_price_bitcoin', lang)}</li>
                                    <li>{t('respond_buyer_inquiries', lang)}</li>
                                    <li>{t('coordinate_safe_meetups', lang)}</li>
                                    <li>{t('receive_payment_escrow', lang)}</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Still Need Help */}
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                            {t('still_need_help', lang)}
                        </h2>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                            {t('cant_find_looking_for', lang)}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/contact"
                                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
                            >
                                {t('contact_support', lang)}
                            </a>
                            <a
                                href="/"
                                className="inline-flex items-center justify-center px-6 py-3 border border-orange-600 text-base font-medium rounded-md text-orange-600 bg-transparent hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
                            >
                                {t('back_to_home', lang)}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}
