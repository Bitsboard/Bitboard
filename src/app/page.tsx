"use client";

import React, { useState, useEffect } from "react";
import {
  ListingModal,
  ChatModal,
  NewListingModal,
  LocationModal,
  HeroSection,
  ListingsSection,
} from "@/components";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { useSettings } from "@/lib/settings";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { useListings, useSearchFilters } from "@/lib/hooks";
import { useBtcRate } from "@/lib/contexts/BtcRateContext";
import { useLocation } from "@/lib/contexts/LocationContext";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Listing, User } from "@/lib/types";

export default function HomePage() {
  // Use centralized settings
  const { unit, layout, user } = useSettings();
  const { theme, isDark } = useTheme();
  const dark = isDark;


  
  const ENV = process.env.NEXT_PUBLIC_ENV || process.env.NEXT_PUBLIC_BRANCH || 'development';
  const isDeployed = true; // Force real API usage - no more mock data
  

  
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
  
  // Use actual listings from database instead of mock data
  const { query, setQuery, cat, setCat, adType, setAdType, goods, services, featured } = useSearchFilters(listings);
  
  const { modals, setModal, closeAllModals } = useSettings();
  const { active, chatFor, showNew, showAuth, showLocationModal } = modals;

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
    console.log('HomePage: Location update requested:', { place, radius });
    await updateLocation(place, radius);
    console.log('HomePage: Location updated via unified service');
    setModal('showLocationModal', false);
  };



  return (
    <ErrorBoundary>
      <div className={cn(
        "min-h-screen",
        dark 
          ? "bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 dark" 
          : "bg-gradient-to-br from-neutral-50 via-white to-neutral-100"
      )}>

        
        {/* Global header is rendered via layout */}

        {/* Hero Section */}
        <HeroSection
          center={center}
          radiusKm={radiusKm}
          query={query}
          setQuery={setQuery}
          onLocationClick={() => setModal('showLocationModal', true)}
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
          onOpen={(listing) => setModal('active', listing)}
          onLoadMore={loadMore}
        />

        {/* Global footer is rendered via layout */}



        {/* Modals */}
        {showLocationModal && (
          <LocationModal
            open={showLocationModal}
            onClose={() => setModal('showLocationModal', false)}
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
            onClose={() => setModal('active', null)}
            unit={unit}
            btcCad={btcCad}
            dark={dark}
            user={user}
            onShowAuth={() => setModal('showAuth', true)}
          />
        )}
        {/* Remove old chat modal since ListingModal now handles transformation */}
        {/* {chatFor && (
          <ChatModal listing={chatFor} onClose={() => setModal('chatFor', null)} dark={dark} btcCad={btcCad} unit={unit} />
        )} */}
        {showNew && (
          <NewListingModal
            dark={dark}
            onClose={() => setModal('showNew', false)}
            onPublish={(item: Listing) => {
              // This would need to be handled properly with the listings state
              setModal('showNew', false);
            }}
          />
        )}

      </div>
    </ErrorBoundary>
  );
}
