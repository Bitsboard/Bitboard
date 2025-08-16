"use client";

import React from "react";
import { PriceBlock } from "./PriceBlock";
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

export function ListingModal({ listing, onClose, unit, btcCad, dark, onChat }: ListingModalProps) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cn("w-full max-w-4xl overflow-hidden rounded-2xl", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-200 bg-white")}>
        <div className={cn("flex items-center justify-between border-b px-4 py-3", dark ? "border-neutral-900" : "border-neutral-200")}>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{listing.title}</h2>
            {boosted && <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-neutral-950">BOOSTED</span>}
          </div>
          <button onClick={onClose} className={cn("rounded-lg px-3 py-1", dark ? "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800")}>
            Close
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5">
          <div className="md:col-span-3">
            <Carousel images={listing.images} alt={listing.title} dark={dark} className="aspect-[4/3]" />
            <div className="p-4">
              <h3 className="font-semibold">Description</h3>
              <p className={cn("mt-2 text-sm", dark ? "text-neutral-300" : "text-neutral-700")}>{listing.desc}</p>
            </div>
          </div>
          <div className={cn("md:col-span-2 border-l", dark ? "border-neutral-900" : "border-neutral-200")}>
            <div className="space-y-3 p-4">
              <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} />
              <div className="text-sm opacity-80">📍 {listing.location}</div>
              <div className={cn("rounded-xl p-3", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Seller {listing.seller.name}</div>
                    <div className="text-xs opacity-80">
                      {stars(listing.seller.rating)} · {listing.seller.deals} deals · On-time releases {Math.round(listing.seller.onTimeRelease * 100)}%
                    </div>
                  </div>
                  <div className="flex gap-1 text-[10px]">
                    {listing.seller.verifications.email && <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-400">email</span>}
                    {listing.seller.verifications.phone && <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-400">phone</span>}
                    {listing.seller.verifications.lnurl && <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-400">lnurl</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={onChat} className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 font-semibold text-neutral-950 shadow shadow-orange-500/30">
                  Message seller
                </button>
              </div>
              <div className={cn("rounded-xl p-3 text-xs", dark ? "bg-neutral-900 text-neutral-400" : "bg-neutral-100 text-neutral-600")}>
                Keep all correspondence in-app for safety. Off-app contact is against our guidelines. When ready, attach an escrow proposal from the chat composer.
              </div>
              <button className={cn("mt-2 w-full rounded-xl px-3 py-2 text-xs", dark ? "text-neutral-400 hover:bg-neutral-900" : "text-neutral-600 hover:bg-neutral-100")}>
                Report listing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
