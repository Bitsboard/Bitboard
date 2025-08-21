"use client";

import { useLang } from '@/lib/i18n-client';
import { t } from '@/lib/i18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ContactPage() {
    const lang = useLang();

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-white dark:bg-neutral-950">
                <div className="mx-auto max-w-4xl px-4 py-16">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                            {t('contact_us', lang)}
                        </h1>
                        <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                            {t('contact_description', lang)}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Information */}
                        <div>
                            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6">
                                {t('get_in_touch', lang)}
                            </h2>

                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-lg">📧</span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-neutral-900 dark:text-white">{t('email', lang)}</h3>
                                        <p className="text-neutral-600 dark:text-neutral-400">
                                            support@bitsbarter.com
                                        </p>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                            {t('response_time', lang)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-lg">💬</span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-neutral-900 dark:text-white">{t('community', lang)}</h3>
                                        <p className="text-neutral-600 dark:text-neutral-400">
                                            {t('join_community', lang)}
                                        </p>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                            {t('community_help', lang)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-lg">📚</span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-neutral-900 dark:text-white">{t('documentation', lang)}</h3>
                                        <p className="text-neutral-600 dark:text-neutral-400">
                                            {t('check_help_center', lang)}
                                        </p>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                            {t('help_center_info', lang)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                                <h3 className="font-medium text-neutral-900 dark:text-white mb-3">
                                    {t('business_hours', lang)}
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {t('business_hours_details', lang)}
                                </p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div>
                            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6">
                                {t('send_message', lang)}
                            </h2>

                            <form className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        {t('name', lang)}
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400"
                                        placeholder={t('your_name', lang)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        {t('email', lang)}
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        {t('subject', lang)}
                                    </label>
                                    <select
                                        id="subject"
                                        name="subject"
                                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                        required
                                    >
                                        <option value="">{t('select_subject', lang)}</option>
                                        <option value="general">{t('general_inquiry', lang)}</option>
                                        <option value="support">{t('technical_support', lang)}</option>
                                        <option value="billing">{t('billing_question', lang)}</option>
                                        <option value="partnership">{t('partnership', lang)}</option>
                                        <option value="other">{t('other', lang)}</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        {t('message', lang)}
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 resize-none"
                                        placeholder={t('tell_us_how', lang)}
                                        required
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200"
                                >
                                    {t('send_message', lang)}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}
