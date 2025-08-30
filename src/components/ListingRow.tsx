"use client";

import React from "react";
import Link from "next/link";
import { PriceBlock } from "./PriceBlock";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-client";
import { TypePill } from "./TypePill";
import { Carousel } from "./Carousel";
import { generateProfilePicture, getInitials, formatPostAge } from "@/lib/utils";
import type { Listing, Category, Unit, Seller } from "@/lib/types";



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

export function ListingRow({ listing, unit, btcCad, dark, onOpen }: ListingRowProps) {
  const boosted = listing.boostedUntil && listing.boostedUntil > 0 && listing.boostedUntil > Date.now();
  const a = accent(listing);
  const [sellerImageError, setSellerImageError] = React.useState(false);
  const lang = useLang();
  
  return (
    <article
      onClick={onOpen}
      className={cn(
        "group relative grid grid-cols-12 gap-4 overflow-hidden rounded-2xl p-4 transition-transform duration-300 hover:scale-[1.02] hover:ring-2 hover:ring-orange-500/80 cursor-pointer min-h-[10rem] sm:min-h-[11rem] md:min-h-[12rem]",
        dark ? "border border-neutral-800 bg-neutral-950 hover:border-orange-400/60" : "border border-neutral-300 bg-white hover:border-orange-400/60"
      )}
    >
      <div className={cn("absolute right-0 top-0 h-full w-1 bg-gradient-to-b", a.stripe)} />
      {boosted ? (
        <div className="absolute right-4 top-3 z-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-neutral-950 shadow-lg">
          BOOSTED
        </div>
      ) : null}

      {/* Images */}
      <div className="col-span-3 overflow-hidden rounded-l-2xl -ml-4 -my-4 mr-0 h-[10rem] sm:h-[11rem] md:h-[12rem]">
        <div className="relative h-full">
          <Carousel images={listing.images?.[0] ? [listing.images[0]] : []} alt={listing.title} dark={dark} className="h-full" rounded="rounded-l-2xl" showDots={false} showArrows={false} />
          <div className={cn("pointer-events-none absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b", a.stripe)} />
        </div>
      </div>

      {/* Content */}
      <div className="col-span-9 flex flex-col pl-2 sm:pl-4 md:pl-6">
        {/* Tag row */}
        <div className="flex items-center justify-between mb-1 gap-2 min-w-0">
          <span className={cn("flex-shrink-0 rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-semibold text-white", a.chip)}>{listing.type === 'want' ? t('looking_for', lang) : t('selling', lang)}</span>
          <div className="flex items-center gap-2">
            {/* Age tag */}
            <span className={cn(
              "rounded-full px-2 py-1 text-[11px] font-semibold shadow-sm",
              dark ? "bg-neutral-800/80 backdrop-blur-sm text-white" : "bg-neutral-700 text-white"
            )}>
              {formatPostAge(listing.createdAt)}
            </span>
            {/* Location tag */}
            <span className={cn("rounded-full px-3 py-1 text-[11px]", dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>📍 {listing.location}</span>
          </div>
        </div>
        {/* Title */}
        <h3 className={cn("line-clamp-2 text-xl font-bold", dark ? "text-white" : "text-neutral-900")}>{sanitizeTitle(listing.title, listing.type)}</h3>
        {/* Bottom meta */}
        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="shrink-0">
            <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} size="lg" />
          </div>
          <div className="text-right text-base">
            <div className="flex items-center gap-2">
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
              
              <span className={cn(dark ? "text-neutral-400" : "text-neutral-600")}>+{listing.seller.thumbsUp} 👍</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
