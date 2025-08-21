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
            { key: 'careers', href: `/${lang}/careers` },
        ],
    };

    return (
        <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Brand section */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl tracking-tight leading-none">
                                <span className="font-bold text-orange-500">bits</span>
                                <span className="font-bold text-neutral-900 dark:text-white">barter</span>
                            </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                            The Bitcoin-native Marketplace.
                        </p>
                        <div className="space-y-1 text-sm text-neutral-500 dark:text-neutral-400">
                            <p>© {new Date().getFullYear()} bitsbarter</p>
                            <p>{t('made_with_love', lang)}</p>
                        </div>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 uppercase tracking-wide">
                            Legal
                        </h3>
                        <ul className="space-y-2">
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
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 uppercase tracking-wide">
                            Services
                        </h3>
                        <ul className="space-y-2">
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
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 uppercase tracking-wide">
                            Company
                        </h3>
                        <ul className="space-y-2">
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
            </div>
        </footer>
    );
}
