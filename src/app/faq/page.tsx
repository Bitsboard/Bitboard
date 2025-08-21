"use client";

import { useLang } from '@/lib/i18n-client';
import { t } from '@/lib/i18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function FAQPage() {
    const lang = useLang();

    const faqCategories = [
        {
            title: t('getting_started', lang),
            icon: "🚀",
            questions: [
                {
                    question: t('how_create_account', lang),
                    answer: t('create_account_answer', lang)
                },
                {
                    question: t('is_bitsbarter_free', lang),
                    answer: t('bitsbarter_free_answer', lang)
                },
                {
                    question: t('need_bitcoin_wallet', lang),
                    answer: t('bitcoin_wallet_answer', lang)
                }
            ]
        },
        {
            title: t('buying_selling', lang),
            icon: "💰",
            questions: [
                {
                    question: t('how_create_listing', lang),
                    answer: t('create_listing_answer', lang)
                },
                {
                    question: t('how_contact_seller', lang),
                    answer: t('contact_seller_answer', lang)
                },
                {
                    question: t('can_negotiate_prices', lang),
                    answer: t('negotiate_prices_answer', lang)
                }
            ]
        },
        {
            title: t('lightning_escrow', lang),
            icon: "⚡",
            questions: [
                {
                    question: t('how_lightning_escrow_works', lang),
                    answer: t('lightning_escrow_answer', lang)
                },
                {
                    question: t('what_if_problem_purchase', lang),
                    answer: t('problem_purchase_answer', lang)
                },
                {
                    question: t('are_escrow_fees_refundable', lang),
                    answer: t('escrow_fees_answer', lang)
                }
            ]
        },
        {
            title: t('safety_security', lang),
            icon: "🔒",
            questions: [
                {
                    question: t('is_safe_meet_strangers', lang),
                    answer: t('meet_strangers_answer', lang)
                },
                {
                    question: t('what_if_feel_unsafe', lang),
                    answer: t('feel_unsafe_answer', lang)
                },
                {
                    question: t('how_report_suspicious', lang),
                    answer: t('report_suspicious_answer', lang)
                }
            ]
        },
        {
            title: t('technical_issues', lang),
            icon: "🛠️",
            questions: [
                {
                    question: t('app_not_loading', lang),
                    answer: t('app_not_loading_answer', lang)
                },
                {
                    question: t('cant_upload_photos', lang),
                    answer: t('upload_photos_answer', lang)
                },
                {
                    question: t('lightning_payment_failed', lang),
                    answer: t('lightning_payment_answer', lang)
                }
            ]
        }
    ];

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-white dark:bg-neutral-950">
                <div className="mx-auto max-w-4xl px-4 py-16">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                            {t('frequently_asked_questions', lang)}
                        </h1>
                        <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                            {t('faq_description', lang)}
                        </p>
                    </div>

                    {/* FAQ Categories */}
                    <div className="space-y-12">
                        {faqCategories.map((category, categoryIndex) => (
                            <div key={categoryIndex} className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 border border-neutral-200 dark:border-neutral-800">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                        <span className="text-white text-lg">{category.icon}</span>
                                    </div>
                                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                                        {category.title}
                                    </h2>
                                </div>

                                <div className="space-y-6">
                                    {category.questions.map((faq, faqIndex) => (
                                        <div key={faqIndex} className="border-b border-neutral-200 dark:border-neutral-700 pb-6 last:border-b-0 last:pb-0">
                                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-3">
                                                {faq.question}
                                            </h3>
                                            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Still Have Questions */}
                    <div className="text-center mt-16">
                        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                            {t('still_have_questions', lang)}
                        </h2>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                            {t('cant_find_answer', lang)}
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
                                {t('visit_help_center', lang)}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}
