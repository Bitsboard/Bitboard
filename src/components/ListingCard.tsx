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
  if (listing.type === "sell") {
    return { stripe: "from-emerald-500 to-teal-500", chip: "from-emerald-500 to-teal-500" };
  }
  return { stripe: "from-fuchsia-500 to-violet-500", chip: "from-fuchsia-500 to-violet-500" };
}

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

export function ListingCard({ listing, unit, btcCad, dark, onOpen }: ListingCardProps) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const a = accent(listing);

  return (
    <article
      onClick={onOpen}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]",
        dark
          ? "border border-neutral-800 bg-neutral-950 hover:border-orange-400/60"
          : "border border-neutral-200 bg-white hover:border-orange-400/60"
      )}
    >
      <div className="relative">
        <Carousel images={listing.images} alt={listing.title} dark={dark} className="aspect-square" rounded="rounded-t-2xl" />
        <div className={cn("pointer-events-none absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r", a.stripe)} />
        {/* tags under image, not overlay */}
      </div>
      <div className="p-4 pt-6">
        {/* Row of tags under image */}
        <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
          <span className={cn("flex-shrink-0 rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-semibold text-white", a.chip)}>
            {listing.type === 'want' ? 'Looking For' : 'Selling'}
          </span>
          <span className={cn("max-w-[65%] truncate rounded-full px-3 py-1 text-[11px]", dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>📍 {listing.location}</span>
        </div>
        {/* Two-line title */}
        <div className="min-h-[3.5rem]">
          <h3 className={cn("line-clamp-2 text-xl font-semibold leading-snug", dark ? "text-white" : "text-neutral-900")}>{sanitizeTitle(listing.title, listing.type)}</h3>
        </div>
        {/* Bottom meta: left price (sats + fiat), right seller + rep */}
        <div className="mt-3 flex items-end justify-between">
          <div className="shrink-0"><PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} size="lg" /></div>
          <div className="text-right text-sm">
            <div className={cn("inline-flex items-center gap-1", dark ? "text-neutral-300" : "text-neutral-700")}> 
              {listing.seller.score >= 50 && (
                <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-gradient-to-r from-sky-400 to-blue-600 shadow-[0_0_8px_rgba(56,189,248,0.8)]" aria-label="Verified" />
              )}
              <span>@{listing.seller.name}</span>
            </div>
            <div className={cn(dark ? "text-neutral-400" : "text-neutral-600")}>+{listing.seller.score} 👍</div>
          </div>
        </div>
      </div>
    </article>
  );
}
