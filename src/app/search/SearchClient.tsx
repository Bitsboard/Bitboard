"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ListingCard, ListingRow, Nav } from "@/components";
import type { Listing, AdType, Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SearchClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [dark, setDark] = useState(true);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [unit, setUnit] = useState<"sats" | "BTC">("sats");
  const [btcCad, setBtcCad] = useState<number | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const isFetchingRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 24;

  const q = (params.get("q") || "").trim();
  const category = (params.get("category") || "").trim();
  const adTypeParam = (params.get("adType") || "all").trim() as AdType;
  const minPriceParam = params.get("minPrice");
  const maxPriceParam = params.get("maxPrice");
  const sortByParam = (params.get("sortBy") || "date").trim();
  const sortOrderParam = (params.get("sortOrder") || "desc").trim();

  // Local input state for the search bar
  const [inputQuery, setInputQuery] = useState(q);
  const [minPrice, setMinPrice] = useState<string>(minPriceParam ?? "");
  const [maxPrice, setMaxPrice] = useState<string>(maxPriceParam ?? "");
  const [selCategory, setSelCategory] = useState<string>(category);
  const [selAdType, setSelAdType] = useState<AdType>(adTypeParam);
  const [sortBy, setSortBy] = useState<string>(sortByParam);
  const [sortOrder, setSortOrder] = useState<string>(sortOrderParam);

  useEffect(() => { setInputQuery(q); }, [q]);
  useEffect(() => { setSelCategory(category); }, [category]);
  useEffect(() => { setSelAdType(adTypeParam); }, [adTypeParam]);
  useEffect(() => { setMinPrice(minPriceParam ?? ""); }, [minPriceParam]);
  useEffect(() => { setMaxPrice(maxPriceParam ?? ""); }, [maxPriceParam]);
  useEffect(() => { setSortBy(sortByParam); }, [sortByParam]);
  useEffect(() => { setSortOrder(sortOrderParam); }, [sortOrderParam]);

  useEffect(() => {
    fetch("/api/rate").then(r => r.json() as Promise<{ cad: number | null }>).then(d => setBtcCad(d.cad)).catch(() => {});
  }, []);

  const mapRows = useCallback((rows: any[]): Listing[] => rows.map((row: any) => ({
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
    seller: { name: "demo_seller", score: 10, deals: 0, rating: 5, verifications: { email: true, phone: true, lnurl: false }, onTimeRelease: 0.98 },
    createdAt: Number(row.createdAt) * 1000,
  })), []);

  const buildQuery = useCallback((offset: number) => {
    const sp = new URLSearchParams();
    sp.set("limit", String(pageSize));
    sp.set("offset", String(offset));
    if (q) sp.set("q", q);
    if (selCategory) sp.set("category", selCategory);
    if (selAdType && selAdType !== "all") sp.set("adType", selAdType);
    if (minPrice) sp.set("minPrice", minPrice);
    if (maxPrice) sp.set("maxPrice", maxPrice);
    if (sortBy) sp.set("sortBy", sortBy);
    if (sortOrder) sp.set("sortOrder", sortOrder);
    return `/api/listings?${sp.toString()}`;
  }, [q, selCategory, selAdType, minPrice, maxPrice, sortBy, sortOrder]);

  // Initial load and when params change
  useEffect(() => {
    const load = async () => {
      try {
        isFetchingRef.current = true;
        setInitialLoaded(false);
        const r = await fetch(buildQuery(0));
        const data = await r.json() as { listings?: any[]; total?: number };
        const rows = data.listings ?? [];
        const mapped = mapRows(rows);
        setListings(mapped);
        const t = Number(data.total ?? 0);
        setTotal(t);
        setHasMore(mapped.length < t);
      } finally {
        isFetchingRef.current = false;
        setInitialLoaded(true);
      }
    };
    load();
  }, [buildQuery, mapRows]);

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    try {
      const r = await fetch(buildQuery(listings.length));
      const data = await r.json() as { listings?: any[]; total?: number };
      const rows = data.listings ?? [];
      const mapped = mapRows(rows);
      setListings(prev => [...prev, ...mapped]);
      const t = Number(data.total ?? total);
      setTotal(t);
      setHasMore(listings.length + mapped.length < t);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [buildQuery, hasMore, listings.length, mapRows, total]);

  useEffect(() => {
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
  }, [loadMore]);

  const bg = dark ? "bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" : "bg-gradient-to-br from-neutral-50 via-white to-neutral-100";
  const inputBase = dark
    ? "border-neutral-700/50 bg-neutral-800/50 text-neutral-100 placeholder-neutral-400 focus:border-orange-500/50 focus:bg-neutral-800/70 backdrop-blur-sm"
    : "border-neutral-300/50 bg-white/80 text-neutral-900 placeholder-neutral-500 focus:border-orange-500/50 focus:bg-white backdrop-blur-sm";

  const submitSearch = () => {
    const sp = new URLSearchParams();
    if (inputQuery) sp.set("q", inputQuery);
    if (selCategory) sp.set("category", selCategory);
    if (selAdType && selAdType !== "all") sp.set("adType", selAdType);
    if (minPrice) sp.set("minPrice", minPrice);
    if (maxPrice) sp.set("maxPrice", maxPrice);
    if (sortBy) sp.set("sortBy", sortBy);
    if (sortOrder) sp.set("sortOrder", sortOrder);
    router.push(`/search?${sp.toString()}`);
  };

  const clearFilters = () => {
    const sp = new URLSearchParams();
    if (inputQuery) sp.set("q", inputQuery);
    router.push(`/search?${sp.toString()}`);
  };

  const showNoResults = initialLoaded && listings.length === 0;

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

  return (
    <div className={cn("min-h-screen", bg, dark ? "dark" : "")}> 
      <Nav onPost={() => {}} onToggleTheme={() => setDark((d) => !d)} dark={dark} user={null} onAuth={() => {}} unit={unit} setUnit={setUnit} layout={layout} setLayout={setLayout} />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Search bar */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-12">
          <div className="sm:col-span-8 relative">
            <input
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }}
              placeholder="Search bikes, ASICs, consoles…"
              className={cn("w-full rounded-3xl px-6 py-5 pr-12 text-lg focus:outline-none transition-all duration-300 hover:border-orange-500/50", inputBase)}
            />
            <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-xl opacity-60">🔍</div>
          </div>
          <div className="sm:col-span-2">
            <button
              onClick={submitSearch}
              className="w-full rounded-3xl px-6 py-5 text-lg font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-orange-500 to-red-500 text-white"
            >
              Search
            </button>
          </div>
          <div className="sm:col-span-2 flex items-center justify-end gap-2">
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); submitSearch(); }} className={cn("rounded-2xl px-4 py-3 text-sm", inputBase)}>
              <option value="date">Newest</option>
              <option value="price">Price</option>
            </select>
            <select value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); submitSearch(); }} className={cn("rounded-2xl px-4 py-3 text-sm", inputBase)}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <button onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')} className={cn("rounded-2xl px-4 py-3 text-sm", inputBase)}>
              {layout === 'grid' ? 'List' : 'Grid'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-3 space-y-4">
            <div className={cn("rounded-2xl p-4", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-300 bg-white")}> 
              <div className="font-semibold mb-3">Category</div>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setSelCategory(c === 'Featured' ? '' : c); setHasMore(true); submitSearch(); }}
                    className={cn("rounded-xl px-3 py-1 text-sm", selCategory === c ? "bg-orange-500 text-white" : (dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700"))}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className={cn("rounded-2xl p-4", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-300 bg-white")}> 
              <div className="font-semibold mb-3">Type</div>
              <div className="flex gap-2">
                {(["all", "sell", "want"] as AdType[]).map((t) => (
                  <button key={t} onClick={() => { setSelAdType(t); setHasMore(true); submitSearch(); }} className={cn("rounded-xl px-3 py-1 text-sm capitalize", selAdType === t ? "bg-orange-500 text-white" : (dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700"))}>{t}</button>
                ))}
              </div>
            </div>

            <div className={cn("rounded-2xl p-4", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-300 bg-white")}> 
              <div className="font-semibold mb-3">Price (sats)</div>
              <div className="flex items-center gap-2">
                <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" className={cn("w-1/2 rounded-xl px-3 py-2 text-sm", inputBase)} />
                <span className={cn(dark ? "text-neutral-400" : "text-neutral-500")}>—</span>
                <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" className={cn("w-1/2 rounded-xl px-3 py-2 text-sm", inputBase)} />
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => submitSearch()} className="rounded-xl px-3 py-2 text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white">Apply</button>
                <button onClick={() => { setMinPrice(""); setMaxPrice(""); submitSearch(); }} className={cn("rounded-xl px-3 py-2 text-sm", dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>Clear</button>
              </div>
            </div>

            <button onClick={clearFilters} className={cn("w-full rounded-2xl px-4 py-3 text-sm", dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>Clear all filters</button>
          </aside>

          {/* Results */}
          <section className="lg:col-span-9">
            {layout === "grid" ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => {}} />
                ))}
                {showNoResults && (
                  <div className={cn("col-span-full rounded-3xl p-16 text-center border-2 border-dashed", dark ? "border-neutral-700 text-neutral-400" : "border-neutral-300 text-neutral-500")}> 
                    <div className="text-4xl mb-4">🔍</div>
                    <p className={cn("text-lg font-medium", dark ? "text-neutral-300" : "text-neutral-700")}>No results found</p>
                    <p className={cn("text-sm mt-2", dark ? "text-neutral-400" : "text-neutral-600")}>Try different keywords or clear filters</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((l) => (
                  <ListingRow key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => {}} />
                ))}
                {showNoResults && (
                  <div className={cn("rounded-3xl p-16 text-center border-2 border-dashed", dark ? "border-neutral-700 text-neutral-400" : "border-neutral-300 text-neutral-500")}> 
                    <div className="text-4xl mb-4">🔍</div>
                    <p className={cn("text-lg font-medium", dark ? "text-neutral-300" : "text-neutral-700")}>No results found</p>
                    <p className={cn("text-sm mt-2", dark ? "text-neutral-400" : "text-neutral-600")}>Try different keywords or clear filters</p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom status / sentinel */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-8 text-center text-sm opacity-70">
                {isLoadingMore ? "Loading more…" : ""}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}


