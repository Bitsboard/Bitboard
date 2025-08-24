"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ListingCard, ListingRow, ListingModal, LocationModal } from "@/components";
import type { Listing, AdType, Place } from "@/lib/types";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-client";
import { useSettings, useModals, useUser } from "@/lib/settings";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { useLocation } from "@/lib/contexts/LocationContext";
import { dataService, CONFIG } from "@/lib/dataService";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { mockListings } from '@/lib/mockData';

export default function SearchClient() {
    const params = useSearchParams();
    const router = useRouter();

    // Use centralized settings
    const { unit, layout } = useSettings();
    const { modals, setModal } = useModals();
    const { user } = useUser();
    const { theme } = useTheme();
    const { center: savedCenter, radiusKm: savedRadiusKm, updateLocation } = useLocation();
    const dark = theme === 'dark';
    
    // Check if we're deployed (same logic as homepage)
    const ENV = process.env.NEXT_PUBLIC_ENV || process.env.NEXT_PUBLIC_BRANCH || 'development';
    const isDeployed = ENV === "production" || ENV === "staging" || ENV === "main";

    const layoutParam = (params.get("layout") || "").trim();
    const initialLayout: "grid" | "list" = layoutParam === "list"
        ? "list"
        : layoutParam === "grid"
            ? "grid"
            : layout;

    const [listings, setListings] = useState<Listing[]>([]);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [btcCad, setBtcCad] = useState<number | null>(null);
    const isFetchingRef = useRef(false);
    // Remove loadMoreRef - using Load More button instead
    const lang = useLang();
    const { active, showLocationModal } = modals;

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
    const [radiusKm, setRadiusKm] = useState<number>(CONFIG.DEFAULT_RADIUS_KM);


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

    // Persisted radius on locale change (for Worldwide state)
    useEffect(() => {
        if (Number.isFinite(savedRadiusKm)) {
            setRadiusKm(savedRadiusKm);
        }
    }, [lang, savedRadiusKm]);

    useEffect(() => { setSelCategory(category); }, [category]);
    useEffect(() => { setSelAdType(adTypeParam); }, [adTypeParam]);
    useEffect(() => { setMinPrice(minPriceParam ?? ""); }, [minPriceParam]);
    useEffect(() => { setMaxPrice(maxPriceParam ?? ""); }, [maxPriceParam]);
    useEffect(() => { setSortChoice(`${sortByParam}:${sortOrderParam}`); }, [sortByParam, sortOrderParam]);
    useEffect(() => { setCenterLat(latParam ?? ""); setCenterLng(lngParam ?? ""); }, [latParam, lngParam]);



    // Sync with location context
    useEffect(() => {
        if (Number.isFinite(savedRadiusKm)) {
            console.log('SearchClient: Syncing radius with context:', savedRadiusKm);
            setRadiusKm(savedRadiusKm);
        }
    }, [savedRadiusKm]);

    // Sync center coordinates with context when no URL params
    useEffect(() => {
        if (!latParam && !lngParam && savedCenter?.lat && savedCenter?.lng) {
            console.log('SearchClient: Syncing center with context:', savedCenter);
            setCenterLat(String(savedCenter.lat));
            setCenterLng(String(savedCenter.lng));
        }
    }, [latParam, lngParam, savedCenter]);

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

    // Reflect layout to URL without touching data params
    useEffect(() => {
        try {
            const sp = new URLSearchParams(window.location.search);
            if (layout) sp.set("layout", layout);
            const newUrl = `/${lang}/search?${sp.toString()}`;
            if (newUrl !== window.location.pathname + window.location.search) {
                router.replace(newUrl);
            }
        } catch (error) {
            console.warn('Failed to update layout URL:', error);
        }
    }, [layout, lang, router]);

    const satsFromUnitValue = (val: string): string | null => {
        if (!val) return null;
        const num = Number(val);
        if (!Number.isFinite(num)) return null;
        if (unit === "BTC") return String(Math.round(num * 1e8));
        return String(Math.round(num));
    };

    const resolveLatLng = () => {
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
        const savedRadius = savedRadiusKm;
        const effectiveRadius = Number.isFinite(radiusKm as any) ? radiusKm : (savedRadius ?? null);
        const { lat, lng } = resolveLatLng();
        if (lat && lng) { sp.set("lat", lat); sp.set("lng", lng); }
        if (effectiveRadius != null) sp.set('radiusKm', String(effectiveRadius));
        return sp;
    }, [inputQuery, selCategory, selAdType, minPrice, maxPrice, sortChoice, unit, country, region, city, centerLat, centerLng, layout, radiusKm]);

    const buildQuery = useCallback((offset: number) => {
        const sp = buildParams();
        sp.set("limit", String(CONFIG.PAGE_SIZE));
        sp.set("offset", String(offset));
        return `/api/listings?${sp.toString()}`;
    }, [buildParams]);

    // Filter mock data based on search parameters
    const filterMockData = useCallback(() => {
        let filtered = [...mockListings];

        // Filter by query
        if (inputQuery) {
            const queryLower = inputQuery.toLowerCase();
            filtered = filtered.filter(listing => 
                listing.title.toLowerCase().includes(queryLower) ||
                listing.description.toLowerCase().includes(queryLower) ||
                listing.category.toLowerCase().includes(queryLower)
            );
        }

        // Filter by category
        if (selCategory && selCategory !== "Featured") {
            filtered = filtered.filter(listing => listing.category === selCategory);
        }

        // Filter by ad type
        if (selAdType && selAdType !== "all") {
            filtered = filtered.filter(listing => listing.type === selAdType);
        }

        // Filter by price
        if (minPrice) {
            const minSats = satsFromUnitValue(minPrice);
            if (minSats) {
                filtered = filtered.filter(listing => listing.priceSats >= Number(minSats));
            }
        }

        if (maxPrice) {
            const maxSats = satsFromUnitValue(maxPrice);
            if (maxSats) {
                filtered = filtered.filter(listing => listing.priceSats <= Number(maxSats));
            }
        }

        // Sort
        const [sortBy, sortOrder] = sortChoice.split(':');
        filtered.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case 'date':
                    comparison = b.createdAt - a.createdAt;
                    break;
                case 'price':
                    comparison = a.priceSats - b.priceSats;
                    break;
                case 'rating':
                    comparison = (b.seller.rating || 0) - (a.seller.rating || 0);
                    break;
                case 'score':
                    comparison = (b.seller.score || 0) - (a.seller.score || 0);
                    break;
                default:
                    comparison = b.createdAt - a.createdAt;
            }

            return sortOrder === 'asc' ? -comparison : comparison;
        });

        return filtered;
    }, [inputQuery, selCategory, selAdType, minPrice, maxPrice, sortChoice]);

    // Initial load and when params change
    useEffect(() => {
        const load = async () => {
            try {
                isFetchingRef.current = true;
                setIsLoading(true);
                setInitialLoaded(false);

                // Use mock data for development
                const filteredData = filterMockData();
                const paginatedData = filteredData.slice(0, CONFIG.PAGE_SIZE);

                setListings(paginatedData);
                setTotal(filteredData.length);
                setHasMore(paginatedData.length < filteredData.length);
            } catch (error) {
                console.error('Failed to load listings:', error);
            } finally {
                isFetchingRef.current = false;
                setIsLoading(false);
                setInitialLoaded(true);
            }
        };

        load();
    }, [isDeployed, centerLat, centerLng, savedCenter, radiusKm, inputQuery, selCategory, selAdType, minPrice, maxPrice, sortChoice, filterMockData]);

    const loadMore = useCallback(async () => {
        if (isFetchingRef.current || !hasMore || isLoadingMore) return;

        try {
            isFetchingRef.current = true;
            setIsLoadingMore(true);

            if (isDeployed) {
                // Use real API for production/staging
                const response = await dataService.getListings({
                    limit: CONFIG.PAGE_SIZE,
                    offset: listings.length,
                    lat: Number(centerLat) || savedCenter?.lat,
                    lng: Number(centerLng) || savedCenter?.lng,
                    radiusKm: radiusKm,
                    query: inputQuery,
                    category: selCategory !== "Featured" ? selCategory : undefined,
                    adType: selAdType !== "all" ? selAdType : undefined,
                    minPrice: minPrice ? Number(minPrice) : undefined,
                    maxPrice: maxPrice ? Number(maxPrice) : undefined,
                    sortBy: sortChoice.split(':')[0],
                    sortOrder: sortChoice.split(':')[1] || 'desc'
                });

                setListings(prev => [...prev, ...response.listings]);
                setTotal(response.total);
                setHasMore(listings.length + response.listings.length < response.total);
            } else {
                // Use mock data for development
                const filteredData = filterMockData();
                const paginatedData = filteredData.slice(listings.length, listings.length + CONFIG.PAGE_SIZE);

                setListings(prev => [...prev, ...paginatedData]);
                setTotal(filteredData.length);
                setHasMore(listings.length + paginatedData.length < filteredData.length);
            }
        } catch (error) {
            console.error('Failed to load more listings:', error);
        } finally {
            isFetchingRef.current = false;
            setIsLoadingMore(false);
        }
    }, [isDeployed, centerLat, centerLng, savedCenter, radiusKm, inputQuery, selCategory, selAdType, minPrice, maxPrice, sortChoice, filterMockData, listings.length, hasMore, isLoadingMore]);

    // Remove IntersectionObserver - using Load More button instead

    const bg = dark ? "bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" : "bg-gradient-to-br from-neutral-50 via-white to-neutral-100";
    const [authed, setAuthed] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const user = await dataService.getCurrentUser();
                setAuthed(Boolean(user));
            } catch (error) {
                console.warn('Failed to load user:', error);
                setAuthed(false);
            }
        };

        loadUser();
    }, []);

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

    const showNoResults = initialLoaded && listings.length === 0 && !isLoading;

    const countries = useMemo(() => ["Canada", "United States", "United Kingdom", "Germany", "France", "Spain"], []);
    const regionsForCountry = useMemo(() => [] as Array<{ region: string; city: string }>, []);
    const regionsList = useMemo(() => Array.from(new Set(regionsForCountry.map(l => l.region))), [regionsForCountry]);
    const citiesList = useMemo(() => regionsForCountry.filter(l => l.region === region).map(l => l.city), [regionsForCountry, region]);

    function getSavedPlaceName(): string | null {
        return savedCenter?.name || null;
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
        <ErrorBoundary>
            <div className={cn("min-h-screen", bg, dark ? "dark" : "")}>
                {/* Global header via layout */}

                <div className="mx-auto max-w-7xl px-4 py-8">
                    {/* Top actions */}
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
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setSortChoice(v);
                                    const sp = buildParams(v);
                                    router.push(`/${lang}/search?${sp.toString()}`);
                                }}
                                className={cn("w-full max-w-xs rounded-3xl px-6 pr-10 py-5 text-lg appearance-none bg-no-repeat bg-right", inputBase)}
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em' }}
                            >
                                <option value="date:desc">{t('newest', lang)}</option>
                                <option value="date:asc">{t('oldest', lang)}</option>
                                <option value="price:desc">{t('highest_price', lang)}</option>
                                <option value="price:asc">{t('lowest_price', lang)}</option>
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
                                        <button onClick={() => setModal('showLocationModal', true)} className="rounded-xl px-3 py-1 text-xs text-white bg-gradient-to-r from-orange-500 to-red-500">{t('change', lang)}</button>
                                    </div>
                                </div>
                                {radiusKm === 0 ? (
                                    <div className={cn("mt-3", dark ? "text-neutral-200" : "text-neutral-800")}>{t('all_listings_globally', lang)}</div>
                                ) : (
                                    <>
                                        <div className={cn("mt-3 text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>
                                            {t('within_km_of', lang).replace('{n}', String(radiusKm))}
                                        </div>
                                        <div className={cn("mt-1", dark ? "text-neutral-200" : "text-neutral-800")} title={getSavedPlaceName() || undefined}>
                                            {getSavedPlaceName() || t('set_location', lang)}
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
                                        <ListingCard key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setModal('active', l)} />
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
                                        <ListingRow key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => setModal('active', l)} />
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

                            {/* Load More Button */}
                            {hasMore && (
                                <div className="flex justify-center mt-8">
                                    <button
                                        onClick={loadMore}
                                        disabled={isLoadingMore}
                                        className={cn(
                                            "inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl",
                                            isLoadingMore
                                                ? "bg-neutral-400 text-white cursor-not-allowed"
                                                : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                                        )}
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {t('loading_more', lang)}
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                </svg>
                                                Show more ({listings.length} of {total})
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                            
                            {!hasMore && listings.length > 0 && (
                                <div className="py-8 text-center text-sm opacity-70">
                                    {t('no_more_results', lang)}
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                {active && (
                    <ListingModal listing={active} open={!!active} onClose={() => setModal('active', null)} unit={unit} btcCad={btcCad} dark={dark} onChat={() => {
                        if (!user) {
                            setModal('showAuth', true);
                        } else {
                            setModal('chatFor', active);
                        }
                    }} />
                )}
                {showLocationModal && (
                    <LocationModal
                        open={showLocationModal}
                        onClose={() => setModal('showLocationModal', false)}
                        initialCenter={{ 
                            lat: Number(centerLat || savedCenter?.lat || 43.6532), 
                            lng: Number(centerLng || savedCenter?.lng || -79.3832), 
                            name: savedCenter?.name || '' 
                        }}
                        initialRadiusKm={radiusKm}
                        dark={dark}
                        onApply={async (place, r) => {
                            console.log('SearchClient: Location modal applied:', { place, radius: r });
                            setCenterLat(String(place.lat));
                            setCenterLng(String(place.lng));
                            setRadiusKm(r);
                            
                            // Save to unified location context
                            updateLocation(place, r);
                            
                            // Update URL with new location parameters
                            const sp = buildParams();
                            sp.set('lat', String(place.lat));
                            sp.set('lng', String(place.lng));
                            sp.set('radiusKm', String(r));
                            router.push(`/${lang}/search?${sp.toString()}`);
                            setModal('showLocationModal', false);
                        }}
                    />
                )}
            </div>
        </ErrorBoundary>
    );
}


