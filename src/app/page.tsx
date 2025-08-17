"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Nav,
  LocationAutocomplete,
  SafetyTipsSection,
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
import { mockListings } from "@/lib/mockData";
import type { Listing, User, Unit, Layout, AdType, Category, Place } from "@/lib/types";
import { useRouter } from "next/navigation";
import { t, useLang } from "@/lib/i18n";

export default function HomePage() {
  // State
  const [dark, setDark] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const ENV = process.env.NEXT_PUBLIC_ENV;
  const isDeployed = ENV === "staging" || ENV === "production" || ENV === "main";
  const [listings, setListings] = useState<Listing[]>(isDeployed ? [] : mockListings);
  const [active, setActive] = useState<Listing | null>(null);
  const [chatFor, setChatFor] = useState<Listing | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category>("Featured");
  const [center, setCenter] = useState<Place>({ name: "Toronto (City Center)", lat: 43.653, lng: -79.383 });
  const [radiusKm, setRadiusKm] = useState(25);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [adType, setAdType] = useState<AdType>("all");
  const [layout, setLayout] = useState<Layout>("grid");
  const [unit, setUnit] = useState<Unit>("sats");
  const [btcCad, setBtcCad] = useState<number | null>(null);
  const [total, setTotal] = useState<number>(0);
  const pageSize = 24;
  const isFetchingRef = useRef(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const lang = useLang();

  // Load saved user location on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("userLocation");
      if (raw) {
        const p = JSON.parse(raw) as Place;
        if (p && typeof p.lat === 'number' && typeof p.lng === 'number' && p.name) {
          setCenter(p);
        }
      }
    } catch { }
  }, []);

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
    fetch("/api/rate")
      .then((r) => r.json() as Promise<{ cad: number | null }>)
      .then((data) => setBtcCad(data.cad))
      .catch(() => { });
  }, []);

  // Helper to map API rows -> Listing
  const mapRowsToListings = useCallback((rows: Array<{ id: number; title: string; description?: string; category?: string; adType?: string; location?: string; lat?: number; lng?: number; imageUrl?: string; priceSat: number; boostedUntil?: number | null; createdAt: number }>): Listing[] => {
    return rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      desc: row.description ?? "",
      priceSats: Number(row.priceSat) || 0,
      category: (row.category as any) || "Electronics",
      location: row.location || "Toronto, ON",
      lat: Number.isFinite(row.lat as any) ? (row.lat as number) : 43.6532,
      lng: Number.isFinite(row.lng as any) ? (row.lng as number) : -79.3832,
      type: (row.adType as any) === "want" ? "want" : "sell",
      images: [row.imageUrl || "https://images.unsplash.com/photo-1555617117-08d3a8fef16c?w=1200&q=80&auto=format&fit=crop"],
      boostedUntil: row.boostedUntil ?? null,
      seller: {
        name: "demo_seller",
        score: 10,
        deals: 0,
        rating: 5,
        verifications: { email: true, phone: true, lnurl: false },
        onTimeRelease: 0.98,
      },
      createdAt: Number(row.createdAt) * 1000,
    }));
  }, []);

  // Initial page load (deployed envs only)
  useEffect(() => {
    if (!isDeployed) return;
    const load = async () => {
      try {
        isFetchingRef.current = true;
        const r = await fetch(`/api/listings?limit=${pageSize}&offset=0`);
        const data = (await r.json()) as { listings?: Array<{ id: number; title: string; description?: string; category?: string; adType?: string; location?: string; lat?: number; lng?: number; imageUrl?: string; priceSat: number; boostedUntil?: number | null; createdAt: number }>; total?: number };
        const rows = data.listings ?? [];
        const mapped = mapRowsToListings(rows);
        setListings(mapped);
        const t = Number(data.total ?? 0);
        setTotal(t);
        setHasMore(mapped.length < t);
      } catch {
        // ignore
      } finally {
        isFetchingRef.current = false;
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeployed]);

  const loadMore = useCallback(async () => {
    if (!isDeployed) return;
    if (isFetchingRef.current) return;
    if (!hasMore) return;
    try {
      isFetchingRef.current = true;
      setIsLoadingMore(true);
      const offset = listings.length;
      const r = await fetch(`/api/listings?limit=${pageSize}&offset=${offset}`);
      const data = (await r.json()) as { listings?: Array<{ id: number; title: string; description?: string; category?: string; adType?: string; location?: string; lat?: number; lng?: number; imageUrl?: string; priceSat: number; boostedUntil?: number | null; createdAt: number }>; total?: number };
      const rows = data.listings ?? [];
      const mapped = mapRowsToListings(rows);
      setListings((prev) => [...prev, ...mapped]);
      const t = Number(data.total ?? total);
      setTotal(t);
      setHasMore(prev => prev && (offset + mapped.length) < t);
    } catch {
      // ignore
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [isDeployed, hasMore, listings.length, mapRowsToListings, pageSize, total]);

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
    ? "border-neutral-700/50 bg-neutral-800/50 text-neutral-100 placeholder-neutral-400 focus:border-orange-500/50 focus:bg-neutral-800/70 backdrop-blur-sm"
    : "border-neutral-300/50 bg-white/80 text-neutral-900 placeholder-neutral-500 focus:border-orange-500/50 focus:bg-white backdrop-blur-sm";

  const handleSearchNavigate = useCallback(() => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (cat && cat !== "Featured") sp.set("category", cat);
    if (adType && adType !== "all") sp.set("adType", adType);
    router.push(`/search?${sp.toString()}`);
  }, [adType, cat, query, router]);

  return (
    <div className={cn("min-h-screen", bg, dark ? "dark" : "")}>
      {/* staging deploy trigger */}
      <Nav
        onPost={() => requireAuth(() => setShowNew(true))}
        onToggleTheme={() => setDark((d) => !d)}
        dark={dark}
        user={user}
        onAuth={() => setShowAuth(true)}
        unit={unit}
        setUnit={setUnit}
        layout={layout}
        setLayout={setLayout}
      />

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

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
            {/* Left Content */}
            <div className="max-w-2xl">
              <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
                <span className={cn("block leading-tight", dark ? "text-white" : "text-black")}>{t('title_hero_1', lang)}</span>
                <span className="block bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent" style={{ lineHeight: '1.2' }}>
                  {t('title_hero_2', lang)}
                </span>
              </h1>
              <p className={cn("mt-6 text-xl leading-relaxed", dark ? "text-neutral-300" : "text-neutral-600")}>
                {t('subheading', lang)}
              </p>
              <div className="mt-8" />
            </div>

            {/* Right Content - Gradient coin */}
            <div className="relative hidden md:block">
              <div className="pointer-events-none select-none relative h-56 w-56 md:h-72 md:w-72">
                <div className="absolute -inset-8 bg-gradient-to-tr from-orange-500/25 via-amber-300/10 to-transparent blur-3xl" />
                <svg viewBox="0 0 200 200" className="relative drop-shadow-2xl animate-[spin_18s_linear_infinite]">
                  <defs>
                    <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <radialGradient id="shine" cx="30%" cy="25%" r="70%">
                      <stop offset="0%" stopColor="white" stopOpacity="0.35" />
                      <stop offset="60%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx="100" cy="100" r="88" fill="url(#coinGrad)" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" />
                  <circle cx="100" cy="100" r="76" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />
                  <circle cx="100" cy="100" r="64" fill="none" stroke="#ffffff" strokeOpacity="0.15" strokeDasharray="4 6" strokeWidth="2" />
                  <circle cx="100" cy="100" r="52" fill="url(#shine)" />
                  <g transform="translate(100,110)">
                    <text textAnchor="middle" fontSize="84" fontWeight="800" fill="#111827" fillOpacity="0.85">₿</text>
                  </g>
                </svg>
                <div className="absolute -bottom-5 left-1/2 h-16 w-40 -translate-x-1/2 rounded-full bg-black/30 blur-2xl" />
              </div>
            </div>
          </div>

          {/* Search Interface */}
          <div className="mt-16">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {/* Search Input */}
              <div className="md:col-span-7 relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchNavigate(); }}
                  placeholder={t('search_placeholder', lang)}
                  className={cn("w-full rounded-3xl px-6 pr-32 py-5 text-lg focus:outline-none transition-all duration-300 hover:border-orange-500/50", inputBase)}
                />
                <button
                  onClick={handleSearchNavigate}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2 text-sm font-semibold text-white shadow"
                >
                  {t('search', lang)}
                </button>
              </div>

              {/* Location + Radius Combined */}
              <div className="md:col-span-3">
                <button onClick={() => setShowLocationModal(true)} className={cn("w-full rounded-3xl border px-6 py-5 text-left", inputBase)}>
                  <div className="flex items-center justify-between gap-3">
                    <div className={cn("truncate", dark ? "text-neutral-100" : "text-neutral-900")}>
                      {center?.name || t('choose_location', lang)}
                    </div>
                    <div className={cn("text-sm whitespace-nowrap shrink-0", dark ? "text-neutral-300" : "text-neutral-700")}>{radiusKm} km</div>
                  </div>
                </button>
              </div>

              {/* Type Filter - Now Dropdown */}
              <div className="md:col-span-2">
                <select
                  value={adType}
                  onChange={(e) => setAdType(e.target.value as "all" | "sell" | "want")}
                  className={cn("w-full rounded-3xl px-6 py-5 text-lg focus:outline-none transition-all duration-300 appearance-none bg-no-repeat bg-right pr-12", inputBase)}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                >
                  <option value="all">{t('all_listings', lang)}</option>
                  <option value="sell">{t('seller_listings', lang)}</option>
                  <option value="want">{t('buyer_listings', lang)}</option>
                </select>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="mt-8 flex flex-wrap gap-3" role="tablist">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  role="tab"
                  aria-selected={cat === c}
                  className={cn(
                    "rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95",
                    cat === c
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25"
                      : dark
                        ? "border border-neutral-700/50 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800/50"
                        : "border border-neutral-300/50 text-neutral-600 hover:border-neutral-400 hover:bg-neutral-100"
                  )}
                >
                  {c === 'Featured' ? t('featured', lang) :
                    c === 'Electronics' ? t('cat_electronics', lang) :
                      c === 'Mining Gear' ? t('cat_mining_gear', lang) :
                        c === 'Home & Garden' ? t('cat_home_garden', lang) :
                          c === 'Sports & Bikes' ? t('cat_sports_bikes', lang) :
                            c === 'Tools' ? t('cat_tools', lang) :
                              c === 'Games & Hobbies' ? t('cat_games_hobbies', lang) :
                                c === 'Furniture' ? t('cat_furniture', lang) :
                                  c === 'Services' ? t('cat_services', lang) : c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="browse" className="mx-auto max-w-7xl px-4 pb-24">
        {/* Featured Row */}
        {featured.length > 0 && (
          <section className="mt-12">
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
                {goods.length} result{goods.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {layout === "grid" ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {goods.map((l) => (
                <ListingCard key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setActive(l)} />
              ))}
              {goods.length === 0 && (
                <div className={cn("col-span-full rounded-3xl p-16 text-center border-2 border-dashed", dark ? "border-neutral-700 text-neutral-400" : "border-neutral-300 text-neutral-500")}>
                  <div className="text-4xl mb-4">🔍</div>
                  <p className={cn("text-lg font-medium", dark ? "text-neutral-300" : "text-neutral-700")}>{t('no_goods_match', lang)}</p>
                  <p className={cn("text-sm mt-2", dark ? "text-neutral-400" : "text-neutral-600")}>{t('try_widen_radius', lang)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {goods.map((l) => (
                <ListingRow key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setActive(l)} />
              ))}
              {goods.length === 0 && (
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

        {/* Services Section */}
        <section className="mt-20">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className={cn("text-3xl font-bold flex items-center gap-3", dark ? "text-white" : "text-neutral-900")}>
              <span className="text-2xl">🛠️</span>
              {t('services_label', lang)}
            </h2>
            <span className={cn("text-sm font-medium", dark ? "text-neutral-400" : "text-neutral-500")}>
              {services.length} result{services.length !== 1 ? 's' : ''}
            </span>
          </div>

          {layout === "grid" ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services.map((l) => (
                <ListingCard key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setActive(l)} />
              ))}
              {services.length === 0 && (
                <div className={cn("col-span-full rounded-3xl p-16 text-center border-2 border-dashed", dark ? "border-neutral-700 text-neutral-400" : "border-neutral-300 text-neutral-500")}>
                  <div className="text-4xl mb-4">🔧</div>
                  <p className={cn("text-lg font-medium", dark ? "text-neutral-300" : "text-neutral-700")}>{t('no_services_match', lang)}</p>
                  <p className={cn("text-sm mt-2", dark ? "text-neutral-400" : "text-neutral-600")}>{t('try_adjust_filters', lang)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((l) => (
                <ListingRow key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setActive(l)} />
              ))}
            </div>
          )}
        </section>

        {/* Safety Tips */}
        <SafetyTipsSection dark={dark} />
      </main>

      {/* Footer */}
      <footer className={cn("border-t", dark ? "border-neutral-800/50 bg-neutral-900/30" : "border-neutral-200/50 bg-white/50")}>
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <p className={cn("text-lg font-medium", dark ? "text-neutral-200" : "text-neutral-700")}>
                {t('footer_tagline', lang)}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a className={cn("hover:text-orange-500 transition-colors font-medium", dark ? "text-neutral-300" : "text-neutral-600")} href="#policy">
                {t('prohibited_items', lang)}
              </a>
              <a className={cn("hover:text-orange-500 transition-colors font-medium", dark ? "text-neutral-300" : "text-neutral-600")} href="#tips">
                {t('safety_tips', lang)}
              </a>
              <a className={cn("hover:text-orange-500 transition-colors font-medium", dark ? "text-neutral-300" : "text-neutral-600")} href="/terms">
                {t('terms', lang)}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showLocationModal && (
        <LocationModal
          open={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          initialCenter={{ lat: center.lat, lng: center.lng, name: center.name }}
          initialRadiusKm={radiusKm}
          dark={dark}
          onApply={(place, r) => {
            setCenter(place);
            setRadiusKm(r);
            try { localStorage.setItem('userLocation', JSON.stringify(place)); localStorage.setItem('userRadiusKm', String(r)); } catch { }
            setShowLocationModal(false);
          }}
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
  );
}

function formatFiat(n: number, currency = "CAD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}
