"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { UnitToggle, ThemeToggle, ViewToggle, NotificationMenu } from "@/components";
import { useLang } from "@/lib/i18n-client";
import { setLang, t } from "@/lib/i18n";
import { useUnifiedTheme } from "@/lib/settings";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

interface NavProps {
  onPost: () => void;
  user: User | null;
  onAuth: () => void;
  avatarUrl?: string;
}

export function Nav({ onPost, user, onAuth, avatarUrl }: NavProps) {
  const { theme } = useUnifiedTheme();
  const dark = theme === 'dark';
  const isStaging =
    process.env.NEXT_PUBLIC_BRANCH === "staging" ||
    process.env.NEXT_PUBLIC_ENV === "staging";
  const lang = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = React.useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (langOpen && langRef.current && target && !langRef.current.contains(target)) setLangOpen(false);
    };
    document.addEventListener('click', onDoc, true);
    document.addEventListener('touchstart', onDoc, true);
    return () => {
      document.removeEventListener('click', onDoc, true);
      document.removeEventListener('touchstart', onDoc, true);
    };
  }, [langOpen]);

  function navigateToLocale(next: 'en' | 'fr' | 'es' | 'de') {
    // Persist current UI prefs before navigation
    try {
      localStorage.setItem('lang', next);
      // Theme is now handled by our dedicated theme system, no need to read from DOM
    } catch { }
    setLang(next);
    try {
      const { pathname, search, hash } = window.location;
      const parts = pathname.split('/').filter(Boolean);
      const first = parts[0];
      const known = ['en', 'fr', 'es', 'de'];
      if (first && known.includes(first)) parts.shift();
      const newPath = '/' + [next, ...parts].join('/');
      const url = newPath + (search || '') + (hash || '');
      window.location.assign(url);
    } catch { }
  }

  const menuOverlay = (menuOpen && typeof window !== 'undefined')
    ? createPortal(
      <div className="fixed inset-0 z-[9999]" onClick={() => setMenuOpen(false)}>
        <div className="absolute right-4 top-16 w-80" onClick={(e) => e.stopPropagation()}>
          <div className="rounded-2xl border shadow-2xl overflow-hidden border-neutral-300/50 bg-white dark:border-neutral-700/50 dark:bg-neutral-900">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('menu_display_prices_in', lang)}</span>
                <UnitToggle />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('menu_display_theme', lang)}</span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('menu_layout_view', lang)}</span>
                <ViewToggle />
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <nav
      className={cn(
        "sticky top-0 z-50",
        dark ? "border-b border-neutral-900 bg-neutral-950" : "border-b border-neutral-200 bg-white"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <a href={`/${lang}`} aria-label="Home" className="inline-flex items-center gap-2">
            <div className="flex items-center gap-2">
              <img src="/Bitsbarterlogo.svg" alt="Bitsbarter" className="h-7 w-7 md:h-8 md:w-8" />
              <span className={cn("text-2xl md:text-3xl tracking-tight leading-none", dark ? "text-white" : "text-black")} style={{ fontFamily: 'Ubuntu, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
                <span className="font-bold text-orange-500">bits</span>
                <span className={cn("font-bold", dark ? "text-white" : "text-black")}>barter</span>
              </span>
              <span
                className={cn(
                  "hidden rounded-full px-2 py-0.5 text-xs sm:inline",
                  dark ? "border border-neutral-800 text-neutral-400" : "border border-neutral-300 text-neutral-600"
                )}
              >
                BETA
              </span>
              {isStaging && (
                <span className="hidden sm:inline rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                  STAGING
                </span>
              )}
            </div>
          </a>
        </div>
        <div className="flex items-center gap-3">
          {/* Language Selector - Left side */}
          <div ref={langRef} className="relative hidden sm:block">
            <button onClick={() => setLangOpen((v) => !v)} aria-label="Language"
              className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200", dark ? "text-neutral-300 hover:bg-neutral-800 hover:text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900")}>
              {lang === 'fr' ? '🇫🇷' : lang === 'es' ? '🇪🇸' : lang === 'de' ? '🇩🇪' : '🇺🇸'}
            </button>
            {langOpen && (
              <div className={cn("absolute right-0 mt-2 w-44 rounded-xl border shadow-2xl z-50", dark ? "border-neutral-700/50 bg-neutral-900/95" : "border-neutral-300/50 bg-white/95")}>
                <button onClick={() => { navigateToLocale('en'); setLangOpen(false); }} className={cn("w-full text-left px-3 py-2 text-sm", dark ? "text-white hover:bg-neutral-800/40" : "text-neutral-900 hover:bg-neutral-100")}>🇺🇸 English</button>
                <button onClick={() => { navigateToLocale('fr'); setLangOpen(false); }} className={cn("w-full text-left px-3 py-2 text-sm", dark ? "text-white hover:bg-neutral-800/40" : "text-neutral-900 hover:bg-neutral-100")}>🇫🇷 Français</button>
                <button onClick={() => { navigateToLocale('es'); setLangOpen(false); }} className={cn("w-full text-left px-3 py-2 text-sm", dark ? "text-white hover:bg-neutral-800/40" : "text-neutral-900 hover:bg-neutral-100")}>🇪🇸 Español</button>
                <button onClick={() => { navigateToLocale('de'); setLangOpen(false); }} className={cn("w-full text-left px-3 py-2 text-sm", dark ? "text-white hover:bg-neutral-800/40" : "text-neutral-900 hover:bg-neutral-100")}>🇩🇪 Deutsch</button>
              </div>
            )}
          </div>

          {/* User Actions - Center */}
          {user && (
            <div className="flex items-center gap-2">
              <button
                onClick={onPost}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:from-orange-400 hover:to-red-400 hover:shadow-xl"
              >
                {t('post_listing', lang)}
              </button>
              <NotificationMenu dark={dark} />
            </div>
          )}

          {/* Profile & Settings - Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <a href={`/profile/${user.handle}`} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all duration-200">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="avatar" className="h-8 w-8 rounded-full border-2 border-white/30 shadow-lg" />
                ) : (
                  <span className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200">
                    <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </span>
                )}
              </a>
            ) : (
              <button onClick={onAuth} className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:from-orange-400 hover:to-red-400 hover:shadow-xl">
                {t('sign_in', lang)}
              </button>
            )}
            
            {/* Settings Dropdown */}
            <div className="relative">
              <button onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen} aria-haspopup="menu" className={cn("rounded-xl px-3 py-2 text-base font-bold shadow-lg ring-1 transition-all duration-200", dark ? "text-neutral-200 hover:bg-neutral-800 ring-neutral-700" : "text-neutral-800 hover:bg-neutral-100 ring-neutral-300")}>☰</button>
              {menuOverlay}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
