"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Nav,
  LocationAutocomplete,
  SafetyTipsSection,
  TermsSection,
  UnitToggle,
  ViewToggle,
  TypeToggle,
  ListingCard,
  ListingRow,
  ListingModal,
  ChatModal,
  NewListingModal,
  AuthModal,
} from "@/components";
import { mockListings } from "@/lib/mockData";
import type { Unit, Layout, AdType, Category, Place, Seller, Listing, User } from "@/lib/types";

/**
 * Bitboard — full demo page
 * Adds:
 * - Goods/Services sections + ad type (Selling / Looking For)
 * - Saved searches bar
 * - Location autocomplete + radius filter (same height row)
 * - Dark/Light toggle
 * - Safety tips + Terms sections
 * - Listing modal → Chat modal → Escrow side panel (no "Start escrow" button)
 * - "Sign in to post" (simulated) + "Post a listing" flow with demo invoice
 * - Denom toggle (sats/BTC) and CAD always shown under price
 */

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

const places: Place[] = [
  { name: "Toronto (City Center)", lat: 43.653, lng: -79.383 },
  { name: "Downtown", lat: 43.6487, lng: -79.3817 },
  { name: "North York", lat: 43.7615, lng: -79.4111 },
  { name: "Etobicoke", lat: 43.6205, lng: -79.5132 },
  { name: "Scarborough", lat: 43.7731, lng: -79.2578 },
  { name: "Markham", lat: 43.8561, lng: -79.337 },
  { name: "Mississauga", lat: 43.589, lng: -79.644 },
  { name: "Vaughan", lat: 43.837, lng: -79.508 },
];

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function kmBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Mock data loaded from centralized file ---
const seedListings: Listing[] = [
  {
    id: "l1",
    title: "Antminer S19 Pro (110TH)",
    desc: "Well-maintained, hosted in Markham. Pickup preferred. Includes PSU.",
    priceSats: 14500000,
    category: "Mining Gear",
    location: "Markham, ON",
    lat: 43.8561,
    lng: -79.337,
    type: "sell",
    images: ["https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop"],
    boostedUntil: Date.now() + 1000 * 60 * 60 * 20,
    seller: { name: "@rigdoctor", score: 28, deals: 64, rating: 4.8, verifications: { email: true, phone: true, lnurl: true }, onTimeRelease: 0.98 },
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: "l2",
    title: "Looking for: Ryzen 7 / 3070 build",
    desc: "WTB a clean 1440p gaming PC. Prefer pickup downtown. Paying in sats.",
    priceSats: 5200000,
    category: "Electronics",
    location: "Toronto, ON (Downtown)",
    lat: 43.651,
    lng: -79.381,
    type: "want",
    images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1600&auto=format&fit=crop"],
    boostedUntil: 0,
    seller: { name: "@pixelpete", score: 11, deals: 17, rating: 4.6, verifications: { email: true, phone: false, lnurl: true }, onTimeRelease: 0.94 },
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
  },
  {
    id: "l3",
    title: "Giant Defy Road Bike (M)",
    desc: "Lightly used, includes pedals and bottle cages.",
    priceSats: 980000,
    category: "Sports & Bikes",
    location: "North York, ON",
    lat: 43.7615,
    lng: -79.4111,
    type: "sell",
    images: ["https://images.unsplash.com/photo-1595433707802-6b2626ef1c86?q=80&w=1600&auto=format&fit=crop"],
    boostedUntil: 0,
    seller: { name: "@spinster", score: 7, deals: 9, rating: 4.4, verifications: { email: true, phone: false, lnurl: false }, onTimeRelease: 0.9 },
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: "l4",
    title: "IKEA Kallax (4x4)",
    desc: "Good condition, white. Disassembled for easy pickup.",
    priceSats: 210000,
    category: "Furniture",
    location: "Etobicoke, ON",
    lat: 43.6205,
    lng: -79.5132,
    type: "sell",
    images: ["https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1600&auto=format&fit=crop"],
    boostedUntil: Date.now() + 1000 * 60 * 60 * 6,
    seller: { name: "@storify", score: 3, deals: 3, rating: 4.0, verifications: { email: true, phone: false, lnurl: false }, onTimeRelease: 1.0 },
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: "l5",
    title: "Makita Impact Driver Set",
    desc: "Two batteries, charger, case. Works flawlessly.",
    priceSats: 350000,
    category: "Tools",
    location: "Scarborough, ON",
    lat: 43.7731,
    lng: -79.2578,
    type: "sell",
    images: ["https://images.unsplash.com/photo-1563224507-3b2a8d40a3fd?q=80&w=1600&auto=format&fit=crop"],
    boostedUntil: 0,
    seller: { name: "@bitsnbobs", score: 5, deals: 6, rating: 4.2, verifications: { email: true, phone: true, lnurl: false }, onTimeRelease: 0.92 },
    createdAt: Date.now() - 1000 * 60 * 60 * 50,
  },
  {
    id: "l6",
    title: "Phone Repair — Screen & Battery",
    desc: "Downtown mobile service. Most iPhones same-day. Pay in sats.",
    priceSats: 50000,
    category: "Services",
    location: "Toronto, ON (Downtown)",
    lat: 43.651,
    lng: -79.381,
    type: "sell",
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1600&auto=format&fit=crop"],
    boostedUntil: 0,
    seller: { name: "@ifixsats", score: 14, deals: 32, rating: 4.7, verifications: { email: true, phone: true, lnurl: true }, onTimeRelease: 0.97 },
    createdAt: Date.now() - 1000 * 60 * 30,
  },
];

export default function Page() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category>("Featured");
  const [listings, setListings] = useState<Listing[]>(mockListings);
  const [btcCad, setBtcCad] = useState(0);

  const [center, setCenter] = useState<Place>(places[0]);
  const [radiusKm, setRadiusKm] = useState(25);
  const [active, setActive] = useState<Listing | null>(null); // listing modal
  const [chatFor, setChatFor] = useState<Listing | null>(null); // chat modal
  const [showNew, setShowNew] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dark, setDark] = useState(true);

  // Saved searches


  // Display prefs
  const [unit, setUnit] = useState<Unit>("sats");
  const [layout, setLayout] = useState<Layout>("grid");
  const [adType, setAdType] = useState<AdType>("all");

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        setChatFor(null);
        setShowNew(false);
        setShowAuth(false);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  // BTC→CAD via our API route (no manual entry)
  useEffect(() => {
    let t: any;
    async function load() {
      try {
        const r = await fetch("/api/rate");
        const j = await r.json();
        if (j?.cad) {
          setBtcCad(Number(j.cad));
        }
      } catch { }
      t = setTimeout(load, 60_000);
    }
    load();
    return () => clearTimeout(t);
  }, []);

  const requireAuth = (fn: () => void) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    fn();
  };

  // Filters
  const filteredBase = useMemo(() => {
    let xs = listings
      .slice()
      .sort(
        (a: Listing, b: Listing) =>
          Number(b.boostedUntil > Date.now()) - Number(a.boostedUntil > Date.now()) ||
          b.createdAt - a.createdAt
      );

    // Geo filter
    xs = xs.filter((l: Listing) => kmBetween(center.lat, center.lng, l.lat, l.lng) <= radiusKm);

    // Text filter
    if (query.trim()) {
      const q = query.toLowerCase();
      xs = xs.filter((l: Listing) => `${l.title} ${l.desc} ${l.location}`.toLowerCase().includes(q));
    }

    // Type filter
    if (adType !== "all") {
      xs = xs.filter((l: Listing) => l.type === adType);
    }

    return xs;
  }, [listings, query, center, radiusKm, adType]);

  // Goods vs Services sections
  const goods = useMemo(() => {
    const nonServiceCats = categories.filter((c) => c !== "Featured" && c !== "Services");
    let xs = filteredBase.filter((l: Listing) => {
      const category = l.category as string;
      return nonServiceCats.includes(category as any);
    });
    if (cat !== "Featured" && cat !== "Services") xs = xs.filter((l: Listing) => l.category === cat);
    return xs;
  }, [filteredBase, cat]);

  const services = useMemo(() => {
    let xs = filteredBase.filter((l: Listing) => l.category === "Services");
    if (cat === "Services") return xs;
    if (cat !== "Featured" && cat !== "Services") return [];
    return xs;
  }, [filteredBase, cat]);

  const bg = dark ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900";
  const panel = dark ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-white";
  const inputBase = dark
    ? "border-neutral-800 bg-neutral-900 text-neutral-100 placeholder-neutral-500 focus:border-orange-500"
    : "border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-orange-500";

  // Filter helpers
  const currentFilter = () => ({ query, category: cat, center, radiusKm, adType });
  const handleSaveSearch = () => {
    const s = currentFilter();
    const name = `${s.query || "All"} • ${s.center.name} • ${s.radiusKm}km${s.category !== "Featured" ? " • " + s.category : ""
      }${s.adType !== "all" ? " • " + (s.adType === "sell" ? "Selling" : "Looking For") : ""}`;
    const item: SavedSearch = {
      id: `s${Date.now()}`,
      name,
      notify: true,
      lastOpenedAt: Date.now(),
      newCount: 0,
      ...s,
    };
    setSaved((prev: SavedSearch[]) => [item, ...prev]);
  };
  const applySaved = (s: SavedSearch) => {
    setQuery(s.query);
    setCat(s.category);
    setCenter(s.center);
    setRadiusKm(s.radiusKm);
    setAdType(s.adType || "all");
    setSaved((prev: SavedSearch[]) =>
      prev.map((x: SavedSearch) => (x.id === s.id ? { ...x, lastOpenedAt: Date.now(), newCount: 0 } : x))
    );
  };
  const toggleSavedBell = (id: string) =>
    setSaved((prev: SavedSearch[]) => prev.map((x: SavedSearch) => (x.id === id ? { ...x, notify: !x.notify } : x)));
  const deleteSaved = (id: string) => setSaved((prev: SavedSearch[]) => prev.filter((x: SavedSearch) => x.id !== id));
  useEffect(() => {
    setSaved((prev: SavedSearch[]) => prev.map((s: SavedSearch) => ({ ...s, newCount: computeNewCount(s) })));
  }, [listings]);

  return (
    <div className={cn("min-h-screen", bg, dark ? "dark" : "")}>
      <Nav
        onPost={() => requireAuth(() => setShowNew(true))}
        onToggleTheme={() => setDark((d) => !d)}
        dark={dark}
        user={user}
        onAuth={() => setShowAuth(true)}
      />

      <header className="relative overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 blur-3xl",
            dark
              ? "bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent"
              : "bg-gradient-to-br from-orange-300/30 via-amber-200/20 to-transparent"
          )}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
                <span>Better deals,</span>
                <br />
                <span>
                  with{" "}
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    better money.
                  </span>
                </span>
              </h1>
              <p className={cn("mt-4 max-w-2xl", dark ? "text-neutral-300" : "text-neutral-700")}>
                Local classifieds in sats or BTC. Built-in chat and Lightning escrow for safer
                meetups.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => (user ? setShowNew(true) : setShowAuth(true))}
                  className="rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-neutral-950 shadow-lg shadow-orange-500/30 transition hover:translate-y-[-1px] hover:bg-orange-400 active:translate-y-[0px]"
                >
                  {user ? "Post a listing" : "Sign in to post"}
                </button>
                <a
                  href="#browse"
                  className={cn(
                    "rounded-2xl px-5 py-3 font-semibold transition",
                    dark
                      ? "border border-neutral-700 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-900"
                      : "border border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                  )}
                >
                  Browse deals
                </a>

                <span className={cn("ml-2 text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
                  * Demo — payments & auth simulated
                </span>
              </div>
            </div>
            <div className={cn("flex items-center gap-3 text-sm font-semibold", dark ? "text-neutral-200" : "text-neutral-700")}>
              <span>Display prices in:</span>
              <UnitToggle unit={unit} setUnit={setUnit} />
            </div>
          </div>

          {/* Search Row */}
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-4 relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bikes, ASICs, consoles…"
                className={cn("w-full rounded-2xl px-5 py-4 pr-12 focus:outline-none", inputBase)}
              />
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-60">
                🔎
              </div>
            </div>
            <div className="md:col-span-4">
              <LocationAutocomplete value={center} onSelect={setCenter} inputBase={inputBase} dark={dark} />
            </div>
            <div className="md:col-span-2">
              <div
                className={cn(
                  "flex h-full items-center justify-between gap-3 rounded-2xl px-4 py-4",
                  dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white"
                )}
              >
                <label className="text-sm">Radius</label>
                <input type="range" min={2} max={50} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="w-full" />
                <span className="w-16 text-right text-sm opacity-80">{radiusKm} km</span>
              </div>
            </div>
            <div className="md:col-span-1">
              <ViewToggle layout={layout} setLayout={setLayout} dark={dark} />
            </div>
            <div className="md:col-span-1">
              <TypeToggle adType={adType} setAdType={setAdType} dark={dark} />
            </div>


            <div className="md:col-span-12 flex flex-wrap gap-2" role="tablist">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  role="tab"
                  aria-selected={cat === c}
                  className={cn(
                    "rounded-2xl px-4 py-2 text-sm transition",
                    cat === c
                      ? "bg-orange-500 text-neutral-950 shadow shadow-orange-500/30"
                      : dark
                        ? "border border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-900"
                        : "border border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Listings */}
      <main id="browse" className="mx-auto max-w-7xl px-4 pb-24">
        {/* Goods */}
        <section className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">🛒 Goods</h2>
            <span className="text-sm opacity-70">{goods.length} results</span>
          </div>
          {layout === "grid" ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {goods.map((l) => (
                <ListingCard key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setActive(l)} />
              ))}
              {goods.length === 0 && (
                <div className={cn("col-span-full rounded-2xl p-10 text-center", dark ? "border border-neutral-800 text-neutral-400" : "border border-neutral-300 text-neutral-600")}>
                  No goods match. Try widening your radius or clearing filters.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {goods.map((l) => (
                <ListingRow key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setActive(l)} />
              ))}
              {goods.length === 0 && (
                <div className={cn("rounded-2xl p-6 text-center", dark ? "border border-neutral-800 text-neutral-400" : "border border-neutral-300 text-neutral-600")}>
                  No goods match. Try widening your radius or clearing filters.
                </div>
              )}
            </div>
          )}
        </section>

        {/* Services */}
        <section className="mt-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">🛠️ Services</h2>
            <span className="text-sm opacity-70">{services.length} results</span>
          </div>
          {layout === "grid" ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services.map((l) => (
                <ListingCard key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setActive(l)} />
              ))}
              {services.length === 0 && (
                <div className={cn("col-span-full rounded-2xl p-10 text-center", dark ? "border border-neutral-800 text-neutral-400" : "border border-neutral-300 text-neutral-600")}>
                  No services match. Try adjusting filters.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((l) => (
                <ListingRow key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setActive(l)} />
              ))}
              {services.length === 0 && (
                <div className={cn("rounded-2xl p-6 text-center", dark ? "border border-neutral-800 text-neutral-400" : "border border-neutral-300 text-neutral-600")}>
                  No services match. Try adjusting filters.
                </div>
              )}
            </div>
          )}
        </section>

        {/* Safety Tips */}
        <SafetyTipsSection dark={dark} />
        {/* Terms & Conditions */}
        <TermsSection dark={dark} />
      </main>

      <footer className={cn("border-t", dark ? "border-neutral-900 bg-neutral-950/60" : "border-neutral-200 bg-white/70")}>
        <div className="mx-auto max-w-7xl px-4 py-10 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              ⚡ Bitboard — in-app chat + Lightning escrow. Keep correspondence in-app; off-app
              contact is against our guidelines.
            </p>
            <div className="flex items-center gap-4">
              <a className="hover:text-orange-600" href="#policy">
                Prohibited items
              </a>
              <a className="hover:text-orange-600" href="#tips">
                Safety tips
              </a>
              <a className="hover:text-orange-600" href="#terms">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>

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
          onPublish={(item) => {
            setListings((prev) => [{ ...item, id: `l${prev.length + 1}` }, ...prev]);
            setShowNew(false);
          }}
        />
      )}
      {showAuth && (
        <AuthModal
          dark={dark}
          onClose={() => setShowAuth(false)}
          onAuthed={(u) => {
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
