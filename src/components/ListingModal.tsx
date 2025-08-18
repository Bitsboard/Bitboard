"use client";

import React from "react";
import { PriceBlock } from "./PriceBlock";
import { Carousel } from "./Carousel";
import { Modal, ModalHeader, ModalTitle, ModalCloseButton } from "./Modal";
import { t, useLang } from "@/lib/i18n";

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

interface ListingModalProps {
  listing: Listing;
  onClose: () => void;
  unit: Unit;
  btcCad: number | null;
  dark: boolean;
  onChat: () => void;
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

export function ListingModal({ listing, onClose, unit, btcCad, dark, onChat }: ListingModalProps) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const lang = useLang();
  const a = accent(listing);

  function sanitizeTitle(raw: string, type: "sell" | "want"): string {
    if (type !== "want") return raw;
    const cleaned = raw.replace(/^\s*(looking\s*for\s*:?-?\s*)/i, "");
    return cleaned.trim();
  }

  return (
    <Modal open={true} onClose={onClose} dark={dark} size="lg" ariaLabel={listing.title}>
      <ModalHeader dark={dark}>
        <div className="flex items-center gap-2">
          <span className={cn("flex-shrink-0 rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-semibold text-white", a.chip)}>
            {listing.type === 'want' ? 'Looking For' : 'Selling'}
          </span>
          <ModalTitle>{listing.title}</ModalTitle>
          {boosted && (
            <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-neutral-950">BOOSTED</span>
          )}
        </div>
        <ModalCloseButton onClose={onClose} dark={dark} label={t('close', lang)} />
      </ModalHeader>
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-5" style={{ maxHeight: "calc(90vh - 64px)" }}>
        {/* Left: media + seller + safety/report (static) */}
        <div className="md:col-span-3 overflow-hidden">
          <div className="relative">
            <Carousel images={listing.images} alt={listing.title} dark={dark} className="aspect-[5/4]" showThumbnails showDots={false} />
            <div className={cn("pointer-events-none absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r", a.stripe)} />
            {/* Overlay chips removed per request */}
          </div>
          <div className="p-4 space-y-3">
            <div className={cn("text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>{t('listing_warning', lang)}</div>
            <div className="flex justify-end">
              <span className={cn("text-sm font-bold cursor-pointer text-right", dark ? "text-red-400" : "text-red-600")}>{t('report_listing', lang)}</span>
            </div>
            {/* Seller info + button on the right side of the left column */}
            <div className="mt-2 flex flex-col items-end gap-2">
              <div className={cn("text-sm flex items-center gap-2", dark ? "text-neutral-300" : "text-neutral-700")}> 
                {listing.seller.score >= 50 && (
                  <span className={cn("verified-badge inline-flex h-4 w-4 items-center justify-center rounded-full text-white font-extrabold shadow-[0_0_8px_rgba(56,189,248,0.8)]", dark ? "bg-sky-500" : "bg-sky-500")} aria-label="Verified" title="User has verified their identity">✓</span>
                )}
                <span>{listing.seller.name}</span>
                <span className="opacity-80">+{listing.seller.score} 👍</span>
              </div>
              <button onClick={onChat} className="min-w-[240px] rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-2 text-sm font-semibold text-white shadow">
                Send a Message
              </button>
            </div>
          </div>
        </div>

        {/* Right: static top area + scrollable description with extra right padding */}
        <div className={cn("md:col-span-2 border-l flex flex-col", dark ? "border-neutral-900" : "border-neutral-200")} style={{ maxHeight: "calc(90vh - 64px)" }}> 
          <div className="p-4 pr-6 shrink-0">
            {/* Top row: price left, location right */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="shrink-0">
                <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} size="md" compactFiat />
              </div>
              <span className={cn("truncate max-w-[60%] rounded-full px-3 py-1 text-[11px]", dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>📍 {listing.location}</span>
            </div>
            <div className={cn("my-3 h-px", dark ? "bg-neutral-900" : "bg-neutral-200")} />
            {/* Removed seller info/button from right column */}
            <div className={cn("my-3 h-px", dark ? "bg-neutral-900" : "bg-neutral-200")} />
          </div>
          <div className="flex-1 overflow-y-auto p-4 pr-10">
            <div className={cn("prose prose-sm max-w-none", dark ? "prose-invert" : "")}> 
              <p className={cn("whitespace-pre-wrap", dark ? "text-neutral-300" : "text-neutral-800")}>{listing.desc}</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </Modal>
  );
}
