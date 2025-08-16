"use client";

import React, { useMemo, useRef } from "react";
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

  const scrollByAmount = (dx: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: dx, behavior: "smooth" });
  };

  return (
    <div className="relative">
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
          "absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 backdrop-blur-sm",
          dark ? "bg-neutral-900/60 text-neutral-200 hover:bg-neutral-900/80" : "bg-white/70 text-neutral-800 hover:bg-white"
        )}
        aria-label="Previous"
        onClick={() => scrollByAmount(-400)}
      >
        ‹
      </button>
      <button
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 backdrop-blur-sm",
          dark ? "bg-neutral-900/60 text-neutral-200 hover:bg-neutral-900/80" : "bg-white/70 text-neutral-800 hover:bg-white"
        )}
        aria-label="Next"
        onClick={() => scrollByAmount(400)}
      >
        ›
      </button>
    </div>
  );
}


