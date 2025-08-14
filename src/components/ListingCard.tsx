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

interface ListingCardProps {
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

export function ListingCard({ listing, unit, btcCad, dark, onOpen }: ListingCardProps) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const a = accent(listing);
  
  return (
    <article
      onClick={onOpen}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl",
        dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-300 bg-white"
      )}
    >
      <div className={cn("h-1 w-full bg-gradient-to-r", a.stripe)} />
      {boosted && (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-neutral-950 shadow">
          BOOSTED
        </div>
      )}
      <div className="aspect-[4/3] overflow-hidden">
        <img src={listing.images?.[0]} alt={listing.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="line-clamp-1 text-lg font-bold">{listing.title}</h3>
          <div className="flex items-center gap-2">
            <TypePill type={listing.type} />
            <span className={cn("rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold text-white", a.chip)}>
              {listing.category === "Services" ? "Service" : listing.category}
            </span>
          </div>
        </div>
        <p className={cn("line-clamp-2 text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>{listing.desc}</p>
        <div className="flex items-center justify-between">
          <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} />
          <div className="text-xs opacity-80">📍 {listing.location}</div>
        </div>
        <div className="flex items-center justify-between text-xs opacity-80">
          <span>👤 {listing.seller.name}</span>
          <span>
            {stars(listing.seller.rating)} • {listing.seller.deals} deals
          </span>
        </div>
      </div>
    </article>
  );
}
