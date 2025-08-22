import { useState, useMemo } from 'react';
import type { Listing, Category, AdType } from '@/lib/types';

export function useSearchFilters(listings: Listing[]) {
    const [query, setQuery] = useState("");
    const [cat, setCat] = useState<Category>("Featured");
    const [adType, setAdType] = useState<AdType>("all");

    // Filtered listings
    const filteredBase = useMemo(() => {
        let xs = listings;
        if (query) {
            xs = xs.filter((l: Listing) =>
                l.title.toLowerCase().includes(query.toLowerCase()) ||
                l.description.toLowerCase().includes(query.toLowerCase()) ||
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

    const featured = useMemo(() => {
        return listings.filter(l => l.category !== "Services").slice(0, 12);
    }, [listings]);

    return {
        query,
        setQuery,
        cat,
        setCat,
        adType,
        setAdType,
        goods,
        services,
        featured,
    };
}
