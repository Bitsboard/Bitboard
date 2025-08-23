'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ListingCard, ListingRow, ListingModal } from '@/components';
import { useBtcRate } from '@/lib/hooks/useBtcRate';
import { generateProfilePicture, getInitials } from '@/lib/utils';
import { useSettings, useUnifiedTheme } from '@/lib/settings';
import type { Listing } from '@/lib/types';

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const btcCad = useBtcRate();
  
  // Use unified settings hook
  const { unit, layout, modals, setModal, user, setUser, closeAllModals } = useSettings();
  const { theme } = useUnifiedTheme();
  const dark = theme === 'dark';
  const { active } = modals;
  
  // Check if user is viewing their own profile
  const isOwnProfile = user?.handle === username;

  const [profileImageError, setProfileImageError] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical' | 'mostExpensive' | 'leastExpensive'>('newest');
  
  // State for user data
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [userProfile, setUserProfile] = useState<{ username: string; verified: boolean; registeredAt: number; profilePhoto: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Debug: Log the generated profile picture URL
  useEffect(() => {
    console.log('Generated profile picture URL for', username, ':', generateProfilePicture(username));
  }, [username]);

  // Fetch user listings from API
  useEffect(() => {
    if (!username) return;
    
    console.log('Profile page: Starting to fetch listings for username:', username);
    
    const fetchUserListings = async () => {
      try {
        console.log('Profile page: Setting loading to true');
        setIsLoading(true);
        
        console.log('Profile page: Fetching from API:', `/api/users/${username}/listings`);
        const response = await fetch(`/api/users/${username}/listings`);
        
        console.log('Profile page: API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json() as { user: any; listings: Listing[] };
          console.log('Profile page: API data received:', data);
          console.log('Profile page: Number of listings:', data.listings?.length || 0);
          
          setUserProfile(data.user);
          setUserListings(data.listings || []);
        } else if (response.status === 404) {
          // User not found - set specific error
          setError('user_not_found');
        } else {
          console.error('Profile page: API response not ok:', response.status, response.statusText);
          setError(`Failed to load profile: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Profile page: Error fetching user listings:', error);
      } finally {
        console.log('Profile page: Setting loading to false');
        setIsLoading(false);
      }
    };
    
    fetchUserListings();
  }, [username]);
  
  // Early return if username is not available yet
  if (!username) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Loading...</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Please wait while we load the profile.</p>
        </div>
      </div>
    );
  }
  
  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Loading Profile...</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Fetching {username}'s listings...</p>
        </div>
      </div>
    );
  }
  
  // Show error state if something went wrong
  if (error) {
    if (error === 'user_not_found') {
      return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">👤</div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">User Not Found</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              The user <span className="font-semibold text-neutral-800 dark:text-neutral-200">@{username}</span> does not exist.
            </p>
            <div className="mt-6">
              <a 
                href="/" 
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-400 hover:to-red-400 transition-all duration-200"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Error Loading Profile</h1>
          <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }
  
  // Use BTC rate with fallback for better UX
  const effectiveBtcCad = btcCad || 157432;

  // Get user info from API response or fallback to default values
  const userVerified = userProfile?.verified || false;
  const userScore = 0; // Start with 0 reputation for new users
  const oldestListing = userListings.length > 0 ? userListings.reduce((oldest, current) => 
    current.createdAt < oldest.createdAt ? current : oldest
  ) : null;
  const memberSinceDate = oldestListing ? new Date(oldestListing.createdAt) : new Date();
  
  // Use locale-aware date formatting with fallback
  const memberSince = (() => {
    try {
      // Try to get the current locale from the browser
      const currentLocale = navigator.language || 'en-US';
      return memberSinceDate.toLocaleDateString(currentLocale, { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (error) {
      // Fallback to English if locale formatting fails
      return memberSinceDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
  })();

  // Sort listings based on selected sort option
  const getSortedListings = () => {
    try {
      const listings = [...userListings];
      
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
          return listings.sort((a, b) => b.createdAt - a.createdAt);
      }
    } catch (error) {
      console.error('Error sorting listings:', error);
      // Return original order if sorting fails
      return userListings;
    }
  };

  const sortedListings = getSortedListings();

  const handleListingClick = (listing: Listing) => {
    try {
      setModal('active', listing);
    } catch (error) {
      console.error('Error opening listing:', error);
    }
  };

  const closeModal = () => {
    try {
      setModal('active', null);
    } catch (error) {
      console.error('Error closing modal:', error);
    }
  };

  const handleProfileImageError = () => {
    try {
      console.log('Profile image failed to load for:', username);
      console.log('Generated URL:', generateProfilePicture(username));
      setProfileImageError(true);
    } catch (error) {
      console.error('Error handling profile image error:', error);
      setProfileImageError(true);
    }
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    try {
      setSortBy(newSort);
    } catch (error) {
      console.error('Error changing sort:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Modern Profile Header */}
      <div className="relative bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 overflow-hidden">
        {/* Geometric background pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-20 left-20 w-40 h-40 border border-white/20 rounded-3xl rotate-12"></div>
            <div className="absolute top-40 right-32 w-24 h-24 border border-white/30 rounded-2xl -rotate-45"></div>
            <div className="absolute bottom-20 left-1/3 w-32 h-32 border border-white/15 rounded-full"></div>
            <div className="absolute top-1/2 right-20 w-16 h-16 bg-white/5 rounded-xl rotate-45"></div>
          </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
          
          {/* Profile Info Section - No Box */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              
              {/* Avatar Section */}
              <div className="flex-shrink-0">
                <div className="relative">
                  {!profileImageError ? (
                    <img
                      src={generateProfilePicture(username)}
                      alt={`${username}'s profile picture`}
                      className="w-28 h-28 rounded-full object-cover shadow-xl border-4 border-white/30"
                      onError={handleProfileImageError}
                      onLoad={() => console.log('Profile image loaded successfully for:', username)}
                      style={{ minWidth: '112px', minHeight: '112px' }}
                    />
                  ) : (
                    <div className="w-28 h-32 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl border-4 border-white/30">
                      <span className="flex items-center justify-center w-full h-full leading-none" style={{ fontFamily: 'Ubuntu, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
                        {getInitials(username)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl lg:text-5xl font-bold text-white truncate" style={{ fontFamily: 'Ubuntu, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
                    {username}
                  </h1>
                  {userVerified && (
                    <span 
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white font-bold shadow-lg border-2 border-white"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                      }}
                      aria-label="Verified"
                      title="User has verified their identity"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>
                <div className="text-white/80 mb-4">
                  <span className="text-sm">Member since {memberSince}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Last Seen */}
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 p-6 hover:bg-white/30 transition-all duration-300 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-white mb-1 font-medium">Last seen</div>
                  <div className="text-lg font-semibold text-white">Today</div>
                </div>
              </div>
            </div>

            {/* Reputation */}
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 p-6 hover:bg-white/30 transition-all duration-300 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-white mb-1 font-medium">Reputation</div>
                  <div className="text-lg font-semibold text-white">+{userScore}</div>
                </div>
              </div>
            </div>

            {/* Active Listings */}
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl border border-white/30 p-6 hover:bg-white/30 transition-all duration-300 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-white mb-1 font-medium">Active Listings</div>
                  <div className="text-lg font-semibold text-white">{userListings.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Only show for user's own profile */}
          {isOwnProfile && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-8">
              {/* Post New Listing Button */}
              <button 
                onClick={() => setModal('showNew', true)}
                className="inline-flex items-center justify-center px-6 py-3 bg-white/20 backdrop-blur-lg text-white font-medium rounded-xl hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl border border-white/30"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Post New Listing
              </button>

              {/* Sign Out Button */}
              <button
                onClick={async () => {
                  try {
                    // Clear user state first
                    setUser(null);
                    // Close any open modals
                    closeAllModals();
                    // Call logout API
                    const response = await fetch('/api/auth/logout', { method: 'POST' });
                    // Redirect to home regardless of API response
                    window.location.href = '/';
                  } catch (error) {
                    console.error('Logout failed:', error);
                    // Clear user state and redirect anyway
                    setUser(null);
                    closeAllModals();
                    window.location.href = '/';
                  }
                }}
                className="inline-flex items-center justify-center px-6 py-3 bg-white/20 backdrop-blur-lg text-white font-medium rounded-xl hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl border border-white/30"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Main content container */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Listings Section with Sorting */}
        {sortedListings.length > 0 && (
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-neutral-900"}`} style={{ fontFamily: 'Ubuntu, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
                {isOwnProfile ? 'Your Listings' : 'Listings'} ({sortedListings.length})
              </h2>
              
              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <span className={`text-sm ${dark ? "text-neutral-400" : "text-neutral-600"}`}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
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
            
            {/* Listings Display */}
            {layout === 'grid' ? (
              /* Grid View using ListingCard component */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedListings.map((listing: any) => (
                  <div key={listing.id} onClick={() => handleListingClick(listing)} className="cursor-pointer">
                    <ListingCard
                      listing={listing}
                      unit={unit}
                      dark={dark}
                      btcCad={effectiveBtcCad}
                      onOpen={() => handleListingClick(listing)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* List View using ListingRow component */
              <div className="space-y-4">
                {sortedListings.map((listing: any) => (
                  <div key={listing.id} onClick={() => handleListingClick(listing)} className="cursor-pointer">
                    <ListingRow
                      listing={listing}
                      unit={unit}
                      dark={dark}
                      btcCad={effectiveBtcCad}
                      onOpen={() => handleListingClick(listing)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {sortedListings.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className={`text-xl font-semibold mb-2 ${dark ? "text-white" : "text-neutral-900"}`}>
              No listings yet
            </h3>
            <p className={`text-neutral-600 dark:text-neutral-400`}>
              {isOwnProfile ? "You haven't posted any listings yet." : `${username} hasn't posted any listings yet.`}
            </p>
          </div>
        )}
      </div>

      {/* Listing Modal */}
      {active && (
        <ListingModal
          listing={active}
          open={!!active}
          onClose={closeModal}
          unit={unit}
          dark={dark}
          btcCad={effectiveBtcCad}
          onChat={() => {
            if (!user) {
              setModal('showAuth', true);
            } else {
              setModal('chatFor', active);
            }
          }}
        />
      )}
    </div>
  );
}
