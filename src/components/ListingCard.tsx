"use client";

import React from "react";
import { PriceBlock } from "./PriceBlock";
import { TypePill } from "./TypePill";
import { Carousel } from "./Carousel";

type Category =
  | "Featured"
  | "Electronics"
  | "Mining Gear"
  | "Home & Garden"
  | "Sports & Bikes"
  | "Tools"
  | "Games & Hobbies"
  | "Furniture"
  | "Services";

type Unit = "sats" | "BTC";

type Seller = {
  name: string;
  score: number;
  deals: number;
  rating: number;
  verifications: { email?: boolean; phone?: boolean; lnurl?: boolean };
  onTimeRelease: number;
};

type Listing = {
  id: string;
  title: string;
  desc: string;
  priceSats: number;
  category: Category | Exclude<string, never>;
  location: string;
  lat: number;
  lng: number;
  type: "sell" | "want";
  images: string[];
  boostedUntil: number | null;
  seller: Seller;
  createdAt: number;
};

interface ListingCardProps {
  listing: Listing;
  unit: Unit;
  btcCad: number | null;
  dark: boolean;
  onOpen: () => void;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function accent(listing: Listing) {
  const isService = listing.category === "Services";
  return {
    stripe: isService ? "from-fuchsia-500 to-violet-500" : "from-sky-500 to-cyan-500",
    chip: isService ? "from-fuchsia-500 to-violet-500" : "from-sky-500 to-cyan-500",
  };
}

export function ListingCard({ listing, unit, btcCad, dark, onOpen }: ListingCardProps) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const a = accent(listing);

  return (
    <article
      onClick={onOpen}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-300",
        dark
          ? "border border-neutral-800 bg-neutral-950 hover:border-orange-400/40 hover:shadow-[0_10px_30px_-12px_rgba(255,140,0,0.25)]"
          : "border border-neutral-200 bg-white hover:border-orange-400/50 hover:shadow-[0_10px_30px_-12px_rgba(255,140,0,0.35)]"
      )}
    >
      <div className={cn("h-1 w-full bg-gradient-to-r rounded-t-2xl", a.stripe)} />
      {boosted && (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-neutral-950 shadow-lg">
          BOOSTED
        </div>
      )}

      <div className="relative">
        <Carousel images={listing.images} alt={listing.title} dark={dark} className="aspect-[4/3]" />
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-2">
          <TypePill type={listing.type} />
          <span className={cn("rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap shadow-lg", a.chip)}>
            {listing.category === "Services" ? "Service" : listing.category}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <h3 className={cn("line-clamp-2 text-base sm:text-lg font-semibold leading-snug", dark ? "text-white" : "text-neutral-900")}>{listing.title}</h3>
        <p className={cn("line-clamp-2 text-sm leading-relaxed", dark ? "text-neutral-400" : "text-neutral-600")}>{listing.desc}</p>
        <div className="flex items-center justify-between gap-2">
          <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} />
          <div className={cn("text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>📍 {listing.location}</div>
        </div>
      </div>
    </article>
  );
}
