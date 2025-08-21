"use client";

import React, { useEffect, useState } from "react";
import UsernamePicker from "./UsernamePicker";
import { useTheme, useLayout } from "@/lib/settings";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Session = {
  user?: { username?: string | null; image?: string | null };
  account?: {
    sso: string;
    email: string;
    username: string | null;
    verified: boolean;
    registeredAt: number;
    profilePhoto?: string | null;
    listings: Array<{ id: number; title: string; priceSat: number; createdAt: number; type: string }>;
  } | null;
} | null;

type SortOption = 'alphabetical' | 'newest' | 'oldest';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const { theme } = useTheme();
  const { layout, setLayout } = useLayout();
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

  const getSortedListings = () => {
    if (!session?.account?.listings) return [];
    
    const listings = [...session.account.listings];
    
    switch (sortBy) {
      case 'alphabetical':
        return listings.sort((a, b) => a.title.localeCompare(b.title));
      case 'newest':
        return listings.sort((a, b) => b.createdAt - a.createdAt);
      case 'oldest':
        return listings.sort((a, b) => a.createdAt - b.createdAt);
      default:
        return listings;
    }
  };

  const isOwnProfile = session?.account?.username === session?.user?.username;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading profile...</p>
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

  const sortedListings = getSortedListings();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Top Bar - Profile Info */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-3xl p-8 mb-8 text-white shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-black/5 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
          
          {/* Sign Out Button - Top Right */}
          {isOwnProfile && (
            <div className="absolute top-6 right-6 z-20">
              <form action="/api/auth/logout" method="post">
                                         <button 
                           type="submit" 
                           className="inline-flex items-center justify-center px-4 py-3 bg-white dark:bg-gradient-to-r dark:from-neutral-600 dark:to-neutral-700 text-neutral-900 dark:text-white font-medium rounded-lg hover:bg-neutral-50 dark:hover:from-neutral-700 dark:hover:to-neutral-800 transition-all duration-200 shadow-sm hover:shadow-md border border-neutral-300 dark:border-neutral-500/30 hover:border-neutral-400 dark:hover:border-neutral-400/50"
                         >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('sign_out', lang)}
                </button>
              </form>
            </div>
          )}
          
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-8">
            {/* Profile Picture */}
            <div className="relative">
              {session.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt="Profile" 
                  className="h-28 w-28 rounded-full border-4 border-white/30 shadow-2xl ring-4 ring-white/20" 
                />
              ) : (
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-white/30 to-white/20 border-4 border-white/30 flex items-center justify-center shadow-2xl ring-4 ring-white/20">
                  <svg className="h-14 w-14 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              {session.account?.verified && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full p-2 shadow-lg ring-2 ring-white/50 animate-pulse">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                  {session.account?.username || 'New User'}
                </h1>
                {session.account?.verified && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 text-white border border-cyan-300/40 shadow-lg">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('verified', lang)}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400/30 to-orange-500/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-200" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-orange-200/80 uppercase tracking-wide font-medium">{t('reputation', lang)}</p>
                    <p className="text-orange-100 font-semibold">+{Math.floor(Math.random() * 50) + 50}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400/30 to-orange-500/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-200" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-orange-200/80 uppercase tracking-wide font-medium">{t('member_since', lang)}</p>
                    <p className="text-orange-100 font-semibold">
                      {session.account ? new Date(session.account.registeredAt * 1000).toLocaleDateString(undefined, { 
                        month: 'long', 
                        year: 'numeric' 
                      }) : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400/30 to-orange-500/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-200" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-orange-200/80 uppercase tracking-wide font-medium">{t('active_listings', lang)}</p>
                    <p className="text-orange-100 font-semibold">
                      {session.account?.listings?.length || 0}
                    </p>
                  </div>
                </div>
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

        {/* Post New Listing Button (only for profile owner with listings) */}
        {isOwnProfile && session.account?.listings && session.account.listings.length > 0 && (
          <div className="mb-8">
            <button className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-sm hover:shadow-md">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              + Post New Listing
            </button>
          </div>
        )}

        {/* Listings Section */}
        {session.account?.listings && session.account.listings.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
            {/* Listings Header with Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                  {isOwnProfile ? 'Your Listings' : 'Listings'}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {sortedListings.length} item{sortedListings.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>

                {/* View Toggle */}
                <div className="relative inline-flex rounded-2xl bg-neutral-200/50 dark:bg-neutral-700/50 p-0.5 shadow-lg border border-neutral-300/50 dark:border-neutral-600/50 backdrop-blur-sm">
                  <div
                    className={cn(
                      "absolute inset-1 rounded-xl bg-white dark:bg-neutral-800 shadow-md transition-all duration-300 ease-out",
                      layout === "grid" ? "translate-x-0" : "translate-x-full"
                    )}
                    style={{ width: 'calc(50% - 4px)' }}
                  />
                  <button
                    onClick={() => setLayout("grid")}
                    className={cn(
                      "relative z-10 px-4 py-1 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105",
                      layout === "grid"
                        ? "text-orange-700 dark:text-orange-400 font-extrabold"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                    )}
                    title="Grid View"
                  >
                    <span className="text-lg">⊞</span>
                    <span>Grid</span>
                  </button>
                  <button
                    onClick={() => setLayout("list")}
                    className={cn(
                      "relative z-10 px-4 py-1 text-xs font-bold transition-all duration-300 rounded-xl hover:scale-105",
                      layout === "list"
                        ? "text-orange-700 dark:text-orange-400 font-extrabold"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                    )}
                    title="List View"
                  >
                    <span className="text-lg">☰</span>
                    <span>List</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Listings Grid/List */}
            {layout === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedListings.map((listing) => (
                  <div 
                    key={listing.id} 
                    className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        listing.type === 'selling' 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                          : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                      }`}>
                        {listing.type === 'selling' ? 'Selling' : 'Looking For'}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(listing.createdAt * 1000).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <h3 className="font-medium text-neutral-900 dark:text-white mb-3 line-clamp-2">
                      {listing.title}
                    </h3>
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
            ) : (
              <div className="space-y-4">
                {sortedListings.map((listing) => (
                  <div 
                    key={listing.id} 
                    className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          listing.type === 'selling' 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                        }`}>
                          {listing.type === 'selling' ? 'Selling' : 'Looking For'}
                        </span>
                        <h3 className="font-medium text-neutral-900 dark:text-white">
                          {listing.title}
                        </h3>
                      </div>
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
            )}
          </div>
        ) : (
                                 <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
                         <div className="text-6xl mb-6">✏️</div>
                         <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                           {t('no_listings_yet', lang)}
                         </h3>
                         <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                           {isOwnProfile 
                             ? t('no_listings_owner', lang)
                             : t('no_listings_visitor', lang)
                           }
                         </p>
                         {isOwnProfile && (
                           <button className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-sm hover:shadow-md">
                             <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                             </svg>
                             + {t('create_listing', lang)}
                           </button>
                         )}
                       </div>
        )}


      </div>
    </div>
  );
}


