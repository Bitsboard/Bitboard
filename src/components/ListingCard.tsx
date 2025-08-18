"use client";

import React from "react";
import { PriceBlock } from "./PriceBlock";
import { t, useLang } from "@/lib/i18n";
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
        "group relative cursor-pointer overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.02] hover:ring-2 hover:ring-orange-500/80",
        dark
          ? "border border-neutral-800 bg-neutral-950 hover:border-orange-400/60"
          : "border border-neutral-200 bg-white hover:border-orange-400/60"
      )}
    >
      <div className="relative">
        <Carousel images={listing.images?.[0] ? [listing.images[0]] : []} alt={listing.title} dark={dark} className="aspect-[5/4]" rounded="rounded-t-2xl" showDots={false} showArrows={false} />
        <div className={cn("pointer-events-none absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r", a.stripe)} />
        {/* Overlay: type bottom-left, location bottom-right */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
          <div className="flex items-end justify-between gap-2">
            <span className={cn("rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-semibold text-white", a.chip)}>
              {listing.type === 'want' ? t('looking_for', useLang()) : t('selling', useLang())}
            </span>
            <span className={cn("truncate max-w-[60%] rounded-full px-3 py-1 text-[11px] backdrop-blur-sm", dark ? "bg-neutral-900/80 text-neutral-200" : "bg-white/80 text-neutral-700")}>📍 {listing.location}</span>
          </div>
        </div>
      </div>
      <div className="p-4 pt-4">
        {/* Title under image */}
        <div className="min-h-[3.5rem]">
          <h3 className={cn("line-clamp-2 text-xl font-semibold leading-snug", dark ? "text-white" : "text-neutral-900")}>{sanitizeTitle(listing.title, listing.type)}</h3>
        </div>
        {/* Price and fiat */}
        <div className="mt-3">
          <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} size="lg" compactFiat />
        </div>
        {/* Seller info at bottom (one line, left) */}
        <div className="mt-4 text-left text-sm">
          <div className={cn("inline-flex items-center gap-2", dark ? "text-neutral-300" : "text-neutral-700")}> 
            {listing.seller.score >= 50 && (
              <span
                className={cn(
                  "verified-badge inline-flex h-4 w-4 items-center justify-center rounded-full text-white font-extrabold shadow-[0_0_8px_rgba(56,189,248,0.8)]",
                  dark ? "bg-sky-500" : "bg-sky-500"
                )}
                aria-label="Verified"
                title={t('verified_tooltip', useLang())}
              >
                ✓
              </span>
            )}
            <span className="truncate max-w-[8rem] sm:max-w-[10rem]">{listing.seller.name}</span>
            <span className={cn(dark ? "text-neutral-400" : "text-neutral-600")}>+{listing.seller.score} 👍</span>
          </div>
        </div>
      </div>
    </article>
  );
}
