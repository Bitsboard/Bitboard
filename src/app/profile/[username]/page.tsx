'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ListingCard, ListingRow, ListingModal } from '@/components';
import { useBtcRate } from '@/lib/hooks/useBtcRate';
import { generateProfilePicture, getInitials, isDefaultUsername } from '@/lib/utils';
import { useSettings } from '@/lib/settings';
import { useTheme } from '@/lib/contexts/ThemeContext';
import type { Listing } from '@/lib/types';

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const btcCad = useBtcRate();
  
  // Debug: Log username parameter changes
  console.log('Profile page: Username param changed to:', username);
  console.log('Profile page: Params object:', params);
  
  // Use unified settings hook
  const { unit, layout, modals, setModal, user, setUser, closeAllModals } = useSettings();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const { active } = modals;
  
  // Check if user is viewing their own profile
  const isOwnProfile = user?.handle === username;

  const [profileImageError, setProfileImageError] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical' | 'mostExpensive' | 'leastExpensive'>('newest');
  
  // State for user data
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [allUserListings, setAllUserListings] = useState<Listing[]>([]); // Store all loaded listings for sorting
  const [userProfile, setUserProfile] = useState<{ username: string; verified: boolean; registeredAt: number; profilePhoto: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const ITEMS_PER_PAGE = 24;
  
  // Debug: Log the generated profile picture URL
  useEffect(() => {
    console.log('Generated profile picture URL for', username, ':', generateProfilePicture(username));
  }, [username]);

  // Debug: Monitor loading state changes
  useEffect(() => {
    console.log('Profile page: Loading state changed to:', isLoading);
  }, [isLoading]);

  // Fetch user listings from API with retry logic
  useEffect(() => {
    console.log('Profile page: useEffect triggered with username:', username);
    if (!username) {
      console.log('Profile page: No username, returning early');
      return;
    }
    
    // Check if this is the current user's own profile and they have a username
    if (user && user.handle === username && user.hasChosenUsername) {
      console.log('Profile page: This is the current user\'s profile, using local state');
      // Use local user state instead of making API call
      setUserProfile({
        username: user.handle,
        verified: false, // Default for new users
        registeredAt: Math.floor(Date.now() / 1000), // Current time as fallback
        profilePhoto: user.image || null
      });
      setUserListings([]); // New users won't have listings yet
      setAllUserListings([]);
      setHasMore(false);
      setCurrentPage(0);
      setIsLoading(false);
      return;
    }
    
    console.log('Profile page: Starting to fetch listings for username:', username);
    
    const fetchUserListings = async (retryCount = 0) => {
      try {
        console.log(`Profile page: Fetch attempt ${retryCount + 1}/3`);
        console.log('Profile page: Setting loading to true');
        setIsLoading(true);
        setError(null); // Clear any previous errors
        
        console.log('Profile page: Fetching from API:', `/api/users/${username}/listings`);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for faster response
        
        const response = await fetch(`/api/users/${username}/listings`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        console.log('Profile page: API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json() as { user: any; listings: Listing[] };
          console.log('Profile page: API data received:', data);
          console.log('Profile page: Number of listings:', data.listings?.length || 0);
          
          setUserProfile(data.user);
          const allListings = data.listings || [];
          setAllUserListings(allListings);
          
          // Show first page of listings
          const firstPageListings = allListings.slice(0, ITEMS_PER_PAGE);
          setUserListings(firstPageListings);
          setHasMore(allListings.length > ITEMS_PER_PAGE);
          setCurrentPage(0);
          
          // Success - always set loading to false
          setIsLoading(false);
          return;
        } else if (response.status === 404) {
          // User not found - show error immediately for non-existent users
          console.log('Profile page: User not found, showing error immediately');
          setError('user_not_found');
          setIsLoading(false);
        } else {
          console.error('Profile page: API response not ok:', response.status, response.statusText);
          setError(`Failed to load profile: ${response.status} ${response.statusText}`);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Profile page: Error fetching user listings:', error);
        
        // Handle abort errors (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Profile page: Request timed out');
          if (retryCount < 2) { // Reduced from 3 to 2 retries for faster response
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s
            console.log(`Profile page: Timeout, retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
            setTimeout(() => {
              fetchUserListings(retryCount + 1);
            }, delay);
            return;
          } else {
            setError('Request timed out. Please try again.');
            setIsLoading(false);
          }
          return;
        }
        
        // Retry on other network errors
        if (retryCount < 2) { // Reduced from 3 to 2 retries for faster response
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s
          console.log(`Profile page: Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
          // Don't set loading to false here - let the retry handle it
          setTimeout(() => {
            fetchUserListings(retryCount + 1);
          }, delay);
          return;
        } else {
          setError('Failed to load profile due to network error');
          setIsLoading(false);
        }
      }
    };
    
    fetchUserListings();
  }, [username]);

  // Sort all listings when sortBy changes
  useEffect(() => {
    if (allUserListings.length === 0) return;
    
    let sortedListings = [...allUserListings];
    
    switch (sortBy) {
      case 'newest':
        sortedListings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sortedListings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'alphabetical':
        sortedListings.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'mostExpensive':
        sortedListings.sort((a, b) => b.priceSats - a.priceSats);
        break;
      case 'leastExpensive':
        sortedListings.sort((a, b) => a.priceSats - b.priceSats);
        break;
    }
    
    setAllUserListings(sortedListings);
    
    // Reset to first page after sorting
    const firstPageListings = sortedListings.slice(0, ITEMS_PER_PAGE);
    setUserListings(firstPageListings);
    setCurrentPage(0);
    setHasMore(sortedListings.length > ITEMS_PER_PAGE);
  }, [sortBy, allUserListings.length]);
  
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
          <p className="text-neutral-600 dark:text-neutral-400">Fetching {username}&apos;s listings...</p>
          <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-2">
            If this is a newly created account, please wait a moment for the database to update...
          </p>
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
              The user <span className="font-semibold text-neutral-800 dark:text-neutral-200">{username}</span> does not exist.
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

  const loadMoreListings = () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const startIndex = nextPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    const nextPageListings = allUserListings.slice(startIndex, endIndex);
    setUserListings(prev => [...prev, ...nextPageListings]);
    setCurrentPage(nextPage);
    setHasMore(endIndex < allUserListings.length);
    setIsLoadingMore(false);
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
          
          {/* Header with Sign Out Button (only for own profile) */}
          {isOwnProfile && (
            <div className="absolute top-12 right-4">
                              <button
                  onClick={async () => {
                    try {
                      // Call logout API first
                      const response = await fetch('/api/auth/logout', { method: 'POST' });
                      
                      // Clear user state and close modals
                      setUser(null);
                      closeAllModals();
                      
                      // Force clear any stored auth data
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('user');
                        sessionStorage.clear();
                      }
                      
                                  // Redirect to home
            window.location.href = '/';
                    } catch (error) {
                      console.error('Logout failed:', error);
                      // Clear user state and redirect anyway
                      setUser(null);
                      closeAllModals();
                      
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('user');
                        sessionStorage.clear();
                      }
                      
                      window.location.href = '/';
                    }
                  }}
                  className="inline-flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-lg text-white font-medium rounded-xl hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl border border-white/30"
                >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
          
          {/* Profile Info Section - No Box */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              
              {/* Avatar Section */}
              <div className="flex-shrink-0">
                <div className="relative">
                  {!profileImageError ? (
                    <img
                      src={isOwnProfile && user?.image ? user.image : generateProfilePicture(username)}
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
                  <h1 className="text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: 'Ubuntu, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
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
                
                {/* Username Change Section - Only show for user's own profile if they have a default username */}
                {isOwnProfile && isDefaultUsername(username) && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-white/90 text-sm font-medium mb-1">
                          Claim your custom username
                        </p>
                        <p className="text-white/70 text-xs">
                          You can change your username once to something more personal
                        </p>
                      </div>
                      <button
                        onClick={() => setModal('showUsernameChange', true)}
                        className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-medium rounded-lg transition-all duration-200 border border-yellow-500/30 hover:border-yellow-500/50"
                      >
                        Change Username
                      </button>
                    </div>
                  </div>
                )}
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


        </div>
      </div>
      
      {/* Main content container */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Listings Section with Sorting */}
        {sortedListings.length > 0 && (
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-neutral-900"}`} style={{ fontFamily: 'Ubuntu, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
                  {isOwnProfile ? 'Your Listings' : 'Listings'} ({sortedListings.length})
                </h2>
                
                {/* Post New Listing Button - Only show for user's own profile when they have listings */}
                {isOwnProfile && (
                  <button 
                    onClick={() => setModal('showNew', true)}
                    className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Post New Listing
                  </button>
                )}
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <span className={`text-sm ${dark ? "text-neutral-400" : "text-neutral-600"}`}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                  className={`px-3 pr-12 py-2 rounded-lg border text-sm ${
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
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMoreListings}
                  disabled={isLoadingMore}
                  className={`inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                    isLoadingMore
                      ? 'bg-neutral-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                  }`}
                >
                  {isLoadingMore ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      Load More ({userListings.length} of {allUserListings.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {sortedListings.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className={`text-xl font-semibold mb-2 ${dark ? "text-white" : "text-neutral-900"}`}>
              {isOwnProfile ? 'No active listings' : 'No listings yet'}
            </h3>
            
            {/* Create Listing Button - Only show for user's own profile */}
            {isOwnProfile && (
              <button 
                onClick={() => setModal('showNew', true)}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Post New Listing
              </button>
            )}
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

      {/* Username Change Modal */}
      {modals.showUsernameChange && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border ${dark ? 'border-neutral-700' : 'border-neutral-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-neutral-900'}`}>
                Change Username
              </h3>
            </div>
            
            <p className={`text-neutral-600 dark:text-neutral-400 mb-6`}>
              You can change your username once to something more personal. Choose carefully!
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="newUsername" className={`block text-sm font-medium mb-2 ${dark ? 'text-white' : 'text-neutral-700'}`}>
                  New Username
                </label>
                <input
                  type="text"
                  id="newUsername"
                  placeholder="Enter your new username"
                  className={`w-full px-4 py-3 rounded-xl border text-sm ${
                    dark 
                      ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400' 
                      : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500'
                  } focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500`}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setModal('showUsernameChange', false)}
                  className={`flex-1 px-4 py-3 rounded-xl border font-medium transition-all duration-200 ${
                    dark 
                      ? 'bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600' 
                      : 'bg-white border-neutral-300 text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement username change API call
                    setModal('showUsernameChange', false);
                  }}
                  className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-xl transition-all duration-200"
                >
                  Change Username
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
