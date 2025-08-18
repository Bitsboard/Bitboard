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
  const mapRowsToListings = useCallback((rows: Array<{ id: number; title: string; description?: string; category?: string; adType?: string; location?: string; lat?: number; lng?: number; imageUrl?: string | string[]; priceSat: number; boostedUntil?: number | null; createdAt: number; postedBy?: string }>): Listing[] => {
    return rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      desc: (row.description ?? "") + "\n\n" + "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(40),
      priceSats: Number(row.priceSat) || 0,
      category: (row.category as any) || "Electronics",
      location: row.location || "Toronto, ON",
      lat: Number.isFinite(row.lat as any) ? (row.lat as number) : 43.6532,
      lng: Number.isFinite(row.lng as any) ? (row.lng as number) : -79.3832,
      type: (row.adType as any) === "want" ? "want" : "sell",
      images: (() => {
        const fallback = [
          "https://images.unsplash.com/photo-1555617117-08d3a8fef16c?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80&auto=format&fit=crop",
        ];
        if (Array.isArray(row.imageUrl) && row.imageUrl.length > 0) return row.imageUrl as string[];
        if (typeof row.imageUrl === 'string' && row.imageUrl.includes(',')) return (row.imageUrl as string).split(',').map(s => s.trim()).filter(Boolean);
        const base = typeof row.imageUrl === 'string' && row.imageUrl ? [row.imageUrl] : [];
        return [...base, ...fallback].slice(0, 5);
      })(),
      boostedUntil: row.boostedUntil ?? null,
      seller: (() => {
        const name = (row.postedBy || "demo_seller").replace(/^@/, "");
        const base = Number(row.id) % 100;
        const score = 5 + (base % 80);
        const deals = base % 40;
        const verified = score >= 50;
        return {
          name,
          score,
          deals,
          rating: 4 + ((base % 10) / 10),
          verifications: { email: true, phone: verified, lnurl: verified },
          onTimeRelease: verified ? 0.97 : 0.9,
        };
      })(),
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
    try { localStorage.setItem('layoutPref', layout); } catch { }
    sp.set('layout', layout);
    router.push(`/search?${sp.toString()}`);
  }, [adType, cat, query, layout, router]);

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

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <div className="flex flex-col-reverse items-start gap-3 md:flex-row md:items-center md:justify-between">
            {/* Left Content */}
            <div className="max-w-2xl">
              <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
                <span className={cn(lang === 'en' ? 'block' : 'inline', "leading-tight", dark ? "text-white" : "text-black")}>{t('title_hero_1', lang)}</span>
                <span className={cn(lang === 'en' ? 'block' : 'inline', "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent")} style={{ lineHeight: '1.2' }}>
                  {t('title_hero_2', lang)}
                </span>
              </h1>
              <p className={cn("mt-6 text-xl leading-relaxed", dark ? "text-neutral-300" : "text-neutral-600")}>
                {t('subheading', lang)}
              </p>
              <div className="mt-4" />
            </div>

            {/* Right: Location above search */}
            <div className="w-full md:w-[460px] md:self-center">
              <div className="mb-2 md:mb-1">
                <button onClick={() => setShowLocationModal(true)} className={cn("w-full rounded-3xl border px-6 py-5 text-left", inputBase)}>
                  <div className="flex items-center justify-between gap-3">
                    <div className={cn("truncate", dark ? "text-neutral-100" : "text-neutral-900")}>{center?.name || t('choose_location', lang)}</div>
                    <div className={cn("text-sm whitespace-nowrap shrink-0", dark ? "text-neutral-300" : "text-neutral-700")}>{radiusKm} km</div>
                  </div>
                </button>
              </div>
              <div className="relative mt-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchNavigate(); }}
                  placeholder={t('search_placeholder', lang)}
                  className={cn("w-full rounded-3xl px-6 pr-32 py-5 text-lg focus:outline-none transition-all duration-300 hover:border-orange-500/50", inputBase)}
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
          <section className="mt-16">
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
              {goods.length === 0 && (
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

        {/* Services Section removed per request */}

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
