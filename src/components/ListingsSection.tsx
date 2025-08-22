"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-client";
import { ListingCard, ListingRow } from "@/components";
import { ItemsCarousel } from "@/components/ItemsCarousel";
import type { Listing, Unit, Layout } from "@/lib/types";

interface ListingsSectionProps {
    featured: Listing[];
    goods: Listing[];
    services: Listing[];
    layout: Layout;
    unit: Unit;
    btcCad: number | null;
    dark: boolean;
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    onOpen: (listing: Listing) => void;
    onLoadMore: () => void;
}

export function ListingsSection({
    featured,
    goods,
    services,
    layout,
    unit,
    btcCad,
    dark,
    isLoading,
    isLoadingMore,
    hasMore,
    onOpen,
    onLoadMore,
}: ListingsSectionProps) {
    const lang = useLang();
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    // IntersectionObserver to trigger loadMore when sentinel is visible
    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el) return;

        const obs = new IntersectionObserver((entries) => {
            for (const e of entries) {
                if (e.isIntersecting) {
                    onLoadMore();
                    break;
                }
            }
        }, { rootMargin: "1000px 0px" });

        obs.observe(el);
        return () => obs.disconnect();
    }, [onLoadMore]);

    return (
        <main id="browse" className="mx-auto max-w-7xl px-4 pb-24">
            {/* Featured Row */}
            {featured.length > 0 && (
                <section className="mt-6">
                    <div className="mb-6 flex items-baseline justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className={cn("text-3xl font-bold", dark ? "text-white" : "text-neutral-900")} style={{ fontFamily: 'Ubuntu, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>{t('featured', lang)}</h2>
                        </div>
                    </div>
                    <ItemsCarousel listings={featured} unit={unit} btcCad={btcCad} dark={dark} onOpen={onOpen} />
                </section>
            )}

            {/* Goods Section */}
            <section className="mt-16">
                <div className="mb-6 flex items-baseline justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className={cn("text-3xl font-bold flex items-center gap-3", dark ? "text-white" : "text-neutral-900")} style={{ fontFamily: 'Ubuntu, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>{t('latest', lang)}</h2>
                        <span className={cn("text-sm font-medium", dark ? "text-neutral-400" : "text-neutral-500")}>
                            {goods.length} {t('results', lang)}
                        </span>
                    </div>
                </div>

                {layout === "grid" ? (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {goods.map((l) => (
                            <ListingCard key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => onOpen(l)} />
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
                            <ListingRow key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => onOpen(l)} />
                        ))}
                        {goods.length === 0 && !isLoading && (
                            <div className={cn("rounded-3xl p-16 text-center border-2 border-dashed", dark ? "border-neutral-700 text-neutral-400" : "border-neutral-300 text-neutral-500")}>
                                <div className="text-4xl mb-4">🔍</div>
                                <p className={cn("text-lg font-medium", dark ? "text-neutral-300" : "text-neutral-700")}>{t('no_goods_match', lang)}</p>
                                <p className={cn("text-sm mt-2", dark ? "text-neutral-400" : "text-neutral-600")}>{t('try_widen_radius', lang)}</p>
                            </div>
                        )}
                        <div ref={loadMoreRef} className="pt-4">
                            <div className={cn("text-center text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
                                {isLoadingMore ? t('loading_more', lang) : (hasMore ? "" : t('no_more_results', lang))}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
