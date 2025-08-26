"use client";

import React from "react";
import Link from "next/link";
import { PriceBlock } from "./PriceBlock";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-client";
import { TypePill } from "./TypePill";
import { Carousel } from "./Carousel";
import { cn, generateProfilePicture, getInitials, formatPostAge } from "@/lib/utils";
import type { Listing } from "@/lib/types";

interface ListingCardProps {
  listing: Listing;
  unit: "sats" | "BTC";
  btcCad: number | null;
  dark: boolean;
  onOpen: () => void;
}

function accent(listing: Listing) {
  if (listing.type === "sell") {
    return { stripe: "from-emerald-500 to-teal-500", chip: "from-emerald-500 to-teal-500" };
  }
  return { stripe: "from-fuchsia-500 to-violet-500", chip: "from-fuchsia-500 to-violet-500" };
}

function sanitizeTitle(raw: string, type: "sell" | "want"): string {
  if (type !== "want") return raw;
  const cleaned = raw.replace(/^\s*(looking\s*for\s*:?-?\s*)/i, "");
  return cleaned.trim();
}

export function ListingCard({ listing, unit, btcCad, dark, onOpen }: ListingCardProps) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const a = accent(listing);
  const [sellerImageError, setSellerImageError] = React.useState(false);
  const lang = useLang();

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
        
        {/* Age tag - top right of image */}
        <div className="absolute top-2 right-2">
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-white shadow-lg",
            dark ? "bg-neutral-900/80 backdrop-blur-sm" : "bg-neutral-700/90 backdrop-blur-sm"
          )}>
            {formatPostAge(listing.createdAt)}
          </span>
        </div>
        
        {/* Overlay: type bottom-left, location bottom-right */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
          <div className="flex items-end justify-between gap-2">
            <span className={cn("rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-semibold text-white", a.chip)}>
              {listing.type === 'want' ? t('looking_for', lang) : t('selling', lang)}
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
        {/* Seller info at bottom (one line, right) */}
        <div className="mt-4 text-right text-sm">
          <div className={cn("inline-flex items-center gap-2", dark ? "text-neutral-300" : "text-neutral-700")}>
            {/* Username as clickable pill/tag - encapsulates both icon and name */}
            <Link
              href={`/profile/${listing.seller.name}`}
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full font-medium transition-all duration-200 cursor-pointer relative",
                "bg-white/10 dark:bg-neutral-800/50 hover:bg-white/20 dark:hover:bg-neutral-700/50",
                                  "border border-neutral-300/60 dark:border-neutral-700/50",
                "hover:scale-105 hover:shadow-md"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profile Icon - Positioned so its center aligns with the left edge radius */}
              <div className="flex-shrink-0 -ml-2">
                {!sellerImageError ? (
                  <img
                    src={generateProfilePicture(listing.seller.name)}
                    alt={`${listing.seller.name}'s profile picture`}
                    className="w-5 h-5 rounded-full object-cover"
                    onError={() => setSellerImageError(true)}
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                    {getInitials(listing.seller.name)}
                  </div>
                )}
              </div>
              
                              {/* Username - Right side of pill with proper spacing */}
                <span className={cn("text-sm ml-1", dark ? "text-white" : "text-neutral-700")}>{listing.seller.name}</span>
            </Link>
            
            {(listing.seller.verifications.email || listing.seller.verifications.phone || listing.seller.verifications.lnurl) && (
              <span
                className={cn(
                  "verified-badge inline-flex h-4 w-4 items-center justify-center rounded-full text-white font-bold shadow-md"
                )}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                }}
                aria-label="Verified"
                title="User has verified their identity"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
            
            <span className={cn(dark ? "text-neutral-400" : "text-neutral-600")}>+{listing.seller.score} 👍</span>
          </div>
        </div>
      </div>
    </article>
  );
}
