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

export function ListingCard({ listing, unit, btcCad, dark, onOpen }: ListingCardProps) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const a = accent(listing);

  return (
    <article
      onClick={onOpen}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
        dark ? "border border-neutral-800 bg-neutral-950 hover:border-orange-500/50" : "border border-neutral-300 bg-white hover:border-orange-500/50",
        boosted ? "boosted-ring" : ""
      )}
    >
      <div className={cn("h-1 w-full bg-gradient-to-r rounded-t-2xl", a.stripe)} />
      {boosted && (
        <div className="absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-bold text-white shadow animate-rotate-gradient">
          BOOSTED
        </div>
      )}

      <div className="aspect-[4/3] overflow-hidden relative">
        <img src={listing.images?.[0]} alt={listing.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <TypePill type={listing.type} />
          <span className={cn("rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap shadow-lg", a.chip)}>
            {listing.category === "Services" ? "Service" : listing.category}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4 sm:p-3">
        <div>
          <h3 className={cn("text-base sm:text-lg font-bold leading-tight min-h-[2.5rem] sm:min-h-[3rem] flex items-center", dark ? "text-white" : "text-neutral-900")}>{listing.title}</h3>
        </div>
        <p className={cn("line-clamp-2 text-sm leading-relaxed", dark ? "text-neutral-400" : "text-neutral-600")}>{listing.desc}</p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} />
          <div className={cn("text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>📍 {listing.location}</div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-neutral-300 flex items-center justify-center">
                <svg className="w-3 h-3 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className={dark ? "text-neutral-400" : "text-neutral-600"}>{listing.seller.name}</span>
            </div>
            {listing.seller.verifications.email && listing.seller.verifications.phone && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-xs font-bold verified-badge" title="Verified Identity">✓</span>
            )}
          </div>
          <span className={dark ? "text-neutral-400" : "text-neutral-600"}>
            +{listing.seller.score}👍 Reputation
          </span>
        </div>
      </div>
    </article>
  );
}
