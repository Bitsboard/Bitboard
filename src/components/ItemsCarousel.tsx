"use client";

import React, { useMemo } from "react";
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
    const items = useMemo(() => listings ?? [], [listings]);
    return (
        <div className={cn("grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}> 
            {items.map((l) => (
                <ListingCard key={l.id} listing={l} unit={unit} btcCad={btcCad} dark={dark} onOpen={() => onOpen(l)} />
            ))}
        </div>
    );
}


