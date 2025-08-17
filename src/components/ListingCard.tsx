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
  return {
    stripe: "from-orange-500 to-red-500",
    chip: "from-orange-500 to-red-500",
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
      <div className="relative">
        <Carousel images={listing.images} alt={listing.title} dark={dark} className="aspect-[4/3]" />
        <div className="absolute left-2 top-2 z-10 flex items-center gap-2">
          <span className={cn("rounded-full bg-gradient-to-r px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow", a.chip)}>
            {listing.type === 'want' ? 'Looking For' : 'Selling'}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className={cn("line-clamp-2 text-base sm:text-lg font-semibold leading-snug", dark ? "text-white" : "text-neutral-900")}>{listing.title}</h3>
          <div className="shrink-0"><PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} /></div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className={cn(dark ? "text-neutral-400" : "text-neutral-600")}>📍 {listing.location}</span>
          <span className={cn("rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap", a.chip)}>
            {listing.category}
          </span>
        </div>
      </div>
    </article>
  );
}
