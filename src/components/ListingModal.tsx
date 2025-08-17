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

export function ListingModal({ listing, onClose, unit, btcCad, dark, onChat }: ListingModalProps) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const lang = useLang();

  return (
    <Modal open={true} onClose={onClose} dark={dark} size="lg" ariaLabel={listing.title}>
      <ModalHeader dark={dark}>
        <div className="flex items-center gap-2">
          <ModalTitle>{listing.title}</ModalTitle>
          {boosted && (
            <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-neutral-950">BOOSTED</span>
          )}
        </div>
        <ModalCloseButton onClose={onClose} dark={dark} />
      </ModalHeader>
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
            <div className={cn("rounded-xl p-3", dark ? "border border-neutral-800 bg-neutral-900" : "border-neutral-300 bg-white border")}>
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
                {t('message_seller', lang)}
              </button>
            </div>
            <div className={cn("rounded-xl p-3 text-xs", dark ? "bg-neutral-900 text-neutral-400" : "bg-neutral-100 text-neutral-600")}> 
              {t('listing_warning', lang)}
            </div>
            <button className={cn("mt-2 w-full rounded-xl px-3 py-2 text-xs", dark ? "text-neutral-400 hover:bg-neutral-900" : "text-neutral-600 hover:bg-neutral-100")}>
              Report listing
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
