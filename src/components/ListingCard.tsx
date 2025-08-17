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
        "group relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-300",
        dark
          ? "border border-neutral-800 bg-neutral-950 hover:border-orange-400/40 hover:shadow-[0_10px_30px_-12px_rgba(255,140,0,0.25)]"
          : "border border-neutral-200 bg-white hover:border-orange-400/50 hover:shadow-[0_10px_30px_-12px_rgba(255,140,0,0.35)]"
      )}
    >
      <div className={cn("h-1 w-full bg-gradient-to-r rounded-t-2xl", a.stripe)} />
      <div className="relative">
        <Carousel images={listing.images} alt={listing.title} dark={dark} className="aspect-[4/3]" />
        {/* No overlay badges to keep heights stable */}
      </div>
      <div className="p-4">
        {/* Title block with type label before title */}
        <div className="min-h-[56px]">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold text-white", a.chip)}>
              {listing.type === 'want' ? 'Looking For' : 'Selling'}
            </span>
            <h3 className={cn("line-clamp-2 text-lg font-semibold leading-snug", dark ? "text-white" : "text-neutral-900")}>{sanitizeTitle(listing.title, listing.type)}</h3>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="shrink-0"><PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} /></div>
          <span className={cn("max-w-[50%] overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-2 py-0.5 text-[10px]", dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>📍 {listing.location}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={cn(dark ? "text-neutral-400" : "text-neutral-600")}>@{listing.seller.name}</span>
          <span className={cn(dark ? "text-neutral-400" : "text-neutral-600")}>{stars(listing.seller.rating)} · +{listing.seller.score}</span>
        </div>
      </div>
    </article>
  );
}
