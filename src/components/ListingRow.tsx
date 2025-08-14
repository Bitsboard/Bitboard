"use client";

import React from "react";
import { PriceBlock } from "./PriceBlock";
import { TypePill } from "./TypePill";

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
  boostedUntil: number;
  seller: Seller;
  createdAt: number;
};

interface ListingRowProps {
  listing: Listing;
  unit: Unit;
  btcCad: number;
  dark: boolean;
  onOpen: () => void;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function stars(rating: number) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return "★".repeat(full) + (half ? "½" : "");
}

function accent(listing: Listing) {
  const isService = listing.category === "Services";
  return {
    stripe: isService ? "from-fuchsia-500 to-violet-500" : "from-sky-500 to-cyan-500",
    chip: isService ? "from-fuchsia-500 to-violet-500" : "from-sky-500 to-cyan-500",
  };
}

export function ListingRow({ listing, unit, btcCad, dark, onOpen }: ListingRowProps) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const a = accent(listing);
  
  return (
    <article
      onClick={onOpen}
      className={cn(
        "group relative grid grid-cols-8 gap-3 overflow-hidden rounded-2xl p-2",
        dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-300 bg-white"
      )}
    >
      <div className={cn("absolute left-0 top-0 h-full w-1 bg-gradient-to-b", a.stripe)} />
      {boosted && (
        <div className="absolute right-3 top-2 z-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-neutral-950">
          BOOSTED
        </div>
      )}
      <div className="col-span-2 aspect-[3/2] overflow-hidden rounded-lg">
        <img src={listing.images?.[0]} alt={listing.title} className="h-full w-full object-cover" />
      </div>
      <div className="col-span-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">{listing.title}</h3>
            <TypePill type={listing.type} />
            <span className={cn("rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold text-white", a.chip)}>
              {listing.category === "Services" ? "Service" : listing.category}
            </span>
          </div>
          <p className={cn("mt-0.5 line-clamp-1 text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>{listing.desc}</p>
          <div className="mt-1 text-[11px] opacity-80">📍 {listing.location}</div>
        </div>
        <div className="text-right">
          <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} />
          <div className="mt-1 text-[11px] opacity-80">
            {stars(listing.seller.rating)} • {listing.seller.deals}
          </div>
        </div>
      </div>
    </article>
  );
}
