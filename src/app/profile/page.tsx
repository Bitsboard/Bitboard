"use client";

import React, { useEffect, useState } from "react";
import UsernamePicker from "./UsernamePicker";
import { useTheme } from "@/lib/settings";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";

type Session = {
  user?: { username?: string | null; image?: string | null };
  account?: {
    sso: string;
    email: string;
    username: string | null;
    verified: boolean;
    registeredAt: number;
    profilePhoto?: string | null;
    listings: Array<{ id: number; title: string; priceSat: number; createdAt: number }>;
  } | null;
} | null;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session>(null);
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const lang = useLang();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = (await res.json()) as { session: Session };
        setSession(data?.session ?? null);
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const onTheme = (e: Event) => {
      const d = (e as CustomEvent).detail as 'dark' | 'light';
      try { document.documentElement.classList.toggle('dark', d === 'dark'); } catch { }
    };
    window.addEventListener('bb:theme', onTheme as EventListener);
    return () => window.removeEventListener('bb:theme', onTheme as EventListener);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-orange-100 dark:bg-orange-900/20 mb-8">
              <svg className="h-12 w-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              Welcome to bitsbarter
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
              Sign in to access your profile, manage listings, and start trading with Bitcoin.
            </p>
            <a 
              href="/api/auth/login" 
              className="inline-flex items-center justify-center px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              {session.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt="Profile" 
                  className="h-24 w-24 rounded-full border-4 border-white/20 shadow-lg" 
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-white/20 border-4 border-white/20 flex items-center justify-center">
                  <svg className="h-12 w-12 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              {session.account?.verified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {session.account?.username || 'New User'}
              </h1>
              <p className="text-orange-100 mb-4">
                Member since {session.account ? new Date(session.account.registeredAt * 1000).toLocaleDateString(undefined, { 
                  month: 'long', 
                  year: 'numeric' 
                }) : ''}
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {session.account?.verified ? 'Verified' : 'Unverified'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {session.account?.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Username Picker for New Users */}
        {session.account && !session.account.username && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  Choose Your Username
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  Pick a unique username to complete your profile and start using bitsbarter.
                </p>
                <UsernamePicker />
              </div>
            </div>
          </div>
        )}

        {/* Account Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Listings</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {session.account?.listings?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Account Status</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {session.account?.verified ? 'Verified' : 'Pending'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Member Since</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {session.account ? new Date(session.account.registeredAt * 1000).getFullYear() : '-'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* User Listings */}
        {session.account?.listings && session.account.listings.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Your Listings
              </h2>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {session.account.listings.length} item{session.account.listings.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-4">
              {session.account.listings.map((listing) => (
                <div 
                  key={listing.id} 
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900 dark:text-white mb-1">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Listed on {new Date(listing.createdAt * 1000).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {listing.priceSat.toLocaleString()} sats
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      ~${(listing.priceSat / 100000000 * 45000).toFixed(2)} CAD
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account Actions */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Account Actions
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200 shadow-sm hover:shadow-md">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Listing
            </button>
            <form action="/api/auth/logout" method="post" className="flex-1">
              <button 
                type="submit" 
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


