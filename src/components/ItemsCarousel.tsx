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

    return (
        <div className="relative" onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}>
            <div
                ref={containerRef}
                className={cn(
                    "no-scrollbar flex gap-4 overflow-x-auto scroll-px-4 snap-x snap-mandatory",
                    dark ? "[&::-webkit-scrollbar]:hidden" : "[&::-webkit-scrollbar]:hidden"
                )}
            >
                {items.map((l) => (
                    <div key={l.id} className="snap-center shrink-0 grow-0 basis-[260px] sm:basis-[280px] md:basis-[300px]">
                        <ListingCard listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => onOpen(l)} />
                    </div>
                ))}
            </div>

            <button
                className={cn(
                    "absolute -left-6 top-1/2 -translate-y-1/2 rounded-full p-3 shadow-lg",
                    dark ? "bg-neutral-950 text-white hover:bg-neutral-900" : "bg-white text-neutral-900 hover:bg-neutral-100"
                )}
                aria-label="Previous"
                onClick={() => scrollByAmount(-400)}
            >
                ‹
            </button>
            <button
                className={cn(
                    "absolute -right-6 top-1/2 -translate-y-1/2 rounded-full p-3 shadow-lg",
                    dark ? "bg-neutral-950 text-white hover:bg-neutral-900" : "bg-white text-neutral-900 hover:bg-neutral-100"
                )}
                aria-label="Next"
                onClick={() => scrollByAmount(400)}
            >
                ›
            </button>
        </div>
    );
}


