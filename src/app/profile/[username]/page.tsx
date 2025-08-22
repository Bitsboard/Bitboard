'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { mockListings } from '@/lib/mockData';
import { useThemeContext } from '@/lib/contexts/ThemeContext';
import { ListingCard } from '@/components';

export default function PublicProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical' | 'mostExpensive' | 'leastExpensive'>('newest');
  const params = useParams();
  const username = params.username as string;
  const { dark } = useThemeContext();

  useEffect(() => {
    console.log('Profile page useEffect triggered');
    console.log('Username:', username);
    console.log('Mock listings count:', mockListings.length);
    
    // Find user in mock data
    const userListings = mockListings.filter(listing => listing.seller.name === username);
    console.log('Found user listings:', userListings.length);
    console.log('User listings:', userListings);
    
    if (userListings.length > 0) {
      const firstUser = userListings[0].seller;
      
      const combinedProfileData = {
        username: username,
        email: `${username}@example.com`,
        verified: firstUser.score >= 50,
        registeredAt: '1 year ago',
        score: firstUser.score,
        deals: firstUser.deals,
        rating: firstUser.rating,
        listings: userListings
      };
      console.log('Setting profile data:', combinedProfileData);
      setProfileData(combinedProfileData);
    } else {
      console.log('No user listings found, setting profile data to null');
      setProfileData(null);
    }
    
    setLoading(false);
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Profile not found</h1>
          <p className="text-neutral-600 dark:text-neutral-400">This user doesn't exist or hasn't set up their profile yet.</p>
        </div>
      </div>
    );
  }

  // Sort listings based on current sort option
  const getSortedListings = () => {
    const listings = [...profileData.listings];
    
    switch (sortBy) {
      case 'newest':
        return listings.sort((a, b) => b.createdAt - a.createdAt);
      case 'oldest':
        return listings.sort((a, b) => a.createdAt - b.createdAt);
      case 'alphabetical':
        return listings.sort((a, b) => a.title.localeCompare(b.title));
      case 'mostExpensive':
        return listings.sort((a, b) => b.priceSats - a.priceSats);
      case 'leastExpensive':
        return listings.sort((a, b) => a.priceSats - b.priceSats);
      default:
        return listings;
    }
  };

  const sortedListings = getSortedListings();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Orange Bar at Top */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 h-32 w-full"></div>
      
      <div className="max-w-4xl mx-auto px-4 -mt-16 pb-8">
        {/* Profile Header */}
        <div className={`rounded-2xl p-8 mb-8 border ${
          dark 
            ? "bg-neutral-900 border-neutral-800" 
            : "bg-white border-neutral-200 shadow-lg"
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br from-orange-500 to-red-500 border-4 border-white shadow-lg">
              {username.charAt(0).toUpperCase()}
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-3xl font-bold ${dark ? "text-white" : "text-neutral-900"}`}>
                  {username}
                </h1>
                {profileData.verified && (
                  <span 
                    className="verified-badge inline-flex h-6 w-6 items-center justify-center rounded-full text-white font-extrabold shadow-[0_0_8px_rgba(56,189,248,0.8)] bg-sky-500"
                    aria-label="Verified"
                    title="Verified user"
                  >
                    ✓
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Three Main Stats - Member Since, Active Listings, Reputation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-xl p-5 border transition-all duration-200 hover:scale-105 ${
              dark 
                ? "bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-700/50 hover:border-blue-600/50" 
                : "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:border-blue-300 shadow-md hover:shadow-lg"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className={`text-sm font-medium ${dark ? "text-blue-200" : "text-blue-700"}`}>
                  Member Since
                </div>
              </div>
              <div className={`text-2xl font-bold ${dark ? "text-blue-100" : "text-blue-800"}`}>
                {profileData.registeredAt}
              </div>
            </div>
            
            <div className={`rounded-xl p-5 border transition-all duration-200 hover:scale-105 ${
              dark 
                ? "bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-700/50 hover:border-green-600/50" 
                : "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:border-green-300 shadow-md hover:shadow-lg"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className={`text-sm font-medium ${dark ? "text-green-200" : "text-green-700"}`}>
                  Active Listings
                </div>
              </div>
              <div className={`text-2xl font-bold ${dark ? "text-green-100" : "text-green-800"}`}>
                {profileData.listings.length}
              </div>
            </div>
            
            <div className={`rounded-xl p-5 border transition-all duration-200 hover:scale-105 ${
              dark 
                ? "bg-gradient-to-br from-orange-900/50 to-orange-800/50 border-orange-700/50 hover:border-orange-600/50" 
                : "bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200 hover:border-orange-300 shadow-md hover:shadow-lg"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-800 flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className={`text-sm font-medium ${dark ? "text-orange-200" : "text-orange-700"}`}>
                  Reputation
                </div>
              </div>
              <div className={`text-2xl font-bold ${dark ? "text-orange-100" : "text-orange-800"}`}>
                +{profileData.score}
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section with Sorting */}
        {sortedListings.length > 0 && (
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-neutral-900"}`}>
                Listings ({sortedListings.length})
              </h2>
              
              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <span className={`text-sm ${dark ? "text-neutral-400" : "text-neutral-600"}`}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'alphabetical' | 'mostExpensive' | 'leastExpensive')}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    dark 
                      ? "bg-neutral-800 border-neutral-700 text-white" 
                      : "bg-white border-neutral-300 text-neutral-900"
                  }`}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="mostExpensive">Most Expensive</option>
                  <option value="leastExpensive">Least Expensive</option>
                </select>
              </div>
            </div>
            
            {/* Listings Grid using ListingCard component */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedListings.map((listing: any) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  unit="sats"
                  dark={dark}
                  btcCad={0} // Placeholder value since we don't have BTC rate in profile context
                  onOpen={() => {}} // We could add a modal here if needed
                />
              ))}
            </div>
          </div>
        )}

        {sortedListings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className={`text-xl font-semibold mb-2 ${dark ? "text-white" : "text-neutral-900"}`}>
              No listings yet
            </h3>
            <p className={`text-neutral-600 dark:text-neutral-400`}>
              {username} hasn't posted any listings yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
