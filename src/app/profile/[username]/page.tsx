'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ListingCard } from '@/components/ListingCard';
import { PriceBlock } from '@/components/PriceBlock';
import { cn } from '@/lib/utils';
import { mockListings } from '@/lib/mockData';
import { useSettings } from '@/lib/settings';
import { useThemeContext } from '@/lib/contexts/ThemeContext';
import { useBtcRate } from '@/lib/hooks';
import type { Listing } from '@/lib/types';

interface ProfileData {
  username: string;
  email: string;
  verified: boolean;
  registeredAt: string;
  score: number;
  deals: number;
  rating: number;
  listings: Listing[];
  stats: {
    totalSelling: number;
    totalWanted: number;
    totalValue: number;
  };
}

export default function PublicProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const params = useParams();
  const username = params.username as string;
  const { unit } = useSettings();
  const { dark } = useThemeContext();
  const btcCad = useBtcRate();

  useEffect(() => {
    // Find user in mock data
    const userListings = mockListings.filter(listing => listing.seller.name === username);
    
    if (userListings.length > 0) {
      const firstUser = userListings[0].seller;
      const selling = userListings.filter(l => l.type === 'sell');
      const wanted = userListings.filter(l => l.type === 'want');
      const totalValue = userListings.reduce((sum, l) => sum + l.priceSats, 0);
      
      const combinedProfileData: ProfileData = {
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
      setProfileData(combinedProfileData);
    } else {
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
  const sellingListings = listings.filter(l => l.type === 'sell');
  const wantedListings = listings.filter(l => l.type === 'want');

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className={cn(
          "rounded-2xl p-8 mb-8 border",
          dark 
            ? "bg-neutral-900 border-neutral-800" 
            : "bg-white border-neutral-200 shadow-sm"
        )}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white",
              "bg-gradient-to-br from-orange-500 to-red-500"
            )}>
              {username.charAt(0).toUpperCase()}
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className={cn("text-3xl font-bold", dark ? "text-white" : "text-neutral-900")}>
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
              
              <div className={cn("flex flex-wrap items-center gap-4 text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
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
            <button className={cn(
              "px-6 py-3 rounded-xl font-semibold transition-colors",
              "bg-gradient-to-r from-orange-500 to-red-500 text-white",
              "hover:from-orange-400 hover:to-red-400 shadow-lg"
            )}>
              Send Message
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={cn(
            "rounded-xl p-6 border",
            dark 
              ? "bg-neutral-900 border-neutral-800" 
              : "bg-white border-neutral-200 shadow-sm"
          )}>
            <div className={cn("text-2xl font-bold mb-1", dark ? "text-white" : "text-neutral-900")}>
              {profileData.stats.totalSelling}
            </div>
            <div className={cn("text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
              Items for sale
            </div>
          </div>
          
          <div className={cn(
            "rounded-xl p-6 border",
            dark 
              ? "bg-neutral-900 border-neutral-800" 
              : "bg-white border-neutral-200 shadow-sm"
          )}>
            <div className={cn("text-2xl font-bold mb-1", dark ? "text-white" : "text-neutral-900")}>
              {profileData.stats.totalWanted}
            </div>
            <div className={cn("text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
              Items wanted
            </div>
          </div>
          
          <div className={cn(
            "rounded-xl p-6 border",
            dark 
              ? "bg-neutral-900 border-neutral-800" 
              : "bg-white border-neutral-200 shadow-sm"
          )}>
            <div className="mb-1">
              <PriceBlock 
                sats={profileData.stats.totalValue} 
                unit={unit} 
                btcCad={btcCad} 
                dark={dark} 
                size="lg" 
              />
            </div>
            <div className={cn("text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
              Total listing value
            </div>
          </div>
        </div>

        {/* Listings Sections */}
        {sellingListings.length > 0 && (
          <div className="mb-12">
            <h2 className={cn("text-2xl font-bold mb-6", dark ? "text-white" : "text-neutral-900")}>
              For Sale ({sellingListings.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sellingListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  unit={unit}
                  btcCad={btcCad}
                  dark={dark}
                  onOpen={() => {
                    // Handle listing open - could open modal or navigate
                    console.log('Open listing:', listing.id);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {wantedListings.length > 0 && (
          <div className="mb-12">
            <h2 className={cn("text-2xl font-bold mb-6", dark ? "text-white" : "text-neutral-900")}>
              Looking For ({wantedListings.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wantedListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  unit={unit}
                  btcCad={btcCad}
                  dark={dark}
                  onOpen={() => {
                    // Handle listing open - could open modal or navigate
                    console.log('Open listing:', listing.id);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {listings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className={cn("text-xl font-semibold mb-2", dark ? "text-white" : "text-neutral-900")}>
              No listings yet
            </h3>
            <p className={cn("text-neutral-600 dark:text-neutral-400")}>
              {username} hasn't posted any listings yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
