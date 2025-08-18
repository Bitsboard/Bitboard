"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import type { Listing, Unit } from "@/lib/types";
import { ListingCard } from "./ListingCard";

function cn(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

interface ItemsCarouselProps {
    listings: Listing[];
    unit: Unit;
    btcCad: number | null;
    dark: boolean;
    onOpen: (l: Listing) => void;
}

export function ItemsCarousel({ listings, unit, btcCad, dark, onOpen }: ItemsCarouselProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const items = useMemo(() => listings ?? [], [listings]);
    const [isHover, setIsHover] = useState(false);

    const scrollByAmount = (dx: number) => {
        const el = containerRef.current;
        if (!el) return;
        el.scrollBy({ left: dx, behavior: "smooth" });
    };

    useEffect(() => {
        const id = setInterval(() => {
            if (isHover) return;
            scrollByAmount(400);
        }, 10000);
        return () => clearInterval(id);
    }, [isHover]);

    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const updateEnds = () => {
        const el = containerRef.current;
        if (!el) return;
        setAtStart(el.scrollLeft <= 0);
        setAtEnd(Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth);
    };

    useEffect(() => {
        updateEnds();
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener('scroll', updateEnds, { passive: true });
        return () => el.removeEventListener('scroll', updateEnds as any);
    }, []);

    return (
        <div className="relative" onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}>
            <div
                ref={containerRef}
                className={cn(
                    "no-scrollbar flex gap-4 overflow-x-auto overflow-y-visible scroll-px-4 snap-x snap-mandatory py-4",
                    dark ? "[&::-webkit-scrollbar]:hidden" : "[&::-webkit-scrollbar]:hidden"
                )}
            >
                {items.map((l) => (
                    <div key={l.id} className="snap-center shrink-0 grow-0 basis-[260px] sm:basis-[280px] md:basis-[300px]" style={{ willChange: "transform" }}>
                        <ListingCard listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => onOpen(l)} />
                    </div>
                ))}
            </div>

            <button
                className={cn(
                    "absolute -left-8 top-1/2 -translate-y-1/2 rounded-xl px-4 py-3 text-base font-semibold transition bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl hover:from-orange-400 hover:to-red-400",
                    atStart && "opacity-0 pointer-events-none"
                )}
                aria-label="Previous"
                onClick={() => scrollByAmount(-400)}
            >
                <span className="font-extrabold">←</span>
            </button>
            <button
                className={cn(
                    "absolute -right-8 top-1/2 -translate-y-1/2 rounded-xl px-4 py-3 text-base font-semibold transition bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl hover:from-orange-400 hover:to-red-400",
                    atEnd && "opacity-0 pointer-events-none"
                )}
                aria-label="Next"
                onClick={() => scrollByAmount(400)}
            >
                <span className="font-extrabold">→</span>
            </button>
        </div>
    );
}


