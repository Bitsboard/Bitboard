"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-client";
import type { Place } from "@/lib/types";

interface HeroSectionProps {
    center: Place;
    radiusKm: number;
    query: string;
    setQuery: (query: string) => void;
    onLocationClick: () => void;
    onSearch: () => void;
    dark: boolean;
}

export function HeroSection({
    center,
    radiusKm,
    query,
    setQuery,
    onLocationClick,
    onSearch,
    dark,
}: HeroSectionProps) {
    const lang = useLang();
    const inputBase = dark
        ? "border border-white/30 bg-neutral-800/50 text-neutral-100 placeholder-neutral-400 backdrop-blur-sm"
        : "border border-neutral-700/30 bg-white/80 text-neutral-900 placeholder-neutral-500 backdrop-blur-sm";

    return (
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

            {/* Orange angled stripe across the header */}
            <div className="absolute inset-0">
                <div className="absolute top-0 right-20 w-[500px] h-full bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 opacity-50" style={{clipPath: 'polygon(30% 0%, 100% 0%, 70% 100%, 0% 100%)'}}></div>
            </div>

            {/* Floating product images in organized orbiting formation */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Chair - orbiting item */}
                <div className="absolute animate-orbit-item" style={{animationDelay: '0s'}}>
                    <img src="/Chair.png" alt="Chair" className="w-20 h-20 object-contain drop-shadow-lg transition-transform duration-300" />
                </div>
                
                {/* Phone - orbiting item */}
                <div className="absolute animate-orbit-item" style={{animationDelay: '1.1s'}}>
                    <img src="/Phone.png" alt="Phone" className="w-20 h-20 object-contain drop-shadow-lg transition-transform duration-300" />
                </div>
                
                {/* Shoe - orbiting item */}
                <div className="absolute animate-orbit-item" style={{animationDelay: '2.2s'}}>
                    <img src="/Shoe.png" alt="Shoe" className="w-20 h-20 object-contain drop-shadow-lg transition-transform duration-300" />
                </div>
                
                {/* Watch - orbiting item */}
                <div className="absolute animate-orbit-item" style={{animationDelay: '3.3s'}}>
                    <img src="/Watch.png" alt="Watch" className="w-20 h-20 object-contain drop-shadow-lg transition-transform duration-300" />
                </div>

                {/* Backpack - orbiting item */}
                <div className="absolute animate-orbit-item" style={{animationDelay: '4.4s'}}>
                    <img src="/Backpack.png" alt="Backpack" className="w-20 h-20 object-contain drop-shadow-lg transition-transform duration-300" />
                </div>

                {/* Bike - orbiting item */}
                <div className="absolute animate-orbit-item" style={{animationDelay: '5.5s'}}>
                    <img src="/Bike.png" alt="Bike" className="w-20 h-20 object-contain drop-shadow-lg transition-transform duration-300" />
                </div>

                {/* Drill - orbiting item */}
                <div className="absolute animate-orbit-item" style={{animationDelay: '6.6s'}}>
                    <img src="/Drill.png" alt="Drill" className="w-20 h-20 object-contain drop-shadow-lg transition-transform duration-300" />
                </div>

                {/* Guitar - orbiting item */}
                <div className="absolute animate-orbit-item" style={{animationDelay: '7.7s'}}>
                    <img src="/Guitar.png" alt="Guitar" className="w-20 h-20 object-contain drop-shadow-lg transition-transform duration-300" />
                </div>

                {/* Lamp - orbiting item */}
                <div className="absolute animate-orbit-item" style={{animationDelay: '8.8s'}}>
                    <img src="/Lamp.png" alt="Lamp" className="w-20 h-20 object-contain drop-shadow-lg transition-transform duration-300" />
                </div>

                {/* Plant - orbiting item */}
                <div className="absolute animate-orbit-item" style={{animationDelay: '9.9s'}}>
                    <img src="/Plant.png" alt="Plant" className="w-20 h-20 object-contain drop-shadow-lg transition-transform duration-300" />
                </div>

                {/* Shirt - orbiting item */}
                <div className="absolute animate-orbit-item" style={{animationDelay: '11s'}}>
                    <img src="/Shirt.png" alt="Shirt" className="w-20 h-20 object-contain drop-shadow-lg transition-transform duration-300" />
                </div>
            </div>

            <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-10">
                <div className="flex flex-col-reverse items-start gap-3 md:flex-row md:items-center md:justify-between">
                    {/* Left Content */}
                    <div className="max-w-2xl">
                        <h1 className="text-5xl font-black tracking-tight sm:text-7xl" style={{ fontFamily: 'Ubuntu, system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
                            <span className={cn(lang === 'en' ? 'block' : 'inline', "leading-tight", dark ? "text-white" : "text-black")}>{t('title_hero_1', lang)}{lang !== 'en' ? ' ' : ''}</span>
                            <span className={cn(lang === 'en' ? 'block' : 'inline', "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent")} style={{ lineHeight: '1.2' }}>
                                {t('title_hero_2', lang)}
                            </span>
                        </h1>
                        <p className={cn("mt-6 text-xl leading-relaxed", dark ? "text-neutral-300" : "text-neutral-600")}>
                            {t('subheading', lang)}
                        </p>
                    </div>

                    {/* Right: Location above search */}
                    <div className="w-full md:w-[460px] md:self-center relative">
                        <div className="mb-2 md:mb-1 flex md:justify-end relative z-10">
                            <button onClick={onLocationClick} className={cn("w-full md:w-[calc(100%-120px)] rounded-3xl px-6 py-5 text-left focus:outline-none", inputBase)}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className={cn("truncate", dark ? "text-neutral-100" : "text-neutral-900")}>
                                        {radiusKm === 0 ? "Worldwide" : (center?.name || t('choose_location', lang))}
                                    </div>
                                    <div className={cn("text-sm whitespace-nowrap shrink-0", dark ? "text-neutral-300" : "text-neutral-700")}>
                                        {radiusKm === 0 ? t('change', lang) : `${radiusKm} km`}
                                    </div>
                                </div>
                            </button>
                        </div>
                        <div className="relative mt-2 z-10">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
                                placeholder={t('search_placeholder', lang)}
                                className={cn("w-full rounded-3xl px-6 pr-32 py-5 text-lg focus:outline-none transition-all duration-300", inputBase)}
                            />
                            <button onClick={onSearch} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2 text-sm font-semibold text-white shadow">{t('search', lang)}</button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
