"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Nav,
  UnitToggle,
  TypeToggle,
  ListingCard,
  ListingRow,
  ListingModal,
  ChatModal,
  NewListingModal,
  AuthModal,
  LocationModal,
} from "@/components";
import { ItemsCarousel } from "@/components/ItemsCarousel";
import { cn } from "@/lib/utils";
import { dataService, CONFIG } from "@/lib/dataService";
import type { Listing, User, AdType, Category, Place } from "@/lib/types";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-client";
import { useSettings } from "@/lib/settings";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function HomePage() {
  // Use centralized settings
  const { theme, unit, layout } = useSettings();
  const dark = theme === 'dark';

  // State
  const [user, setUser] = useState<User | null>(null);
  const ENV = process.env.NEXT_PUBLIC_ENV;
  const isDeployed = ENV === "staging" || ENV === "production" || ENV === "main";
  const [listings, setListings] = useState<Listing[]>([]);
  const [active, setActive] = useState<Listing | null>(null);
  const [chatFor, setChatFor] = useState<Listing | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category>("Featured");
  const [center, setCenter] = useState<Place>(CONFIG.DEFAULT_CENTER);
  const [radiusKm, setRadiusKm] = useState<number>(CONFIG.DEFAULT_RADIUS_KM);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [adType, setAdType] = useState<AdType>("all");
  const [btcCad, setBtcCad] = useState<number | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const lang = useLang();

  // Helper to derive a full country name from a location string
  const COUNTRY_EXPAND: Record<string, string> = {
    CA: "Canada", CAN: "Canada",
    US: "United States", USA: "United States",
    UK: "United Kingdom", GB: "United Kingdom", GBR: "United Kingdom",
    DE: "Germany", DEU: "Germany",
    FR: "France", FRA: "France",
    ES: "Spain", ESP: "Spain",
    MX: "Mexico", MEX: "Mexico",
    IT: "Italy", ITA: "Italy",
    BR: "Brazil", BRA: "Brazil",
    AU: "Australia", AUS: "Australia",
    JP: "Japan", JPN: "Japan",
  };

  function deriveCountry(name?: string | null): string | null {
    if (!name) return null;
    const parts = name.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) {
      const p = parts[0];
      return COUNTRY_EXPAND[p as keyof typeof COUNTRY_EXPAND] || p;
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const token = parts[i];
      if (token.length > 2) return token;
      const expanded = COUNTRY_EXPAND[token as keyof typeof COUNTRY_EXPAND];
      if (expanded) return expanded;
    }
    const last = parts[parts.length - 1];
    return COUNTRY_EXPAND[last as keyof typeof COUNTRY_EXPAND] || last || null;
  }

  // Load saved user location on mount
  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        const savedLocation = await dataService.getUserLocation();
        if (savedLocation) {
          setCenter(savedLocation);
        }
        const savedRadius = await dataService.getUserRadius();
        setRadiusKm(savedRadius);
      } catch (error) {
        console.warn('Failed to load user location:', error);
      }
    };

    loadUserLocation();
  }, []);

  // Re-translate "My Location" label when locale changes
  useEffect(() => {
    try {
      const using = localStorage.getItem('usingMyLocation') === '1';
      if (using) {
        setCenter((prev) => ({ ...prev, name: t('my_location', lang) }));
      }
    } catch (error) {
      console.warn('Failed to update location label:', error);
    }
  }, [lang]);

  // Categories
  const categories: Category[] = [
    "Featured",
    "Electronics",
    "Mining Gear",
    "Home & Garden",
    "Sports & Bikes",
    "Tools",
    "Games & Hobbies",
    "Furniture",
    "Services",
  ];

  // Fetch BTC rate
  useEffect(() => {
    const loadBtcRate = async () => {
      try {
        const rate = await dataService.getBtcRate();
        setBtcCad(rate);
      } catch (error) {
        console.warn('Failed to load BTC rate:', error);
      }
    };

    loadBtcRate();
  }, []);

  // Initial page load
  useEffect(() => {
    const loadInitialListings = async () => {
      if (!isDeployed) return;

      try {
        setIsLoading(true);
        const response = await dataService.getListings({
          limit: CONFIG.PAGE_SIZE,
          offset: 0,
          lat: center.lat,
          lng: center.lng,
          radiusKm,
        });

        setListings(response.listings);
        setTotal(response.total);
        setHasMore(response.listings.length < response.total);
      } catch (error) {
        console.error('Failed to load initial listings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialListings();
  }, [isDeployed, center.lat, center.lng, radiusKm]);

  const loadMore = useCallback(async () => {
    if (!isDeployed || isLoading || isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const response = await dataService.getListings({
        limit: CONFIG.PAGE_SIZE,
        offset: listings.length,
        lat: center.lat,
        lng: center.lng,
        radiusKm,
      });

      setListings((prev) => [...prev, ...response.listings]);
      setTotal(response.total);
      setHasMore(response.listings.length < response.total);
    } catch (error) {
      console.error('Failed to load more listings:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isDeployed, isLoading, isLoadingMore, hasMore, listings.length, center.lat, center.lng, radiusKm]);

  // IntersectionObserver to trigger loadMore when sentinel is visible
  useEffect(() => {
    if (!isDeployed) return;

    const el = loadMoreRef.current;
    if (!el) return;

    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          loadMore();
          break;
        }
      }
    }, { rootMargin: "1000px 0px" });

    obs.observe(el);
    return () => obs.disconnect();
  }, [isDeployed, loadMore]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        setChatFor(null);
        setShowNew(false);
        setShowAuth(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Filtered listings
  const filteredBase = useMemo(() => {
    let xs = listings;
    if (query) {
      xs = xs.filter((l: Listing) =>
        l.title.toLowerCase().includes(query.toLowerCase()) ||
        l.desc.toLowerCase().includes(query.toLowerCase()) ||
        l.category.toLowerCase().includes(query.toLowerCase())
      );
    }
    if (adType !== "all") {
      xs = xs.filter((l: Listing) => l.type === adType);
    }
    return xs;
  }, [listings, query, adType]);

  const goods = useMemo(() => {
    if (cat === "Featured") {
      return filteredBase.filter((l: Listing) => l.category !== "Services");
    }
    if (cat === "Services") {
      return [];
    }
    return filteredBase.filter((l: Listing) => l.category === cat);
  }, [filteredBase, cat]);

  const services = useMemo(() => {
    if (cat === "Featured") {
      return filteredBase.filter((l: Listing) => l.category === "Services");
    }
    if (cat === "Services") {
      return filteredBase.filter((l: Listing) => l.category === "Services");
    }
    return [];
  }, [filteredBase, cat]);

  const featured = useMemo(() => listings.filter(l => l.category !== "Services").slice(0, 12), [listings]);

  // Auth helper
  const requireAuth = (fn: () => void) => {
    if (user) fn();
    else setShowAuth(true);
  };

  const bg = dark ? "bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" : "bg-gradient-to-br from-neutral-50 via-white to-neutral-100";
  const panel = dark ? "border-neutral-800/50 bg-neutral-900/30 backdrop-blur-sm" : "border-neutral-200/50 bg-white/80 backdrop-blur-sm";
  const inputBase = dark
    ? "border border-white/30 bg-neutral-800/50 text-neutral-100 placeholder-neutral-400 backdrop-blur-sm"
    : "border border-neutral-700/30 bg-white/80 text-neutral-900 placeholder-neutral-500 backdrop-blur-sm";

  const handleSearchNavigate = useCallback(() => {
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
  }, [adType, cat, query, layout, router, lang]);

  const handleLocationUpdate = useCallback(async (place: Place, radius: number) => {
    setCenter(place);
    setRadiusKm(radius);
    try {
      await dataService.saveUserLocation(place, radius);
    } catch (error) {
      console.warn('Failed to save location:', error);
    }
    setShowLocationModal(false);
  }, []);

  return (
    <ErrorBoundary>
      <div className={cn("min-h-screen", bg, dark ? "dark" : "")}>
        {/* Global header is rendered via layout */}

        {/* Hero Section */}
        <header className="relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className={cn(
              "absolute inset-0 blur-3xl opacity-30",
              dark
                ? "bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent"
                : "bg-gradient-to-br from-orange-300/30 via-amber-200/20 to-transparent"
            )} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-10">
            <div className="flex flex-col-reverse items-start gap-3 md:flex-row md:items-center md:justify-between">
              {/* Left Content */}
              <div className="max-w-2xl">
                <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
                  <span className={cn(lang === 'en' ? 'block' : 'inline', "leading-tight", dark ? "text-white" : "text-black")}>{t('title_hero_1', lang)}{lang !== 'en' ? ' ' : ''}</span>
                  <span className={cn(lang === 'en' ? 'block' : 'inline', "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent")} style={{ lineHeight: '1.2' }}>
                    {t('title_hero_2', lang)}
                  </span>
                </h1>
                <p className={cn("mt-6 text-xl leading-relaxed", dark ? "text-neutral-300" : "text-neutral-600")}>
                  {t('subheading', lang)}
                </p>
              </div>

              {/* Right: Location above search */}
              <div className="w-full md:w-[460px] md:self-center">
                <div className="mb-2 md:mb-1 flex md:justify-end">
                  <button onClick={() => setShowLocationModal(true)} className={cn("w-full md:w-[calc(100%-120px)] rounded-3xl px-6 py-5 text-left focus:outline-none", inputBase)}>
                    <div className="flex items-center justify-between gap-3">
                      <div className={cn("truncate", dark ? "text-neutral-100" : "text-neutral-900")}>
                        {radiusKm === 0 ? t('all_listings_globally', lang) : (center?.name || t('choose_location', lang))}
                      </div>
                      <div className={cn("text-sm whitespace-nowrap shrink-0", dark ? "text-neutral-300" : "text-neutral-700")}>{radiusKm === 0 ? t('change', lang) : `${radiusKm} km`}</div>
                    </div>
                  </button>
                </div>
                <div className="relative mt-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearchNavigate(); }}
                    placeholder={t('search_placeholder', lang)}
                    className={cn("w-full rounded-3xl px-6 pr-32 py-5 text-lg focus:outline-none transition-all duration-300", inputBase)}
                  />
                  <button onClick={handleSearchNavigate} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2 text-sm font-semibold text-white shadow">{t('search', lang)}</button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main id="browse" className="mx-auto max-w-7xl px-4 pb-24">
          {/* Featured Row */}
          {featured.length > 0 && (
            <section className="mt-6">
              <div className="mb-6 flex items-baseline justify-between">
                <div className="flex items-center gap-3">
                  <h2 className={cn("text-3xl font-bold", dark ? "text-white" : "text-neutral-900")}>{t('featured', lang)}</h2>
                </div>
              </div>
              <ItemsCarousel listings={featured} unit={unit} btcCad={btcCad} dark={dark} onOpen={(l) => setActive(l)} />
            </section>
          )}

          {/* Goods Section */}
          <section className="mt-16">
            <div className="mb-6 flex items-baseline justify-between">
              <div className="flex items-center gap-4">
                <h2 className={cn("text-3xl font-bold flex items-center gap-3", dark ? "text-white" : "text-neutral-900")}>{t('latest', lang)}</h2>
                <span className={cn("text-sm font-medium", dark ? "text-neutral-400" : "text-neutral-500")}>
                  {goods.length} {t('results', lang)}
                </span>
              </div>
            </div>

            {layout === "grid" ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {goods.map((l) => (
                  <ListingCard key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setActive(l)} />
                ))}
                {goods.length === 0 && !isLoading && (
                  <div className={cn("col-span-full rounded-3xl p-16 text-center border-2 border-dashed", dark ? "border-neutral-700 text-neutral-400" : "border-neutral-300 text-neutral-500")}>
                    <div className="text-4xl mb-4">🔍</div>
                    <p className={cn("text-lg font-medium", dark ? "text-neutral-300" : "text-neutral-700")}>{t('no_goods_match', lang)}</p>
                    <p className={cn("text-sm mt-2", dark ? "text-neutral-400" : "text-neutral-600")}>{t('try_widen_radius', lang)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-w-5xl mx-auto w-full">
                {goods.map((l) => (
                  <ListingRow key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setActive(l)} />
                ))}
                {goods.length === 0 && !isLoading && (
                  <div className={cn("rounded-3xl p-16 text-center border-2 border-dashed", dark ? "border-neutral-700 text-neutral-400" : "border-neutral-300 text-neutral-500")}>
                    <div className="text-4xl mb-4">🔍</div>
                    <p className={cn("text-lg font-medium", dark ? "text-neutral-300" : "text-neutral-700")}>{t('no_goods_match', lang)}</p>
                    <p className={cn("text-sm mt-2", dark ? "text-neutral-400" : "text-neutral-600")}>{t('try_widen_radius', lang)}</p>
                  </div>
                )}
                {isDeployed && (
                  <div ref={loadMoreRef} className="pt-4">
                    <div className={cn("text-center text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
                      {isLoadingMore ? t('loading_more', lang) : (hasMore ? "" : t('no_more_results', lang))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>

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
              setListings((prev) => [{ ...item, id: `l${prev.length + 1}` }, ...prev]);
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
