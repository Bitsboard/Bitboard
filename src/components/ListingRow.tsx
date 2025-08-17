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

interface ListingRowProps {
  listing: Listing;
  unit: Unit;
  btcCad: number | null;
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
  if (listing.type === "sell") {
    return { stripe: "from-emerald-500 to-teal-500", chip: "from-emerald-500 to-teal-500" };
  }
  return { stripe: "from-fuchsia-500 to-violet-500", chip: "from-fuchsia-500 to-violet-500" };
}

export function ListingRow({ listing, unit, btcCad, dark, onOpen }: ListingRowProps) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const a = accent(listing);
  function stars(rating: number) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return "★".repeat(full) + (half ? "½" : "");
  }
  function sanitizeTitle(raw: string, type: "sell" | "want"): string {
    if (type !== "want") return raw;
    const cleaned = raw.replace(/^\s*(looking\s*for\s*:?-?\s*)/i, "");
    return cleaned.trim();
  }

  return (
    <article
      onClick={onOpen}
      className={cn(
        "group relative grid grid-cols-12 gap-4 overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer",
        dark ? "border border-neutral-800 bg-neutral-950 hover:border-orange-500/50" : "border border-neutral-300 bg-white hover:border-orange-500/50"
      )}
    >
      <div className={cn("absolute left-0 top-0 h-full w-1 bg-gradient-to-b", a.stripe)} />
      {boosted && (
        <div className="absolute right-4 top-3 z-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-neutral-950 shadow-lg">
          BOOSTED
        </div>
      )}

      {/* Images */}
      <div className="col-span-3">
        <Carousel images={listing.images} alt={listing.title} dark={dark} className="aspect-[4/3]" />
      </div>

      {/* Content */}
      <div className="col-span-9 flex flex-col">
        {/* Tag row */}
        <div className="flex items-center justify-between mb-1">
          <span className={cn("rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold text-white", a.chip)}>{listing.type === 'want' ? 'Looking For' : 'Selling'}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px]", dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>📍 {listing.location}</span>
        </div>
        {/* Title */}
        <h3 className={cn("line-clamp-2 text-lg font-bold", dark ? "text-white" : "text-neutral-900")}>{sanitizeTitle(listing.title, listing.type)}</h3>
        {/* Bottom meta */}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="shrink-0">
            <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} />
          </div>
          <div className="text-right text-xs">
            <div className={cn(dark ? "text-neutral-300" : "text-neutral-700")}>@{listing.seller.name}</div>
            <div className={cn(dark ? "text-neutral-400" : "text-neutral-600")}>+{listing.seller.score} 👍 reputation</div>
          </div>
        </div>
      </div>
    </article>
  );
}
