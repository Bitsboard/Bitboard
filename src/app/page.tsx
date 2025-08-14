"use client";

import React, { useEffect, useMemo, useState } from "react";

/**
 * Bitboard — full demo page
 * Adds:
 * - Goods/Services sections + ad type (Selling / Looking For)
 * - Saved searches bar
 * - Location autocomplete + radius filter (same height row)
 * - Dark/Light toggle
 * - Safety tips + Terms sections
 * - Listing modal → Chat modal → Escrow side panel (no “Start escrow” button)
 * - “Sign in to post” (simulated) + “Post a listing” flow with demo invoice
 * - Denom toggle (sats/BTC) and CAD always shown under price
 */

type Unit = "sats" | "BTC";
type Layout = "grid" | "list";
type AdType = "all" | "sell" | "want";
type Category =
  | "Featured"
  | "Electronics"
  | "Mining Gear"
  | "Home & Garden"
  | "Sports & Bikes"
  | "Tools"
  | "Games & Hobbies"
  | "Furniture"
  | "Services";

type Place = { name: string; lat: number; lng: number };

type Seller = {
  name: string;
  score: number;
  deals: number;
  rating: number;
  verifications: { email?: boolean; phone?: boolean; lnurl?: boolean };
  onTimeRelease: number;
};

type Listing = {
  id: string;
  title: string;
  desc: string;
  priceSats: number;
  category: Category | Exclude<string, never>;
  location: string;
  lat: number;
  lng: number;
  type: "sell" | "want";
  images: string[];
  boostedUntil: number;
  seller: Seller;
  createdAt: number;
};

type SavedSearch = {
  id: string;
  name: string;
  notify: boolean;
  lastOpenedAt: number;
  newCount: number;
  query: string;
  category: Category;
  center: Place;
  radiusKm: number;
  adType: AdType;
};

type User = { id: string; email: string; handle: string };

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
function formatSats(n: number) {
  return new Intl.NumberFormat(undefined).format(n);
}
function satsToFiat(sats: number, btcFiat: number) {
  return (sats / 1e8) * btcFiat;
}
function formatFiat(n: number, currency = "CAD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
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
function stars(rating: number) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return "★".repeat(full) + (half ? "½" : "");
}
function formatBTCFromSats(sats: number) {
  const btc = sats / 1e8;
  return btc.toLocaleString(undefined, { maximumFractionDigits: 8 });
}
function accent(listing: Listing) {
  const isService = listing.category === "Services";
  return {
    stripe: isService ? "from-fuchsia-500 to-violet-500" : "from-sky-500 to-cyan-500",
    chip: isService ? "from-fuchsia-500 to-violet-500" : "from-sky-500 to-cyan-500",
  };
}

// --- Demo data ------------------------------------------------------------
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
  const [listings, setListings] = useState<Listing[]>(seedListings);
  const [btcCad, setBtcCad] = useState(0);
  const [rateUpdatedAt, setRateUpdatedAt] = useState<Date | null>(null);

  const [center, setCenter] = useState<Place>(places[0]);
  const [radiusKm, setRadiusKm] = useState(25);
  const [active, setActive] = useState<Listing | null>(null); // listing modal
  const [chatFor, setChatFor] = useState<Listing | null>(null); // chat modal
  const [showNew, setShowNew] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dark, setDark] = useState(true);

  // Saved searches
  const [saved, setSaved] = useState<SavedSearch[]>([]);

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
          setRateUpdatedAt(new Date());
        }
      } catch {}
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
        (a, b) =>
          Number(b.boostedUntil > Date.now()) - Number(a.boostedUntil > Date.now()) ||
          b.createdAt - a.createdAt
      );

    // Geo filter
    xs = xs.filter((l) => kmBetween(center.lat, center.lng, l.lat, l.lng) <= radiusKm);

    // Text filter
    if (query.trim()) {
      const q = query.toLowerCase();
      xs = xs.filter((l) => `${l.title} ${l.desc} ${l.location}`.toLowerCase().includes(q));
    }

    // Type filter
    if (adType !== "all") {
      xs = xs.filter((l) => l.type === adType);
    }

    return xs;
  }, [listings, query, center, radiusKm, adType]);

  // Goods vs Services sections
  const goods = useMemo(() => {
    const nonServiceCats = categories.filter((c) => c !== "Featured" && c !== "Services");
    let xs = filteredBase.filter((l) => nonServiceCats.includes(l.category as Category));
    if (cat !== "Featured" && cat !== "Services") xs = xs.filter((l) => l.category === cat);
    return xs;
  }, [filteredBase, cat]);

  const services = useMemo(() => {
    let xs = filteredBase.filter((l) => l.category === "Services");
    if (cat === "Services") return xs;
    if (cat !== "Featured" && cat !== "Services") return [];
    return xs;
  }, [filteredBase, cat]);

  const bg = dark ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900";
  const panel = dark ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-white";
  const inputBase = dark
    ? "border-neutral-800 bg-neutral-900 text-neutral-100 placeholder-neutral-500 focus:border-orange-500"
    : "border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-orange-500";

  // Saved search helpers
  const currentFilter = () => ({ query, category: cat, center, radiusKm, adType });
  const computeNewCount = (s: SavedSearch) => {
    const since = s.lastOpenedAt || 0;
    return listings.filter((l) => {
      const inCat =
        s.category === "Featured" ||
        (s.category === "Services" ? l.category === "Services" : l.category === s.category);
      const inGeo = kmBetween(s.center.lat, s.center.lng, l.lat, l.lng) <= s.radiusKm;
      const inText =
        !s.query || `${l.title} ${l.desc} ${l.location}`.toLowerCase().includes(s.query.toLowerCase());
      const inType = s.adType === "all" || l.type === s.adType;
      return inCat && inGeo && inText && inType && l.createdAt > since;
    }).length;
  };
  const handleSaveSearch = () => {
    const s = currentFilter();
    const name = `${s.query || "All"} • ${s.center.name} • ${s.radiusKm}km${
      s.category !== "Featured" ? " • " + s.category : ""
    }${s.adType !== "all" ? " • " + (s.adType === "sell" ? "Selling" : "Looking For") : ""}`;
    const item: SavedSearch = {
      id: `s${Date.now()}`,
      name,
      notify: true,
      lastOpenedAt: Date.now(),
      newCount: 0,
      ...s,
    };
    setSaved((prev) => [item, ...prev]);
  };
  const applySaved = (s: SavedSearch) => {
    setQuery(s.query);
    setCat(s.category);
    setCenter(s.center);
    setRadiusKm(s.radiusKm);
    setAdType(s.adType || "all");
    setSaved((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, lastOpenedAt: Date.now(), newCount: 0 } : x))
    );
  };
  const toggleSavedBell = (id: string) =>
    setSaved((prev) => prev.map((x) => (x.id === id ? { ...x, notify: !x.notify } : x)));
  const deleteSaved = (id: string) => setSaved((prev) => prev.filter((x) => x.id !== id));
  useEffect(() => {
    setSaved((prev) => prev.map((s) => ({ ...s, newCount: computeNewCount(s) })));
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
                <button
                  onClick={handleSaveSearch}
                  className={cn(
                    "rounded-2xl px-5 py-3 font-semibold transition",
                    dark ? "border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-900" : "border border-neutral-300 hover:bg-neutral-100"
                  )}
                >
                  Save search
                </button>
                <span className={cn("ml-2 text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
                  * Demo — payments & auth simulated
                </span>
              </div>
            </div>
            <aside className={cn("flex w-full max-w-md flex-col gap-3 rounded-2xl border p-4", panel)}>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>BTC → CAD:</span>
                  <strong>{btcCad ? formatFiat(btcCad, "CAD") : "—"}</strong>
                  {rateUpdatedAt && (
                    <span className="text-xs text-neutral-500">
                      updated {rateUpdatedAt.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <UnitToggle unit={unit} setUnit={setUnit} />
              </div>
              <div className={cn("rounded-lg p-3 text-xs", dark ? "bg-neutral-800/60 text-neutral-400" : "bg-neutral-100 text-neutral-600")}>
                Prices display in {unit === "sats" ? "sats" : "BTC"}. CAD estimate shown underneath
                for reference. <strong>Keep all correspondence in-app for safety.</strong> Off-app
                contact is against our guidelines.
              </div>
            </aside>
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

            {/* Saved Searches bar */}
            <div className="md:col-span-12">
              <SavedSearchesBar
                saved={saved}
                onRun={applySaved}
                onToggleBell={toggleSavedBell}
                onDelete={deleteSaved}
                dark={dark}
              />
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

/* ---------------- Subcomponents ---------------- */

function Nav({
  onPost,
  onToggleTheme,
  dark,
  user,
  onAuth,
}: {
  onPost: () => void;
  onToggleTheme: () => void;
  dark: boolean;
  user: User | null;
  onAuth: () => void;
}) {
  return (
    <nav
      className={cn(
        "sticky top-0 z-40 backdrop-blur",
        dark ? "border-b border-neutral-900 bg-neutral-950/80" : "border-b border-neutral-200 bg-white/80"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <LogoMinimal dark={dark} />
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight">Bitboard</span>
            <span
              className={cn(
                "hidden rounded-full px-2 py-0.5 text-xs sm:inline",
                dark ? "border border-neutral-800 text-neutral-400" : "border border-neutral-300 text-neutral-600"
              )}
            >
              Toronto
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className={cn("rounded-xl px-3 py-2 text-sm", dark ? "text-neutral-300 hover:bg-neutral-900" : "text-neutral-700 hover:bg-neutral-100")}
          >
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
          <a
            href="#how"
            className={cn("rounded-xl px-3 py-2 text-sm", dark ? "text-neutral-300 hover:bg-neutral-900" : "text-neutral-700 hover:bg-neutral-100")}
          >
            How it works
          </a>
          <a
            href="#pricing"
            className={cn("rounded-xl px-3 py-2 text-sm", dark ? "text-neutral-300 hover:bg-neutral-900" : "text-neutral-700 hover:bg-neutral-100")}
          >
            Pricing
          </a>
          {user ? (
            <button className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-neutral-950 shadow shadow-orange-500/30 transition hover:bg-orange-400" onClick={onPost}>
              Post a listing
            </button>
          ) : (
            <button onClick={onAuth} className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:border-orange-400 hover:text-orange-600">
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function LogoMinimal({ dark }: { dark: boolean }) {
  const primary = dark ? "#f97316" : "#ea580c";
  const bgCoin = dark ? "#0a0a0a" : "#ffffff";
  return (
    <div className="grid h-8 w-8 place-items-center">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-label="Bitboard logo">
        <circle cx="14" cy="14" r="12" fill={bgCoin} stroke={primary} strokeWidth="2" />
        <circle cx="18" cy="10" r="2" fill={primary} />
      </svg>
    </div>
  );
}

function UnitToggle({ unit, setUnit }: { unit: Unit; setUnit: (u: Unit) => void }) {
  return (
    <div className="inline-flex rounded-xl border overflow-hidden">
      <button onClick={() => setUnit("sats")} className={cn("px-3 py-1 text-xs", unit === "sats" ? "bg-orange-500 text-neutral-950" : "opacity-80")}>
        sats
      </button>
      <button onClick={() => setUnit("BTC")} className={cn("px-3 py-1 text-xs", unit === "BTC" ? "bg-orange-500 text-neutral-950" : "opacity-80")}>
        BTC
      </button>
    </div>
  );
}

function ViewToggle({ layout, setLayout, dark }: { layout: Layout; setLayout: (l: Layout) => void; dark: boolean }) {
  return (
    <div className={cn("flex items-center justify-center rounded-2xl", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
      <button onClick={() => setLayout("grid")} className={cn("px-3 py-3 text-sm", layout === "grid" ? "text-orange-500" : "opacity-70")} title="Grid">
        ▦
      </button>
      <button onClick={() => setLayout("list")} className={cn("px-3 py-3 text-sm", layout === "list" ? "text-orange-500" : "opacity-70")} title="List">
        ≣
      </button>
    </div>
  );
}

function TypeToggle({ adType, setAdType, dark }: { adType: AdType; setAdType: (t: AdType) => void; dark: boolean }) {
  return (
    <div className={cn("flex items-center justify-center rounded-2xl", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
      <button onClick={() => setAdType("all")} className={cn("px-3 py-3 text-sm", adType === "all" ? "text-orange-500" : "opacity-70")} title="All">
        ◎
      </button>
      <button onClick={() => setAdType("sell")} className={cn("px-3 py-3 text-sm", adType === "sell" ? "text-emerald-500" : "opacity-70")} title="Selling">
        ●
      </button>
      <button onClick={() => setAdType("want")} className={cn("px-3 py-3 text-sm", adType === "want" ? "text-fuchsia-500" : "opacity-70")} title="Looking For">
        ○
      </button>
    </div>
  );
}

function PriceBlock({ sats, unit, btcCad, dark }: { sats: number; unit: Unit; btcCad: number; dark: boolean }) {
  const primary = unit === "sats" ? `${formatSats(sats)} sats` : `${formatBTCFromSats(sats)} BTC`;
  const cad = btcCad ? formatFiat(satsToFiat(sats, btcCad), "CAD") : "— CAD";
  return (
    <div className="flex flex-col items-start">
      <span className="font-semibold text-orange-500">{primary}</span>
      <span className={cn("text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>≈ {cad}</span>
    </div>
  );
}

function TypePill({ type }: { type: "sell" | "want" }) {
  if (type === "want")
    return (
      <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-400">
        Looking For
      </span>
    );
  return (
    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
      Selling
    </span>
  );
}

function ListingCard({
  listing,
  unit,
  btcCad,
  dark,
  onOpen,
}: {
  listing: Listing;
  unit: Unit;
  btcCad: number;
  dark: boolean;
  onOpen: () => void;
}) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const a = accent(listing);
  return (
    <article
      onClick={onOpen}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl",
        dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-300 bg-white"
      )}
    >
      <div className={cn("h-1 w-full bg-gradient-to-r", a.stripe)} />
      {boosted && (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-neutral-950 shadow">
          BOOSTED
        </div>
      )}
      <div className="aspect-[4/3] overflow-hidden">
        <img src={listing.images?.[0]} alt={listing.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="line-clamp-1 text-lg font-bold">{listing.title}</h3>
          <div className="flex items-center gap-2">
            <TypePill type={listing.type} />
            <span className={cn("rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold text-white", a.chip)}>
              {listing.category === "Services" ? "Service" : listing.category}
            </span>
          </div>
        </div>
        <p className={cn("line-clamp-2 text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>{listing.desc}</p>
        <div className="flex items-center justify-between">
          <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} />
          <div className="text-xs opacity-80">📍 {listing.location}</div>
        </div>
        <div className="flex items-center justify-between text-xs opacity-80">
          <span>👤 {listing.seller.name}</span>
          <span>
            {stars(listing.seller.rating)} • {listing.seller.deals} deals
          </span>
        </div>
      </div>
    </article>
  );
}

function ListingRow({
  listing,
  unit,
  btcCad,
  dark,
  onOpen,
}: {
  listing: Listing;
  unit: Unit;
  btcCad: number;
  dark: boolean;
  onOpen: () => void;
}) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const a = accent(listing);
  return (
    <article
      onClick={onOpen}
      className={cn(
        "group relative grid grid-cols-8 gap-3 overflow-hidden rounded-2xl p-2",
        dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-300 bg-white"
      )}
    >
      <div className={cn("absolute left-0 top-0 h-full w-1 bg-gradient-to-b", a.stripe)} />
      {boosted && (
        <div className="absolute right-3 top-2 z-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-neutral-950">
          BOOSTED
        </div>
      )}
      <div className="col-span-2 aspect-[3/2] overflow-hidden rounded-lg">
        <img src={listing.images?.[0]} alt={listing.title} className="h-full w-full object-cover" />
      </div>
      <div className="col-span-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">{listing.title}</h3>
            <TypePill type={listing.type} />
            <span className={cn("rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold text-white", a.chip)}>
              {listing.category === "Services" ? "Service" : listing.category}
            </span>
          </div>
          <p className={cn("mt-0.5 line-clamp-1 text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>{listing.desc}</p>
          <div className="mt-1 text-[11px] opacity-80">📍 {listing.location}</div>
        </div>
        <div className="text-right">
          <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} />
          <div className="mt-1 text-[11px] opacity-80">
            {stars(listing.seller.rating)} • {listing.seller.deals}
          </div>
        </div>
      </div>
    </article>
  );
}

function ListingModal({
  listing,
  onClose,
  unit,
  btcCad,
  dark,
  onChat,
}: {
  listing: Listing;
  onClose: () => void;
  unit: Unit;
  btcCad: number;
  dark: boolean;
  onChat: () => void;
}) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cn("w-full max-w-4xl overflow-hidden rounded-2xl", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-200 bg-white")}>
        <div className={cn("flex items-center justify-between border-b px-4 py-3", dark ? "border-neutral-900" : "border-neutral-200")}>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{listing.title}</h2>
            {boosted && <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-neutral-950">BOOSTED</span>}
          </div>
          <button onClick={onClose} className={cn("rounded-lg px-3 py-1", dark ? "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800")}>
            Close
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="aspect-[4/3] overflow-hidden">
              <img src={listing.images?.[0]} alt={listing.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold">Description</h3>
              <p className={cn("mt-2 text-sm", dark ? "text-neutral-300" : "text-neutral-700")}>{listing.desc}</p>
            </div>
          </div>
          <div className={cn("md:col-span-2 border-l", dark ? "border-neutral-900" : "border-neutral-200")}>
            <div className="space-y-3 p-4">
              <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} />
              <div className="text-sm opacity-80">📍 {listing.location}</div>
              <div className={cn("rounded-xl p-3", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Seller {listing.seller.name}</div>
                    <div className="text-xs opacity-80">
                      {stars(listing.seller.rating)} · {listing.seller.deals} deals · On-time releases {Math.round(listing.seller.onTimeRelease * 100)}%
                    </div>
                  </div>
                  <div className="flex gap-1 text-[10px]">
                    {listing.seller.verifications.email && <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-400">email</span>}
                    {listing.seller.verifications.phone && <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-400">phone</span>}
                    {listing.seller.verifications.lnurl && <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-400">lnurl</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={onChat} className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 font-semibold text-neutral-950 shadow shadow-orange-500/30">
                  Message seller
                </button>
              </div>
              <div className={cn("rounded-xl p-3 text-xs", dark ? "bg-neutral-900 text-neutral-400" : "bg-neutral-100 text-neutral-600")}>
                Keep all correspondence in-app for safety. Off-app contact is against our guidelines. When ready, attach an escrow proposal from the chat composer.
              </div>
              <button className={cn("mt-2 w-full rounded-xl px-3 py-2 text-xs", dark ? "text-neutral-400 hover:bg-neutral-900" : "text-neutral-600 hover:bg-neutral-100")}>
                Report listing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatModal({
  listing,
  onClose,
  dark,
  btcCad,
  unit,
}: {
  listing: Listing;
  onClose: () => void;
  dark: boolean;
  btcCad: number;
  unit: Unit;
}) {
  const [messages, setMessages] = useState<{ id: number; who: "me" | "seller"; text: string; at: number }[]>([
    { id: 1, who: "seller", text: "Hey! Happy to answer any questions.", at: Date.now() - 1000 * 60 * 12 },
  ]);
  const [text, setText] = useState("");
  const [attachEscrow, setAttachEscrow] = useState(false);
  const [showEscrow, setShowEscrow] = useState(false);
  const [showTips, setShowTips] = useState(true);

  function send() {
    if (!text && !attachEscrow) return;
    if (text) setMessages((prev) => [...prev, { id: Math.random(), who: "me", text, at: Date.now() }]);
    if (attachEscrow) setShowEscrow(true);
    setText("");
    setAttachEscrow(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cn("flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl md:flex-row", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-200 bg-white")}>
        <div className={cn("flex items-center justify-between border-b px-4 py-3 md:border-b-0 md:border-r", dark ? "border-neutral-900" : "border-neutral-200")}>
          <div>
            <div className="text-sm opacity-70">Chat about</div>
            <div className="font-semibold">{listing.title}</div>
          </div>
          <button onClick={onClose} className={cn("rounded-lg px-3 py-1", dark ? "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800")}>
            Close
          </button>
        </div>

        {/* Chat column */}
        <div className="flex flex-1 flex-col">
          {showTips && (
            <div className={cn("m-3 rounded-xl p-3 text-xs", dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="mr-2">Safety tips:</strong>
                  Meet in a <em>very public</em> place (mall, café, police e-commerce zone), bring a friend, keep chats in-app, verify serials and condition before paying, and prefer Lightning escrow over cash.
                </div>
                <button onClick={() => setShowTips(false)} className={cn("rounded px-2 py-1", dark ? "hover:bg-neutral-800" : "hover:bg-neutral-200")}>
                  Hide
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 space-y-2 overflow-auto p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                  m.who === "me" ? "ml-auto bg-orange-500 text-neutral-950" : dark ? "bg-neutral-900" : "bg-neutral-100"
                )}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className={cn("flex items-center gap-2 border-t p-3", dark ? "border-neutral-900" : "border-neutral-200")}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message…"
              className={cn("flex-1 rounded-xl px-3 py-2 focus:outline-none", dark ? "border border-neutral-800 bg-neutral-900 text-neutral-100" : "border border-neutral-300 bg-white text-neutral-900")}
            />
            <label className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-xs", dark ? "border border-neutral-800" : "border border-neutral-300")}>
              <input type="checkbox" checked={attachEscrow} onChange={(e) => setAttachEscrow(e.target.checked)} /> Attach escrow proposal
            </label>
            <button onClick={send} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-neutral-950">
              Send
            </button>
          </div>
        </div>

        {/* Escrow side panel */}
        {showEscrow && (
          <div className={cn("w-full max-w-md border-l", dark ? "border-neutral-900" : "border-neutral-200")}>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="font-semibold">Escrow proposal</div>
              <button onClick={() => setShowEscrow(false)} className={cn("rounded px-2 py-1 text-xs", dark ? "hover:bg-neutral-900" : "hover:bg-neutral-100")}>
                Hide
              </button>
            </div>
            <div className="px-4 pb-4">
              <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} />
              <div className={cn("mt-1 text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>
                Funds are locked via Lightning hold invoice until both parties confirm release.
              </div>
            </div>
            <EscrowFlow listing={listing} onClose={() => setShowEscrow(false)} dark={dark} />
          </div>
        )}
      </div>
    </div>
  );
}

function EscrowFlow({ listing, onClose, dark }: { listing: Listing; onClose: () => void; dark: boolean }) {
  const [step, setStep] = useState(1);
  const feeBps = 100; // 1%
  const fee = Math.ceil((listing.priceSats * feeBps) / 10000);
  const total = listing.priceSats + fee;
  const [invoice, setInvoice] = useState(() => `lnbchold${total}n1p${Math.random().toString(36).slice(2, 10)}...`);
  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      <div className={cn("rounded-xl p-3 text-sm", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
        <div>
          Send <span className="font-bold text-orange-500">{formatSats(total)} sats</span> to lock funds:
        </div>
        <div className={cn("mt-3 rounded-lg p-3 text-xs", dark ? "bg-neutral-800" : "bg-neutral-100")}>{invoice}</div>
        <div className={cn("mt-2 text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>Includes escrow fee {formatSats(fee)} sats (1%).</div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setStep(2)} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-neutral-950 shadow shadow-orange-500/30">
            I’ve deposited
          </button>
          <button
            onClick={() => setInvoice(`lnbchold${total}n1p${Math.random().toString(36).slice(2, 10)}...`)}
            className={cn("rounded-xl px-4 py-2 text-sm", dark ? "border border-neutral-800 hover:bg-neutral-900" : "border border-neutral-300 hover:bg-neutral-100")}
          >
            Regenerate
          </button>
          <button onClick={onClose} className={cn("ml-auto rounded-xl px-4 py-2 text-sm", dark ? "border border-neutral-800 hover:bg-neutral-900" : "border border-neutral-300 hover:bg-neutral-100")}>
            Close
          </button>
        </div>
      </div>
      <div className={cn("rounded-xl p-3 text-xs", dark ? "bg-neutral-900 text-neutral-400" : "bg-neutral-100 text-neutral-600")}>
        Step {step}/3 — Meet in a very public place; if all good, both confirm release. Otherwise request refund; mediator can arbitrate.
      </div>
    </div>
  );
}

function NewListingModal({
  onClose,
  onPublish,
  dark,
}: {
  onClose: () => void;
  onPublish: (l: Listing) => void;
  dark: boolean;
}) {
  const [step, setStep] = useState(1);
  const [boost, setBoost] = useState(false);
  const [form, setForm] = useState({
    title: "",
    desc: "",
    priceSats: 0,
    category: "Electronics" as Category,
    location: "Toronto, ON",
    lat: 43.653,
    lng: -79.383,
    imageUrl: "",
    type: "sell" as "sell" | "want",
  });
  const listingFee = 500; // sats
  const boostFee = 2000; // sats (24h)
  const total = listingFee + (boost ? boostFee : 0);
  const fakeInvoice = `lnbc${total}n1p${Math.random().toString(36).slice(2, 10)}...`;
  const inputBase = dark
    ? "border-neutral-800 bg-neutral-900 text-neutral-100 placeholder-neutral-500 focus:border-orange-500"
    : "border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-orange-500";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className={cn("w-full max-w-2xl overflow-hidden rounded-2xl", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-200 bg-white")}>
        <div className={cn("flex items-center justify-between border-b p-4", dark ? "border-neutral-900" : "border-neutral-200")}>
          <h2 className="text-lg font-bold">Post a listing</h2>
          <button onClick={onClose} className={cn("rounded-lg px-3 py-1", dark ? "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800")}>
            Close
          </button>
        </div>
        {step === 1 && (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Title">
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="e.g., Antminer S19j Pro 100TH" />
              </Field>
              <Field label="Ad type">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "sell" | "want" })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)}>
                  <option value="sell">Selling</option>
                  <option value="want">Looking For</option>
                </select>
              </Field>
            </div>
            <Field label="Description">
              <textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={4} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="Condition, accessories, pickup preferences, etc." />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)}>
                  {categories.filter((c) => c !== "Featured").map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Location (neighbourhood/city)">
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="e.g., North York, ON" />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Lat">
                <input type="number" value={form.lat} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} />
              </Field>
              <Field label="Lng">
                <input type="number" value={form.lng} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Price (sats)">
                <input type="number" min={0} value={form.priceSats} onChange={(e) => setForm({ ...form, priceSats: Number(e.target.value || 0) })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="e.g., 5200000" />
              </Field>
              <Field label="Photo URL (temporary for demo)">
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="Paste an image URL" />
              </Field>
            </div>
            <div className={cn("rounded-xl p-3 text-xs", dark ? "border border-neutral-800 bg-neutral-900 text-neutral-400" : "border border-neutral-300 bg-white text-neutral-600")}>
              All coordination happens in in-app chat. Keep correspondence in-app; off-app contact is against our guidelines.
            </div>
            <div className={cn("flex items-center justify-between rounded-xl p-3", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={boost} onChange={(e) => setBoost(e.target.checked)} />
                <span>
                  Boost for 24h on homepage <span className="font-semibold text-orange-500">( + {formatSats(2000)} sats )</span>
                </span>
              </label>
              <span className={cn("text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>More views, faster responses</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn("text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
                Listing fee: <span className={cn("font-semibold", dark ? "text-neutral-200" : "text-neutral-900")}>{formatSats(500)} sats</span>
              </span>
              <button
                onClick={() => setStep(2)}
                disabled={!form.title || !form.priceSats}
                className={cn(
                  "rounded-xl px-5 py-3 font-semibold transition",
                  !form.title || !form.priceSats
                    ? dark
                      ? "cursor-not-allowed bg-neutral-800 text-neutral-600"
                      : "cursor-not-allowed bg-neutral-200 text-neutral-500"
                    : "bg-orange-500 text-neutral-950 shadow shadow-orange-500/30 hover:bg-orange-400"
                )}
              >
                Continue to listing fee
              </button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4 p-4">
            <h3 className="text-base font-semibold">Pay to publish</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className={cn("rounded-xl p-4", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
                <p className={cn("text-sm", dark ? "text-neutral-300" : "text-neutral-700")}>
                  Send <span className="font-bold text-orange-500">{formatSats(total)} sats</span> to the Lightning invoice below:
                </p>
                <div className={cn("mt-3 rounded-lg p-3 text-xs", dark ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>
                  {fakeInvoice}
                </div>
                <p className={cn("mt-3 text-xs", dark ? "text-neutral-500" : "text-neutral-600")}>
                  * Demo invoice. In production, generate BOLT11/lnurl via your LN backend.
                </p>
              </div>
              <div className={cn("rounded-xl p-4 text-sm", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
                <p className={cn(dark ? "text-neutral-300" : "text-neutral-700")}>Summary</p>
                <ul className="mt-2 space-y-1 opacity-90">
                  <li className="flex justify-between">
                    <span>Ad type</span>
                    <span>{form.type === "sell" ? "Selling" : "Looking For"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Listing fee</span>
                    <span>{formatSats(500)} sats</span>
                  </li>
                  {boost && (
                    <li className="flex justify-between">
                      <span>Boost (24h)</span>
                      <span>{formatSats(2000)} sats</span>
                    </li>
                  )}
                  <li className="mt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-orange-500">{formatSats(total)} sats</span>
                  </li>
                </ul>
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => setStep(1)} className={cn("rounded-xl px-4 py-2", dark ? "border border-neutral-800 hover:bg-neutral-900" : "border border-neutral-300 hover:bg-neutral-100")}>
                    Back
                  </button>
                  <button
                    onClick={() => {
                      const newItem: Listing = {
                        id: "temp",
                        title: form.title.trim(),
                        desc: form.desc.trim(),
                        priceSats: Number(form.priceSats) || 0,
                        category: form.category,
                        location: form.location.trim() || "Toronto, ON",
                        lat: form.lat,
                        lng: form.lng,
                        images: form.imageUrl
                          ? [form.imageUrl]
                          : ["https://images.unsplash.com/photo-1549924231-f129b911e442?q=80&w=1600&auto=format&fit=crop"],
                        boostedUntil: boost ? Date.now() + 1000 * 60 * 60 * 24 : 0,
                        seller: {
                          name: "@you",
                          score: 0,
                          deals: 0,
                          rating: 5.0,
                          verifications: { email: true },
                          onTimeRelease: 1.0,
                        },
                        createdAt: Date.now(),
                        type: form.type,
                      };
                      onPublish(newItem);
                    }}
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 font-semibold text-neutral-950 shadow shadow-orange-500/30 hover:from-amber-300 hover:to-orange-400"
                  >
                    I’ve paid — Publish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthModal({
  onClose,
  onAuthed,
  dark,
}: {
  onClose: () => void;
  onAuthed: (u: User) => void;
  dark: boolean;
}) {
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const inputBase = dark
    ? "border-neutral-800 bg-neutral-900 text-neutral-100 placeholder-neutral-500 focus:border-orange-500"
    : "border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-orange-500";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className={cn("w-full max-w-md overflow-hidden rounded-2xl", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-200 bg-white")}>
        <div className={cn("flex items-center justify-between border-b p-4", dark ? "border-neutral-900" : "border-neutral-200")}>
          <h2 className="text-lg font-bold">Sign in to Bitboard</h2>
          <button onClick={onClose} className={cn("rounded-lg px-3 py-1", dark ? "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800")}>
            Close
          </button>
        </div>
        <div className="space-y-4 p-4">
          <Field label="Email (magic link)">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="you@example.com" />
          </Field>
          <Field label="Handle (shown publicly)">
            <input value={handle} onChange={(e) => setHandle(e.target.value)} className={cn("w-full rounded-xl px-3 py-2 focus:outline-none", inputBase)} placeholder="@satoshi" />
          </Field>
          <button
            onClick={() => onAuthed({ id: "u1", email, handle: handle || "@you" })}
            disabled={!email}
            className={cn("w-full rounded-xl px-4 py-3 font-semibold", email ? "bg-orange-500 text-neutral-950" : dark ? "bg-neutral-800 text-neutral-600" : "bg-neutral-200 text-neutral-500")}
          >
            Send magic link (simulated)
          </button>
          <div className={cn("text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>Demo only — no emails are sent. Clicking signs you in.</div>
        </div>
      </div>
    </div>
  );
}

function SavedSearchesBar({
  saved,
  onRun,
  onToggleBell,
  onDelete,
  dark,
}: {
  saved: SavedSearch[];
  onRun: (s: SavedSearch) => void;
  onToggleBell: (id: string) => void;
  onDelete: (id: string) => void;
  dark: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto rounded-2xl p-3", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
      {saved.length === 0 ? (
        <span className={cn("text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
          No saved searches yet. Set filters and click “Save search”.
        </span>
      ) : (
        saved.map((s) => (
          <div key={s.id} className={cn("flex items-center gap-2 rounded-xl px-3 py-2", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-300 bg-white")}>
            <button onClick={() => onRun(s)} className="text-sm font-semibold hover:underline">
              {s.name}
            </button>
            {s.newCount > 0 && (
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-neutral-950">{s.newCount}</span>
            )}
            <button onClick={() => onToggleBell(s.id)} title="Toggle alerts" className={cn("text-sm", s.notify ? "text-orange-500" : "text-neutral-500")}>
              🔔
            </button>
            <button onClick={() => onDelete(s.id)} title="Remove" className={cn("text-sm", dark ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-500 hover:text-neutral-700")}>
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function LocationAutocomplete({
  value,
  onSelect,
  inputBase,
  dark,
}: {
  value: Place;
  onSelect: (p: Place) => void;
  inputBase: string;
  dark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value?.name || "");
  const [filtered, setFiltered] = useState<Place[]>(places);
  useEffect(() => {
    setText(value?.name || "");
  }, [value]);
  function onChange(v: string) {
    setText(v);
    const f = places.filter((p) => p.name.toLowerCase().includes(v.toLowerCase()));
    setFiltered(f);
    setOpen(true);
  }
  function choose(p: Place) {
    onSelect(p);
    setOpen(false);
  }
  return (
    <div className="relative">
      <input
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search area (e.g., North York)"
        className={cn("w-full rounded-2xl px-4 py-4", inputBase)}
      />
      {open && (
        <div className={cn("absolute z-20 mt-2 w-full overflow-hidden rounded-xl border", dark ? "border-neutral-800 bg-neutral-900" : "border-neutral-300 bg-white")}>
          {filtered.length === 0 && (
            <div className={cn("px-3 py-2 text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
              No matches. Try: Toronto, Downtown, North York…
            </div>
          )}
          {filtered.map((p) => (
            <button key={p.name} onClick={() => choose(p)} className={cn("block w-full px-3 py-2 text-left text-sm", dark ? "hover:bg-neutral-800" : "hover:bg-neutral-100")}>
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SafetyTipsSection({ dark }: { dark: boolean }) {
  return (
    <section id="tips" className="mx-auto mt-14 max-w-7xl">
      <div className={cn("rounded-2xl border p-6", dark ? "border-neutral-800 bg-neutral-950" : "border-neutral-300 bg-white")}>
        <h3 className="text-lg font-bold">Buyer & Seller Safety</h3>
        <ul className={cn("mt-3 list-disc space-y-2 pl-6 text-sm", dark ? "text-neutral-300" : "text-neutral-700")}>
          <li>
            Meet in a <strong>very public</strong> place: malls, cafés, or police e-commerce zones.
          </li>
          <li>Bring a friend or tell someone your meeting place and time.</li>
          <li>
            Keep <strong>all correspondence in-app</strong>; off-app contact is against our guidelines.
          </li>
          <li>Inspect items in person; test devices and verify serial numbers.</li>
          <li>
            Prefer <strong>Lightning escrow</strong> over cash; confirm release only when satisfied.
          </li>
          <li>Trust your instincts — if something feels off, walk away and report the listing.</li>
        </ul>
      </div>
    </section>
  );
}

function TermsSection({ dark }: { dark: boolean }) {
  return (
    <section id="terms" className="mx-auto mt-10 max-w-7xl">
      <div className={cn("rounded-2xl border p-6", dark ? "border-neutral-800 bg-neutral-950" : "border-neutral-300 bg-white")}>
        <h3 className="text-lg font-bold">Terms & Conditions</h3>
        <div className={cn("mt-3 space-y-3 text-sm", dark ? "text-neutral-300" : "text-neutral-700")}>
          <p>
            By using Bitboard, you agree to keep all correspondence in-app for safety. Off-app contact may limit our ability to help in disputes.
          </p>
          <p>Listings must comply with local laws. You are responsible for ensuring legality and authenticity of items and services.</p>
          <p>Escrow is provided via Lightning hold invoices. Funds are released only when both parties confirm, or a mediator decides in good faith based on in-app evidence.</p>
          <p id="policy">
            <strong>Prohibited items</strong> include: weapons, illicit drugs, stolen goods, counterfeit items, recalled/unsafe goods, and anything illegal in your jurisdiction.
          </p>
          <p>We are a venue: transactions are between users. Bitboard is not a bank and does not custody fiat. Bitcoin price estimates are informational only.</p>
          <p>Violations of these terms can result in deletion of content and/or account suspension.</p>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm">{label}</span>
      {children}
    </label>
  );
}
