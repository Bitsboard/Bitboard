'use client';

import { useLang } from '@/lib/i18n-client';
import { t } from '@/lib/i18n';
import Link from 'next/link';

export default function Footer() {
    const lang = useLang();

    const footerLinks = {
        legal: [
            { key: 'privacy', href: `/${lang}/privacy` },
            { key: 'terms', href: `/${lang}/terms` },
            { key: 'safety', href: `/${lang}/safety` },
        ],
        services: [
            { key: 'escrow', href: `/${lang}/escrow` },
            { key: 'help', href: `/${lang}/help` },
            { key: 'support', href: `/${lang}/support` },
        ],
        company: [
            { key: 'about', href: `/${lang}/about` },
            { key: 'contact', href: `/${lang}/contact` },
            { key: 'faq', href: `/${lang}/faq` },
        ],
    };

    return (
        <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 mt-16">
            <div className="mx-auto max-w-7xl px-4 py-12">
                {/* Main footer content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Brand section */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-lg font-bold">⚡</span>
                            </div>
                            <span className="text-xl font-bold text-neutral-900 dark:text-white">
                                bitsbarter
                            </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            {t('footer_tagline', lang)}
                        </p>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 uppercase tracking-wide">
                            Legal
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.key}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200"
                                    >
                                        {t(link.key, lang)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 uppercase tracking-wide">
                            Services
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.services.map((link) => (
                                <li key={link.key}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200"
                                    >
                                        {t(link.key, lang)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 uppercase tracking-wide">
                            Company
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.key}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200"
                                    >
                                        {t(link.key, lang)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {t('made_with_love', lang)}
                        </p>
                        <div className="flex items-center space-x-6">
                            <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                © {new Date().getFullYear()} bitsbarter
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
