"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSettings } from "@/lib/settings";
import { ListingCard, ListingRow, ListingModal } from "@/components";
import { generateProfilePicture, getInitials } from "@/lib/utils";
import type { Session, Listing } from "@/lib/types";

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical' | 'mostExpensive' | 'leastExpensive'>('newest');
  const [profileImageError, setProfileImageError] = useState(false);
  const router = useRouter();
  const lang = useLang();
  
  // Use global settings
  const { theme, unit, layout } = useSettings();
  const { modals, setModal } = useSettings();
  const dark = theme === 'dark';
  const { active } = modals;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json() as { session?: Session | null };
          setSession(data?.session || null);
        }
      } catch (error) {
        console.error('Failed to check authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && !session) {
      router.push('/');
    }
  }, [loading, session, router]);

  const handleListingClick = (listing: Listing) => {
    setModal('active', listing);
  };

  const closeModal = () => {
    setModal('active', null);
  };

  const handleProfileImageError = () => {
    setProfileImageError(true);
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", dark ? "bg-neutral-950" : "bg-white")}>
        <div className={cn(dark ? "text-neutral-400" : "text-neutral-600")}>Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getSortedListings = () => {
    if (!session?.account?.listings) return [];

    const sorted = [...session.account.listings];
    switch (sortBy) {
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'newest':
        return sorted.sort((a, b) => b.createdAt - a.createdAt);
      case 'oldest':
        return sorted.sort((a, b) => a.createdAt - b.createdAt);
      case 'mostExpensive':
        return sorted.sort((a, b) => b.priceSat - a.priceSat);
      case 'leastExpensive':
        return sorted.sort((a, b) => a.priceSat - b.priceSat);
      default:
        return sorted;
    }
  };

  const sortedListings = getSortedListings();
  const username = session.user?.username || 'User';
  const listings = session.account?.listings || [];
  const memberSince = session.account?.registeredAt 
    ? new Date(session.account.registeredAt * 1000).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long' 
      })
    : 'Recently';

  return (
    <ErrorBoundary>
      <div className={cn("min-h-screen", dark ? "bg-neutral-950" : "bg-white")}>
        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Top Bar - Profile Info */}
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-3xl p-8 mb-8 text-white shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-black/5 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

            {/* Sign Out Button - Top Right */}
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

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-8">
              {/* Profile Picture */}
              <div className="relative">
                {session.account?.profilePhoto ? (
                  <img
                    src={session.account.profilePhoto}
                    alt="Profile"
                    className="h-28 w-28 rounded-full border-4 shadow-2xl ring-4 border-black ring-white/20"
                  />
                ) : (
                  <div className="h-28 w-28 rounded-full flex items-center justify-center shadow-2xl ring-4 bg-gradient-to-br from-white/30 to-white/20 border-4 border-black ring-white/20">
                    <svg className="h-14 w-14 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                {session.account?.verified && (
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full p-2 shadow-lg ring-2 ring-white/50 bg-[length:200%_200%] animate-gradient-x">
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
                        {new Date((session.account?.registeredAt || 0) * 1000).toLocaleDateString(undefined, {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400/30 to-orange-500/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-200" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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

          {/* Post New Listing Button */}
          <div className="mb-8">
            <button 
              onClick={() => setModal('showNew', true)}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              + Post New Listing
            </button>
          </div>

          {/* Listings Section */}
          {session.account?.listings && session.account.listings.length > 0 ? (
            <div className={cn("rounded-2xl border p-6 shadow-sm", dark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
              {/* Listings Header with Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className={cn("text-xl font-semibold", dark ? "text-white" : "text-neutral-900")}>
                    Your Listings
                  </h2>
                  <p className={cn("text-sm mt-1", dark ? "text-neutral-400" : "text-neutral-500")}>
                    {sortedListings.length} {sortedListings.length !== 1 ? t('items', lang) : t('item', lang)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                    className={cn("px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent", 
                      dark ? "border-neutral-600 bg-neutral-800 text-white" : "border-neutral-300 bg-white text-neutral-900"
                    )}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="mostExpensive">Most Expensive</option>
                    <option value="leastExpensive">Least Expensive</option>
                  </select>
                </div>
              </div>

              {/* Listings Grid */}
              <div className={cn("gap-6", 
                layout === 'list' 
                  ? "space-y-4" 
                  : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              )}>
                {sortedListings.map((listing) => (
                  <div
                    key={listing.id}
                    className={cn("border transition-colors duration-200", 
                      layout === 'list' 
                        ? "rounded-lg p-4 flex items-center justify-between"
                        : "rounded-xl p-4",
                      dark 
                        ? "bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800" 
                        : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium", 
                        listing.type === 'selling'
                          ? dark ? "bg-green-900/20 text-green-300" : "bg-green-100 text-green-800"
                          : dark ? "bg-blue-900/20 text-blue-300" : "bg-blue-100 text-blue-800"
                      )}>
                        {listing.type === 'selling' ? t('selling', lang) : t('looking_for', lang)}
                      </span>
                      <span className={cn("text-xs", dark ? "text-neutral-400" : "text-neutral-500")}>
                        {new Date(listing.createdAt * 1000).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <h3 className={cn("font-medium mb-3 line-clamp-2", dark ? "text-white" : "text-neutral-900")}>
                      {listing.title}
                    </h3>
                    <div className="text-right">
                      <div className={cn("text-lg font-semibold", dark ? "text-orange-400" : "text-orange-600")}>
                        {listing.priceSat.toLocaleString()} {unit === 'BTC' ? 'BTC' : 'sats'}
                      </div>
                      <div className={cn("text-xs", dark ? "text-neutral-400" : "text-neutral-500")}>
                        ~${(listing.priceSat / 100000000 * 45000).toFixed(2)} CAD
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={cn("rounded-2xl border p-12 text-center", dark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
              <div className="text-6xl mb-6">✏️</div>
              <h3 className={cn("text-xl font-semibold mb-2", dark ? "text-white" : "text-neutral-900")}>
                {t('no_listings_yet', lang)}
              </h3>
              <p className={cn("mb-6", dark ? "text-neutral-400" : "text-neutral-600")}>
                {t('no_listings_owner', lang)}
              </p>
              <button className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-sm hover:shadow-md">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('create_listing', lang)}
              </button>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}


