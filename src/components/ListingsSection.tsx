"use client";

import React from "react";
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
                    <ItemsCarousel listings={featured} unit={unit} btcCad={btcCad} dark={dark} layout={layout} onOpen={onOpen} />
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
                    <>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
                        
                        {/* Load More Button for Grid View */}
                        {hasMore && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={onLoadMore}
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
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('loading_more', lang)}
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                            Show more
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                        
                        {!hasMore && goods.length > 0 && (
                            <div className="pt-8">
                                <div className={cn("text-center text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
                                    {t('no_more_results', lang)}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
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
                        </div>
                        
                        {/* Load More Button for List View */}
                        {hasMore && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={onLoadMore}
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
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('loading_more', lang)}
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                            Show more
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                        
                        {!hasMore && goods.length > 0 && (
                            <div className="pt-8">
                                <div className={cn("text-center text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
                                    {t('no_more_results', lang)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}