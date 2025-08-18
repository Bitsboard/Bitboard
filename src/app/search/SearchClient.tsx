"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ListingCard, ListingRow, Nav, ListingModal, LocationModal } from "@/components";
import type { Listing, AdType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { t, useLang } from "@/lib/i18n";

// Lightweight location catalog (sample). Replace/expand with a full open-source dataset.
const LOCATIONS = [
    { country: "Canada", region: "Ontario", city: "Toronto", lat: 43.6532, lng: -79.3832 },
    { country: "Canada", region: "Ontario", city: "Ottawa", lat: 45.4215, lng: -75.6972 },
    { country: "Canada", region: "British Columbia", city: "Vancouver", lat: 49.2827, lng: -123.1207 },
];

export default function SearchClient() {
    const params = useSearchParams();
    const router = useRouter();
    const [dark, setDark] = useState(true);
    const layoutParam = (params.get("layout") || "").trim();
    const initialLayout: "grid" | "list" = layoutParam === "list"
        ? "list"
        : layoutParam === "grid"
            ? "grid"
            : (typeof window !== "undefined" && (localStorage.getItem("layoutPref") as "grid" | "list" | null)) || "grid";
    const [layout, setLayout] = useState<"grid" | "list">(initialLayout);
    const [unit, setUnit] = useState<"sats" | "BTC">("sats");
    const [btcCad, setBtcCad] = useState<number | null>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [active, setActive] = useState<Listing | null>(null);
    const isFetchingRef = useRef(false);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const pageSize = 24;
    const lang = useLang();

    const q = (params.get("q") || "").trim();
    const category = (params.get("category") || "").trim();
    const adTypeParam = (params.get("adType") || "all").trim() as AdType;
    const minPriceParam = params.get("minPrice");
    const maxPriceParam = params.get("maxPrice");
    const sortByParam = (params.get("sortBy") || "date").trim();
    const sortOrderParam = (params.get("sortOrder") || "desc").trim();
    const latParam = params.get("lat");
    const lngParam = params.get("lng");

    // Local input state for the search bar and filters
    const [inputQuery, setInputQuery] = useState(q);
    const [minPrice, setMinPrice] = useState<string>(minPriceParam ?? "");
    const [maxPrice, setMaxPrice] = useState<string>(maxPriceParam ?? "");
    const [selCategory, setSelCategory] = useState<string>(category);
    const [selAdType, setSelAdType] = useState<AdType>(adTypeParam);
    const [sortChoice, setSortChoice] = useState<string>(`${sortByParam}:${sortOrderParam}`);
    const [country, setCountry] = useState<string>("");
    const [region, setRegion] = useState<string>("");
    const [city, setCity] = useState<string>("");
    const [centerLat, setCenterLat] = useState<string>(latParam ?? "");
    const [centerLng, setCenterLng] = useState<string>(lngParam ?? "");
    const [radiusKm, setRadiusKm] = useState<number>(() => {
        try { const v = localStorage.getItem('userRadiusKm'); if (v) return Number(v); } catch { }
        return 25;
    });
    const [showLocationModal, setShowLocationModal] = useState(false);

    useEffect(() => { setInputQuery(q); }, [q]);
    // Sync lang from URL prefix to ensure translations show correctly when landing directly on /{lang}/search
    useEffect(() => {
        try {
            const first = window.location.pathname.split('/').filter(Boolean)[0];
            const known = ['en', 'fr', 'es', 'de'];
            if (first && known.includes(first)) {
                // Force document lang to match
                document.documentElement.lang = first;
            }
        } catch { }
    }, []);
    useEffect(() => { setSelCategory(category); }, [category]);
    useEffect(() => { setSelAdType(adTypeParam); }, [adTypeParam]);
    useEffect(() => { setMinPrice(minPriceParam ?? ""); }, [minPriceParam]);
    useEffect(() => { setMaxPrice(maxPriceParam ?? ""); }, [maxPriceParam]);
    useEffect(() => { setSortChoice(`${sortByParam}:${sortOrderParam}`); }, [sortByParam, sortOrderParam]);
    useEffect(() => { setCenterLat(latParam ?? ""); setCenterLng(lngParam ?? ""); }, [latParam, lngParam]);
    // If no lat/lng in URL, attempt to seed from saved location
    useEffect(() => {
        if (!latParam || !lngParam) {
            try {
                const raw = localStorage.getItem('userLocation');
                if (raw) {
                    const p = JSON.parse(raw) as { lat: number; lng: number; name?: string };
                    if (p?.lat && p?.lng) {
                        setCenterLat(String(p.lat));
                        setCenterLng(String(p.lng));
                    }
                }
            } catch { }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        if (layoutParam) setLayout(layoutParam === "list" ? "list" : "grid");
    }, [layoutParam]);

    useEffect(() => {
        fetch("/api/rate").then(r => r.json() as Promise<{ cad: number | null }>).then(d => setBtcCad(d.cad)).catch(() => { });
    }, []);

    // Reflect layout to URL without touching data params
    useEffect(() => {
        try { localStorage.setItem("layoutPref", layout); } catch { }
        const sp = new URLSearchParams(window.location.search);
        if (layout) sp.set("layout", layout);
        const newUrl = `/${lang}/search?${sp.toString()}`;
        if (newUrl !== window.location.pathname + window.location.search) {
            router.replace(newUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layout]);

    const mapRows = useCallback((rows: any[]): Listing[] => rows.map((row: any) => ({
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
            if (typeof row.imageUrl === 'string' && row.imageUrl.includes(',')) return (row.imageUrl as string).split(',').map((s: string) => s.trim()).filter(Boolean);
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
            return { name, score, deals, rating: 4 + ((base % 10) / 10), verifications: { email: true, phone: verified, lnurl: verified }, onTimeRelease: verified ? 0.97 : 0.9 };
        })(),
        createdAt: Number(row.createdAt) * 1000,
    })), []);

    const satsFromUnitValue = (val: string): string | null => {
        if (!val) return null;
        const num = Number(val);
        if (!Number.isFinite(num)) return null;
        if (unit === "BTC") return String(Math.round(num * 1e8));
        return String(Math.round(num));
    };

    const resolveLatLng = () => {
        const match = LOCATIONS.find(l => l.country === country && l.region === region && l.city === city);
        if (match) return { lat: String(match.lat), lng: String(match.lng) };
        return { lat: centerLat, lng: centerLng };
    };

    const buildParams = useCallback((overrideSort?: string) => {
        const sp = new URLSearchParams();
        if (inputQuery) sp.set("q", inputQuery);
        if (selCategory) sp.set("category", selCategory);
        if (selAdType && selAdType !== "all") sp.set("adType", selAdType);
        const minSats = satsFromUnitValue(minPrice);
        const maxSats = satsFromUnitValue(maxPrice);
        if (minSats) sp.set("minPrice", minSats);
        if (maxSats) sp.set("maxPrice", maxSats);
        const sc = overrideSort ?? sortChoice;
        const [sb, so] = (sc || "date:desc").split(":");
        sp.set("sortBy", sb === 'distance' ? 'distance' : sb);
        sp.set("sortOrder", sb === 'distance' ? 'asc' : so);
        // Persist layout selection across filter applications
        sp.set("layout", layout);
        if (sb === 'distance') {
            const { lat, lng } = resolveLatLng();
            if (lat && lng) { sp.set("lat", lat); sp.set("lng", lng); }
        }
        return sp;
    }, [inputQuery, selCategory, selAdType, minPrice, maxPrice, sortChoice, unit, country, region, city, centerLat, centerLng, layout]);

    const buildQuery = useCallback((offset: number) => {
        const sp = buildParams();
        sp.set("limit", String(pageSize));
        sp.set("offset", String(offset));
        return `/api/listings?${sp.toString()}`;
    }, [buildParams]);

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
        ? "border border-white/30 bg-neutral-800/50 text-neutral-100 placeholder-neutral-400 backdrop-blur-sm"
        : "border border-neutral-700/30 bg-white/80 text-neutral-900 placeholder-neutral-500 backdrop-blur-sm";

    const applyFilters = () => {
        const sp = buildParams();
        router.push(`/${lang}/search?${sp.toString()}`);
    };

    const clearFilters = () => {
        const sp = new URLSearchParams();
        if (inputQuery) sp.set("q", inputQuery);
        router.push(`/${lang}/search?${sp.toString()}`);
    };

    const showNoResults = initialLoaded && listings.length === 0;

    const countries = useMemo(() => Array.from(new Set(LOCATIONS.map(l => l.country))), []);
    const regionsForCountry = useMemo(() => LOCATIONS.filter(l => l.country === country), [country]);
    const regionsList = useMemo(() => Array.from(new Set(regionsForCountry.map(l => l.region))), [regionsForCountry]);
    const citiesList = useMemo(() => regionsForCountry.filter(l => l.region === region).map(l => l.city), [regionsForCountry, region]);

    function getSavedPlaceName(): string | null {
        try {
            const raw = localStorage.getItem('userLocation');
            if (!raw) return null;
            const p = JSON.parse(raw) as { name?: string };
            return p?.name || null;
        } catch { return null; }
    }

    const COUNTRY_EXPAND: Record<string, string> = {
        CA: 'Canada', CAN: 'Canada',
        US: 'United States', USA: 'United States',
        UK: 'United Kingdom', GB: 'United Kingdom', GBR: 'United Kingdom',
        DE: 'Germany', DEU: 'Germany',
        FR: 'France', FRA: 'France',
        ES: 'Spain', ESP: 'Spain',
        MX: 'Mexico', MEX: 'Mexico',
        IT: 'Italy', ITA: 'Italy',
        BR: 'Brazil', BRA: 'Brazil',
        AU: 'Australia', AUS: 'Australia',
        JP: 'Japan', JPN: 'Japan'
    };

    function expandSingleTokenCountry(name: string): string {
        const token = name.trim();
        return COUNTRY_EXPAND[token as keyof typeof COUNTRY_EXPAND] || token;
    }

    function deriveCountry(name: string | null): string | null {
        if (!name) return null;
        const parts = name.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length === 0) return null;
        if (parts.length === 1) {
            const p = parts[0];
            return expandSingleTokenCountry(p);
        }
        // Prefer the last non-abbreviation token
        for (let i = parts.length - 1; i >= 0; i--) {
            const token = parts[i];
            if (token.length > 2) return token;
            const expanded = COUNTRY_EXPAND[token as keyof typeof COUNTRY_EXPAND];
            if (expanded) return expanded;
        }
        const last = parts[parts.length - 1];
        return COUNTRY_EXPAND[last as keyof typeof COUNTRY_EXPAND] || last || null;
    }

    return (
        <div className={cn("min-h-screen", bg, dark ? "dark" : "")}>
            <Nav onPost={() => { }} onToggleTheme={() => setDark((d) => !d)} dark={dark} user={null} onAuth={() => { }} unit={unit} setUnit={setUnit} layout={layout} setLayout={setLayout} />

            <div className="mx-auto max-w-7xl px-4 py-8">
                {/* Search bar */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-12">
                    <div className="sm:col-span-9 relative">
                        <input
                            value={inputQuery}
                            onChange={(e) => setInputQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
                            placeholder={t('search', lang) + " bikes, ASICs, consoles…"}
                            className={cn("w-full rounded-3xl px-6 pr-32 py-5 text-lg focus:outline-none transition-all duration-300", inputBase)}
                        />
                        <button
                            onClick={applyFilters}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2 text-sm font-semibold text-white shadow"
                        >
                            {t('search', lang)}
                        </button>
                    </div>
                    <div className="sm:col-span-3 flex items-center gap-2">
                        <select
                            value={sortChoice}
                            onChange={(e) => { const v = e.target.value; setSortChoice(v); const sp = buildParams(v); router.push(`/${lang}/search?${sp.toString()}`); }}
                            className={cn("w-full max-w-xs rounded-3xl px-6 pr-10 py-5 text-lg appearance-none bg-no-repeat bg-right", inputBase)}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em' }}
                        >
                            <option value="date:desc">{t('newest', lang)}</option>
                            <option value="date:asc">{t('oldest', lang)}</option>
                            <option value="price:desc">{t('highest_price', lang)}</option>
                            <option value="price:asc">{t('lowest_price', lang)}</option>
                            <option value="distance:asc">{t('closest', lang)}</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Sidebar Filters */}
                    <aside className="lg:col-span-3 space-y-4">
                        <div className={cn("rounded-2xl p-4", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-300 bg-white")}>
                            <div className="flex items-start justify-between">
                                <div className={cn("font-semibold", dark ? "text-neutral-200" : "text-neutral-900")}>{t('location', lang)}</div>
                                <div>
                                    <button onClick={() => setShowLocationModal(true)} className="rounded-xl px-3 py-1 text-xs text-white bg-gradient-to-r from-orange-500 to-red-500">{t('change', lang)}</button>
                                </div>
                            </div>
                            {radiusKm >= 5000000 ? (
                                <div className={cn("mt-3", dark ? "text-neutral-200" : "text-neutral-800")}>{t('all_listings_globally', lang)}</div>
                            ) : radiusKm >= 1000000 ? (
                                <div className={cn("mt-3", dark ? "text-neutral-200" : "text-neutral-800")}>{t('all_of_country', lang).replace('{country}', deriveCountry(getSavedPlaceName()) || 'your country')}</div>
                            ) : (
                                <>
                                    <div className={cn("mt-3 text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>
                                        {t('within_km_of', lang).replace('{n}', String(radiusKm))}
                                    </div>
                                    <div className={cn("mt-1", dark ? "text-neutral-200" : "text-neutral-800")} title={(() => { try { const raw = localStorage.getItem('userLocation'); if (raw) { const p = JSON.parse(raw) as { name?: string }; if (p?.name) return p.name; } } catch { }; return undefined; })()}>
                                        {(() => {
                                            try { const raw = localStorage.getItem('userLocation'); if (raw) { const p = JSON.parse(raw) as { name?: string }; if (p?.name) return `${p.name}`; } } catch { }
                                            return t('set_location', lang);
                                        })()}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={cn("rounded-2xl p-4", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-300 bg-white")}>
                            <div className={cn("font-semibold mb-3", dark ? "text-neutral-200" : "text-neutral-900")}>{t('category', lang)}</div>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { key: 'cat_all', value: '' },
                                    { key: 'cat_electronics', value: 'Electronics' },
                                    { key: 'cat_mining_gear', value: 'Mining Gear' },
                                    { key: 'cat_home_garden', value: 'Home & Garden' },
                                    { key: 'cat_sports_bikes', value: 'Sports & Bikes' },
                                    { key: 'cat_tools', value: 'Tools' },
                                    { key: 'cat_games_hobbies', value: 'Games & Hobbies' },
                                    { key: 'cat_furniture', value: 'Furniture' },
                                    { key: 'cat_services', value: 'Services' },
                                ].map((c) => (
                                    <button
                                        key={c.key}
                                        onClick={() => setSelCategory(c.value)}
                                        className={cn("rounded-xl px-3 py-1 text-sm", (selCategory || '') === c.value ? "bg-orange-500 text-white" : (dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700"))}
                                    >
                                        {t(c.key, lang)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={cn("rounded-2xl p-4", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-300 bg-white")}>
                            <div className={cn("font-semibold mb-3", dark ? "text-neutral-200" : "text-neutral-900")}>{t('type', lang)}</div>
                            <div className="flex gap-2">
                                <button onClick={() => setSelAdType('all')} className={cn("rounded-xl px-3 py-1 text-sm", selAdType === 'all' ? "bg-orange-500 text-white" : (dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700"))}>{t('all_listings', lang)}</button>
                                <button onClick={() => setSelAdType('sell')} className={cn("rounded-xl px-3 py-1 text-sm", selAdType === 'sell' ? "bg-orange-500 text-white" : (dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700"))}>{t('selling', lang)}</button>
                                <button onClick={() => setSelAdType('want')} className={cn("rounded-xl px-3 py-1 text-sm", selAdType === 'want' ? "bg-orange-500 text-white" : (dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700"))}>{t('looking_for', lang)}</button>
                            </div>
                        </div>

                        <div className={cn("rounded-2xl p-4", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-300 bg-white")}>
                            <div className={cn("font-semibold mb-3", dark ? "text-neutral-200" : "text-neutral-900")}>{unit === 'BTC' ? t('price_btc', lang) : t('price_sats', lang)}</div>
                            <div className="flex items-center gap-2">
                                <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={unit === 'BTC' ? "Min BTC" : "Min sats"} className={cn("w-1/2 rounded-xl px-3 py-2 text-sm", inputBase)} />
                                <span className={cn(dark ? "text-neutral-400" : "text-neutral-500")}>—</span>
                                <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={unit === 'BTC' ? "Max BTC" : "Max sats"} className={cn("w-1/2 rounded-xl px-3 py-2 text-sm", inputBase)} />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={applyFilters} className="flex-1 rounded-2xl px-4 py-3 text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white">{t('apply', lang)}</button>
                            <button onClick={clearFilters} className={cn("flex-1 rounded-2xl px-4 py-3 text-sm", dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>{t('clear_all', lang)}</button>
                        </div>
                    </aside>

                    {/* Results */}
                    <section className="lg:col-span-9">
                        {layout === "grid" ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                                {listings.map((l) => (
                                    <ListingCard key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setActive(l)} />
                                ))}
                                {showNoResults && (
                                    <div className={cn("col-span-full rounded-3xl p-16 text-center border-2 border-dashed", dark ? "border-neutral-700 text-neutral-400" : "border-neutral-300 text-neutral-500")}>
                                        <div className="text-4xl mb-4">🔍</div>
                                        <p className={cn("text-lg font-medium", dark ? "text-neutral-300" : "text-neutral-700")}>{t('no_results', lang)}</p>
                                        <p className={cn("text-sm mt-2", dark ? "text-neutral-400" : "text-neutral-600")}>{t('try_different', lang)}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {listings.map((l) => (
                                    <ListingRow key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setActive(l)} />
                                ))}
                                {showNoResults && (
                                    <div className={cn("rounded-3xl p-16 text-center border-2 border-dashed", dark ? "border-neutral-700 text-neutral-400" : "border-neutral-300 text-neutral-500")}>
                                        <div className="text-4xl mb-4">🔍</div>
                                        <p className={cn("text-lg font-medium", dark ? "text-neutral-300" : "text-neutral-700")}>{t('no_results', lang)}</p>
                                        <p className={cn("text-sm mt-2", dark ? "text-neutral-400" : "text-neutral-600")}>{t('try_different', lang)}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bottom status / sentinel */}
                        {hasMore && (
                            <div ref={loadMoreRef} className="py-8 text-center text-sm opacity-70">
                                {isLoadingMore ? t('loading_more', lang) : ""}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {active && (
                <ListingModal listing={active} onClose={() => setActive(null)} unit={unit} btcCad={btcCad} dark={dark} onChat={() => { }} />
            )}
            {showLocationModal && (
                <LocationModal
                    open={showLocationModal}
                    onClose={() => setShowLocationModal(false)}
                    initialCenter={{ lat: Number(centerLat || 43.6532), lng: Number(centerLng || -79.3832), name: '' }}
                    initialRadiusKm={radiusKm}
                    dark={dark}
                    onApply={(place) => {
                        setCenterLat(String(place.lat));
                        setCenterLng(String(place.lng));
                        try { localStorage.setItem('userLocation', JSON.stringify(place)); } catch { }
                        const sp = buildParams();
                        sp.set('lat', String(place.lat));
                        sp.set('lng', String(place.lng));
                        router.push(`/${lang}/search?${sp.toString()}`);
                        setShowLocationModal(false);
                    }}
                />
            )}
        </div>
    );
}


