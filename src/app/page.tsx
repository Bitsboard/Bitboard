"use client";

import React, { useState, useEffect } from "react";
import {
  ListingModal,
  ChatModal,
  NewListingModal,
  AuthModal,
  LocationModal,
  HeroSection,
  ListingsSection,
} from "@/components";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { useSettings } from "@/lib/settings";
import { useListings, useLocation, useBtcRate, useSearchFilters, useModals } from "@/lib/hooks";
import { useThemeContext } from "@/lib/contexts/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Listing, User } from "@/lib/types";
import { mockListings } from '@/lib/mockData';

export default function HomePage() {
  // Use centralized settings
  const { unit, layout } = useSettings();
  const { dark } = useThemeContext();

  // State
  const [user, setUser] = useState<User | null>(null);
  const ENV = process.env.NEXT_PUBLIC_ENV || process.env.NEXT_PUBLIC_BRANCH || 'development';
  const isDeployed = ENV === "production" || ENV === "staging" || ENV === "main"; // Include staging and main
  
  // Debug logging
  console.log('Environment:', ENV);
  console.log('Is Deployed:', isDeployed);
  console.log('NEXT_PUBLIC_ENV:', process.env.NEXT_PUBLIC_ENV);
  console.log('NEXT_PUBLIC_BRANCH:', process.env.NEXT_PUBLIC_BRANCH);
  
  const router = useRouter();
  const lang = useLang();

  // Custom hooks
  const { center, radiusKm, updateLocation } = useLocation();
  const btcCad = useBtcRate();
  
  // Use the actual useListings hook to load from database
  const { listings, total, isLoading, hasMore, isLoadingMore, loadMore } = useListings(center, radiusKm, isDeployed);
  
  // Fallback: Force database usage if we're on staging domain
  const forceDatabase = typeof window !== 'undefined' && window.location.hostname.includes('pages.dev');
  const finalIsDeployed = isDeployed || forceDatabase;
  
  // Debug logging for listings
  console.log('Listings from hook:', listings);
  console.log('Total from hook:', total);
  console.log('Is loading:', isLoading);
  console.log('Force database:', forceDatabase);
  console.log('Final isDeployed:', finalIsDeployed);
  
  // Test API call directly
  useEffect(() => {
    if (finalIsDeployed) {
      fetch('/api/listings?limit=5')
        .then(res => res.json())
        .then(data => {
          console.log('Direct API response:', data);
        })
        .catch(err => {
          console.error('Direct API error:', err);
        });
    }
  }, [finalIsDeployed]);
  
  const { query, setQuery, cat, setCat, adType, setAdType, goods, services, featured } = useSearchFilters(listings);
  
  const {
    active, setActive, chatFor, setChatFor, showNew, setShowNew,
    showAuth, setShowAuth, showLocationModal, setShowLocationModal,
    closeAllModals, requireAuth
  } = useModals();

  // Re-translate "My Location" label when locale changes
  useEffect(() => {
    try {
      const using = localStorage.getItem('usingMyLocation') === '1';
      if (using) {
        // This would need to be handled in the useLocation hook
      }
    } catch (error) {
      console.warn('Failed to update location label:', error);
    }
  }, [lang]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAllModals();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeAllModals]);

  const handleSearchNavigate = () => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (cat && cat !== "Featured") sp.set("category", cat);
    if (adType && adType !== "all") sp.set("adType", adType);
    try { localStorage.setItem('layoutPref', layout); } catch { }
    sp.set('layout', layout);
    const known = ['en', 'fr', 'es', 'de'] as const;
    const first = (typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean)[0] : '') as typeof known[number] | '';
    const locale = (first && (known as readonly string[]).includes(first)) ? first : lang;
    const prefix = `/${locale}`;
    router.push(`${prefix}/search?${sp.toString()}`);
  };

  const handleLocationUpdate = async (place: any, radius: number) => {
    await updateLocation(place, radius);
    setShowLocationModal(false);
  };

  const bg = dark ? "bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" : "bg-gradient-to-br from-neutral-50 via-white to-neutral-100";

  return (
    <ErrorBoundary>
      <div className={cn("min-h-screen", bg, dark ? "dark" : "")}>
        {/* Simple test - just add text to see if deployment works */}
        <div className="fixed top-0 left-0 z-50 bg-yellow-400 text-black p-2 text-sm font-bold">
          TEST: If you see this, deployment is working!
        </div>
        
        {/* Global header is rendered via layout */}

        {/* Hero Section */}
        <HeroSection
          center={center}
          radiusKm={radiusKm}
          query={query}
          setQuery={setQuery}
          onLocationClick={() => setShowLocationModal(true)}
          onSearch={handleSearchNavigate}
          dark={dark}
        />

        {/* Listings Section */}
        <ListingsSection
          featured={featured}
          goods={goods}
          services={services}
          layout={layout}
          unit={unit}
          btcCad={btcCad}
          dark={dark}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onOpen={setActive}
          onLoadMore={loadMore}
        />

        {/* Global footer is rendered via layout */}

        {/* Modals */}
        {showLocationModal && (
          <LocationModal
            open={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            initialCenter={{ lat: center.lat, lng: center.lng, name: center.name }}
            initialRadiusKm={radiusKm}
            dark={dark}
            onApply={handleLocationUpdate}
          />
        )}
        {active && (
          <ListingModal
            listing={active}
            open={!!active}
            onClose={() => setActive(null)}
            unit={unit}
            btcCad={btcCad}
            dark={dark}
            onChat={() => requireAuth(() => setChatFor(active))}
          />
        )}
        {chatFor && (
          <ChatModal listing={chatFor} onClose={() => setChatFor(null)} dark={dark} btcCad={btcCad} unit={unit} />
        )}
        {showNew && (
          <NewListingModal
            dark={dark}
            onClose={() => setShowNew(false)}
            onPublish={(item: Listing) => {
              // This would need to be handled properly with the listings state
              setShowNew(false);
            }}
          />
        )}
        {showAuth && (
          <AuthModal
            dark={dark}
            onClose={() => setShowAuth(false)}
            onAuthed={(u: User) => {
              setUser(u);
              setShowAuth(false);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
