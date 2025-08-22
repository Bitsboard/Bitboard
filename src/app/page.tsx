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
  const ENV = process.env.NEXT_PUBLIC_ENV;
  const isDeployed = ENV === "production";
  
  const router = useRouter();
  const lang = useLang();

  // Custom hooks
  const { center, radiusKm, updateLocation } = useLocation();
  const btcCad = useBtcRate();
  
  // Use mock data directly since useListings hook has issues
  const listings = mockListings;
  const total = mockListings.length;
  const isLoading = false;
  const hasMore = false;
  const isLoadingMore = false;
  const loadMore = () => {};
  
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
