'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { mockListings } from '@/lib/mockData';
import { useThemeContext } from '@/lib/contexts/ThemeContext';

export default function PublicProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
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
      const selling = userListings.filter(l => l.type === 'sell');
      const wanted = userListings.filter(l => l.type === 'want');
      const totalValue = userListings.reduce((sum, l) => sum + l.priceSats, 0);
      
      const combinedProfileData = {
        username: username,
        email: `${username}@example.com`,
        verified: firstUser.score >= 50,
        registeredAt: '1 year ago',
        score: firstUser.score,
        deals: firstUser.deals,
        rating: firstUser.rating,
        listings: userListings,
        stats: {
          totalSelling: selling.length,
          totalWanted: wanted.length,
          totalValue: totalValue
        }
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

  const { listings } = profileData;
  const sellingListings = listings.filter((l: any) => l.type === 'sell');
  const wantedListings = listings.filter((l: any) => l.type === 'want');

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className={`rounded-2xl p-8 mb-8 border ${
          dark 
            ? "bg-neutral-900 border-neutral-800" 
            : "bg-white border-neutral-200 shadow-sm"
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br from-orange-500 to-red-500">
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
              
              <div className={`flex flex-wrap items-center gap-4 text-sm ${dark ? "text-neutral-400" : "text-neutral-600"}`}>
                <span>+{profileData.score} 👍 reputation</span>
                <span>•</span>
                <span>{profileData.deals} completed deals</span>
                <span>•</span>
                <span>⭐ {profileData.rating.toFixed(1)} rating</span>
                <span>•</span>
                <span>Joined {profileData.registeredAt}</span>
              </div>
            </div>
            
            {/* Contact Button */}
            <button className="px-6 py-3 rounded-xl font-semibold transition-colors bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400 shadow-lg">
              Send Message
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`rounded-xl p-6 border ${
            dark 
              ? "bg-neutral-900 border-neutral-800" 
              : "bg-white border-neutral-200 shadow-sm"
          }`}>
            <div className={`text-2xl font-bold mb-1 ${dark ? "text-white" : "text-neutral-900"}`}>
              {profileData.stats.totalSelling}
            </div>
            <div className={`text-sm ${dark ? "text-neutral-400" : "text-neutral-600"}`}>
              Items for sale
            </div>
          </div>
          
          <div className={`rounded-xl p-6 border ${
            dark 
              ? "bg-neutral-900 border-neutral-800" 
              : "bg-white border-neutral-200 shadow-sm"
          }`}>
            <div className={`text-2xl font-bold mb-1 ${dark ? "text-white" : "text-neutral-900"}`}>
              {profileData.stats.totalWanted}
            </div>
            <div className={`text-sm ${dark ? "text-neutral-400" : "text-neutral-600"}`}>
              Items wanted
            </div>
          </div>
          
          <div className={`rounded-xl p-6 border ${
            dark 
              ? "bg-neutral-900 border-neutral-800" 
              : "bg-white border-neutral-200 shadow-sm"
          }`}>
            <div className={`text-2xl font-bold mb-1 ${dark ? "text-white" : "text-neutral-900"}`}>
              {profileData.stats.totalValue.toLocaleString()} sats
            </div>
            <div className={`text-sm ${dark ? "text-neutral-400" : "text-neutral-600"}`}>
              Total listing value
            </div>
          </div>
        </div>

        {/* Listings Sections */}
        {sellingListings.length > 0 && (
          <div className="mb-12">
            <h2 className={`text-2xl font-bold mb-6 ${dark ? "text-white" : "text-neutral-900"}`}>
              For Sale ({sellingListings.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sellingListings.map((listing: any) => (
                <div key={listing.id} className={`rounded-lg border p-4 ${
                  dark 
                    ? "bg-neutral-900 border-neutral-800" 
                    : "bg-white border-neutral-200 shadow-sm"
                }`}>
                  <h3 className={`font-semibold mb-2 ${dark ? "text-white" : "text-neutral-900"}`}>
                    {listing.title}
                  </h3>
                  <p className={`text-sm mb-2 ${dark ? "text-neutral-400" : "text-neutral-600"}`}>
                    {listing.description}
                  </p>
                  <div className={`text-lg font-bold ${dark ? "text-orange-400" : "text-orange-600"}`}>
                    {listing.priceSats.toLocaleString()} sats
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {wantedListings.length > 0 && (
          <div className="mb-12">
            <h2 className={`text-2xl font-bold mb-6 ${dark ? "text-white" : "text-neutral-900"}`}>
              Looking For ({wantedListings.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wantedListings.map((listing: any) => (
                <div key={listing.id} className={`rounded-lg border p-4 ${
                  dark 
                    ? "bg-neutral-900 border-neutral-800" 
                    : "bg-white border-neutral-200 shadow-sm"
                }`}>
                  <h3 className={`font-semibold mb-2 ${dark ? "text-white" : "text-neutral-900"}`}>
                    {listing.title}
                  </h3>
                  <p className={`text-sm mb-2 ${dark ? "text-neutral-400" : "text-neutral-600"}`}>
                    {listing.description}
                  </p>
                  <div className={`text-lg font-bold ${dark ? "text-purple-400" : "text-purple-600"}`}>
                    {listing.priceSats.toLocaleString()} sats
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {listings.length === 0 && (
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
