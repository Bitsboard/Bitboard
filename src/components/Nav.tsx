"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { UnitToggle, ThemeToggle, ViewToggle, NotificationMenu } from "@/components";
import { useLang } from "@/lib/i18n-client";
import { setLang, t } from "@/lib/i18n";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

interface NavProps {
  onPost: () => void;
  user: User | null;
  onAuth: () => void;
  avatarUrl?: string;
}

export function Nav({ onPost, user, onAuth, avatarUrl }: NavProps) {
  const router = useRouter();
  const { theme } = useTheme();
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
                <button
                  onClick={() => {
                    console.log('Starting real database wipe process...');
                    
                    if (confirm('This will PERMANENTLY delete your georged1997@gmail.com account from the database. You will need to re-sign up and choose a new username. Continue?')) {
                      // First clear all client-side state
                      try {
                        // Clear all localStorage
                        localStorage.clear();
                        
                        // Clear all sessionStorage  
                        sessionStorage.clear();
                        
                        // Clear all cookies more aggressively
                        document.cookie.split(";").forEach(function(c) { 
                          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                        });
                        
                        // Clear specific known cookies with multiple domain attempts
                        const cookiesToClear = [
                          'session',
                          'next-auth.session-token',
                          'next-auth.csrf-token', 
                          'next-auth.callback-url',
                          'next-auth.state',
                          '__Secure-next-auth.session-token',
                          '__Host-next-auth.csrf-token'
                        ];
                        
                        cookiesToClear.forEach(cookieName => {
                          // Multiple domain and path combinations
                          const domains = ['', '.bitsbarter.com', 'bitsbarter.com'];
                          const paths = ['/', '/api', '/en'];
                          
                          domains.forEach(domain => {
                            paths.forEach(path => {
                              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
                              if (domain) {
                                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
                              }
                            });
                          });
                        });
                        
                        console.log('Client-side data cleared, now deleting from database...');
                        
                        // Now actually delete the account from the database
                        fetch('/api/wipe-test-account', { 
                          method: 'POST',
                          credentials: 'include'
                        })
                        .then(response => response.json())
                        .then((data: unknown) => {
                          const responseData = data as { success?: boolean; message?: string; error?: string };
                          if (responseData.success) {
                            console.log('Database wipe successful:', responseData.message);
                            alert('Account wiped successfully! You can now re-sign up and choose a new username.');
                            // Redirect to homepage
                            window.location.href = '/?wiped=' + Date.now();
                          } else {
                            console.error('Database wipe failed:', responseData.error);
                            alert('Failed to wipe account from database: ' + responseData.error);
                          }
                        })
                        .catch(error => {
                          console.error('Database wipe error:', error);
                          alert('Failed to wipe account from database. Please try again.');
                        });
                        
                      } catch (error) {
                        console.error('Error during wipe:', error);
                        alert('Error during wipe process. Please try again.');
                      }
                    }
                  }}
                  className="hidden sm:inline rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow cursor-pointer hover:bg-red-700 transition-colors duration-200"
                  title="Click to wipe georged1997@gmail.com from database for testing"
                >
                  STAGING
                </button>
              )}
            </div>
          </a>
        </div>
        <div className="flex items-center gap-4">
          {/* Language Selector - Subtle and compact */}
          <div ref={langRef} className="relative hidden sm:block">
            <button onClick={() => setLangOpen((v) => !v)} aria-label="Language"
              className={cn("px-2 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105", dark ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50" : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100")}>
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

          {/* Primary Action - Post Listing (when signed in) */}
          {user && (
            <button
              onClick={onPost}
              className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:from-orange-400 hover:to-red-400 hover:shadow-xl hover:scale-105 flex items-center justify-center"
            >
              {t('post_listing', lang)}
            </button>
          )}

          {/* User Profile Section - Unified button design */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* Unified Profile Button */}
              {user.handle ? (
                <a 
                  href={`/profile/${user.handle}`}
                  onClick={(e) => {
                    // Use Next.js router for proper navigation
                    e.preventDefault();
                    router.push(`/profile/${user.handle}`);
                  }}
                  className="inline-flex items-center gap-3 px-4 h-10 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/50 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/50 transition-all duration-200 group border border-neutral-300/50 dark:border-neutral-700/50"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="avatar" className={cn("h-7 w-7 rounded-full border-2 shadow-sm", dark ? "border-white/30" : "border-neutral-300/50")} />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <span className={cn("text-sm font-medium hidden md:block", dark ? "text-neutral-200" : "text-neutral-700")}>
                    {user.handle}
                  </span>
                  <svg className="w-4 h-4 text-neutral-400 group-hover:text-neutral-300 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ) : (
                // Show username selection prompt if user hasn't chosen a username
                <div className="inline-flex items-center gap-3 px-4 h-10 rounded-xl bg-yellow-100/80 dark:bg-yellow-900/50 border border-yellow-300/50 dark:border-yellow-700/50">
                  <div className="h-7 w-7 rounded-full bg-yellow-500 flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className={cn("text-sm font-medium hidden md:block", dark ? "text-yellow-200" : "text-yellow-700")}>
                    Choose Username
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onAuth()} 
                className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 text-sm font-semibold text-white transition-all duration-200 hover:from-orange-400 hover:to-red-400 hover:scale-105 flex items-center justify-center"
              >
                Register
              </button>
              <button 
                onClick={() => onAuth()} 
                className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 text-sm font-semibold text-white transition-all duration-200 hover:from-orange-400 hover:to-red-400 hover:scale-105 flex items-center justify-center"
              >
                {t('sign_in', lang)}
              </button>
            </div>
          )}
          
          {/* Notifications - Centered between profile and hamburger */}
          {user && <NotificationMenu dark={dark} />}
          
          {/* Settings Menu - Always visible, subtle */}
          <div className="relative">
            <button onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen} aria-haspopup="menu" className={cn("h-10 rounded-xl px-3 text-base font-bold shadow-lg ring-1 transition-all duration-200 hover:scale-105 flex items-center justify-center", dark ? "text-neutral-200 hover:text-neutral-100 hover:bg-neutral-700/50 ring-neutral-700 bg-neutral-800/50" : "text-neutral-700 hover:text-neutral-800 hover:bg-neutral-200/80 ring-neutral-300 bg-neutral-100/80")}>☰</button>
            {menuOverlay}
          </div>
        </div>
      </div>
    </nav>
  );
}
