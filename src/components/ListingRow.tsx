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
      <div className="col-span-6 flex flex-col justify-between">
        <div>
          <h3 className={cn("line-clamp-2 text-lg font-bold", dark ? "text-white" : "text-neutral-900")}>{listing.title}</h3>
          <div className="flex items-center justify-between gap-3 mt-1">
            <div className="shrink-0"><PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} /></div>
            <span className={cn("text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>📍 {listing.location}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold text-white", a.chip)}>{listing.category}</span>
            <TypePill type={listing.type} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className={cn("text-xs", dark ? "text-neutral-400" : "text-neutral-500")}>Seller {listing.seller.name}</div>
          <div className={cn("text-sm", dark ? "text-neutral-400" : "text-neutral-500")}>{stars(listing.seller.rating)}</div>
        </div>
      </div>

      {/* Spacer to balance grid */}
      <div className="col-span-3" />
    </article>
  );
}
