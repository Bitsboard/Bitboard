"use client";

import React from "react";
import Link from "next/link";
import { PriceBlock } from "./PriceBlock";
import { Carousel } from "./Carousel";
import { Modal, ModalHeader, ModalTitle, ModalCloseButton } from "./Modal";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-client";
import { generateProfilePicture, getInitials, formatPostAge } from "@/lib/utils";
import type { Listing, Category, Unit, Seller } from "@/lib/types";
import { ChatModal } from "./ChatModal";

interface ListingModalProps {
  listing: Listing;
  onClose: () => void;
  unit: Unit;
  btcCad: number | null;
  dark: boolean;
  onChat?: () => void;
  open: boolean;
  user?: any;
  onShowAuth?: () => void;
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

export function ListingModal({ listing, onClose, unit, btcCad, dark, onChat, open, user, onShowAuth }: ListingModalProps) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const lang = useLang();
  const a = accent(listing);
  const [sellerImageError, setSellerImageError] = React.useState(false);
  const [showChat, setShowChat] = React.useState(false);
  
  // Debug: Log btcCad value
  React.useEffect(() => {
    console.log('ListingModal btcCad:', btcCad, 'unit:', unit, 'listing.priceSats:', listing.priceSats);
  }, [btcCad, unit, listing.priceSats]);

  function sanitizeTitle(raw: string, type: "sell" | "want"): string {
    if (type !== "want") return raw;
    const cleaned = raw.replace(/^\s*(looking\s*for\s*:?-?\s*)/i, "");
    return cleaned.trim();
  }

  function handleChatClick() {
    console.log('handleChatClick called, user:', user, 'onShowAuth:', !!onShowAuth);
    if (!user) {
      console.log('No user, showing auth modal');
      if (onShowAuth) {
        onShowAuth();
      }
    } else {
      console.log('User exists, setting showChat to true');
      setShowChat(true);
    }
  }

  // If showing chat, render ChatModal instead
  if (showChat) {
    console.log('Rendering ChatModal, showChat:', showChat);
    return (
      <ChatModal
        listing={listing}
        onClose={onClose} // This will close the entire modal and return to base page
        dark={dark}
        btcCad={btcCad}
        unit={unit}
        onBackToListing={() => setShowChat(false)} // This goes back to listing modal
        user={user}
      />
    );
  }

  return (
    <Modal open={open} onClose={onClose} dark={dark} size="lg" ariaLabel={listing.title}>
      <ModalHeader dark={dark}>
        <div className="flex items-center gap-2">
          <span className={cn("flex-shrink-0 rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-semibold text-white", a.chip)}>
            {listing.type === 'want' ? t('looking_for', lang) : t('selling', lang)}
          </span>
          <ModalTitle>{listing.title}</ModalTitle>
          {boosted && (
            <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-neutral-950">BOOSTED</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              try {
                const shareData = { title: listing.title, text: listing.title, url: typeof window !== 'undefined' ? window.location.href : undefined } as ShareData;
                // @ts-ignore - navigator.share not in SSR
                if (typeof navigator !== 'undefined' && navigator.share) navigator.share(shareData);
                else if (typeof navigator !== 'undefined' && navigator.clipboard && typeof window !== 'undefined') navigator.clipboard.writeText(window.location.href);
              } catch { }
            }}
            className={cn("rounded-lg px-3 py-1", dark ? "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800")}
          >
            {t('share_listing', lang)}
          </button>
          <ModalCloseButton onClose={onClose} dark={dark} />
        </div>
      </ModalHeader>
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-5" style={{ maxHeight: "calc(90vh - 64px)" }}>
          {/* Left: media + seller + safety/report (static) */}
          <div className="md:col-span-3 overflow-hidden">
            <div className="relative">
              <Carousel images={listing.images} alt={listing.title} dark={dark} className="aspect-[5/4]" showThumbnails showDots={false} rounded="" />
              <div className={cn("pointer-events-none absolute left-0 right-0 top-0 h-1 bg-gradient-to-r", a.stripe)} />
              {/* Overlay chips removed per request */}
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-center">
                {/* Row 1, Col 1: seller info */}
                <div className={cn("text-sm flex items-center gap-2", dark ? "text-neutral-300" : "text-neutral-700")}>
                  {/* Username as clickable pill/tag - encapsulates both icon and name */}
                  <Link
                    href={`/profile/${listing.seller.name}`}
                    className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full font-medium transition-all duration-200 cursor-pointer relative",
                      "bg-white/10 dark:bg-neutral-800/50 hover:bg-white/20 dark:hover:bg-neutral-700/50",
                      "border border-neutral-300/60 dark:border-neutral-700/50",
                      "hover:scale-105 hover:shadow-md"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose(); // Close the modal when clicking username
                    }}
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
                        "verified-badge inline-flex h-6 w-6 items-center justify-center rounded-full text-white font-bold shadow-md"
                      )}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                      }}
                      aria-label="Verified"
                      title="User has verified their identity"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                  
                  <span className={cn(dark ? "text-neutral-400" : "text-neutral-600")}>+{listing.seller.score} 👍</span>
                </div>
                {/* Row 1, Col 2: button */}
                <div className="flex justify-end">
                  <button 
                    onClick={handleChatClick} 
                    className="min-w-[240px] rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-2 text-sm font-semibold text-white shadow"
                  >
                    {t('send_message', lang)}
                  </button>
                </div>
                {/* Row 2, Col 1: report (same size as warning, bold) */}
                <div>
                  <span className={cn("text-xs font-bold cursor-pointer", dark ? "text-red-400" : "text-red-600")}>{t('report_listing', lang)}</span>
                </div>
                {/* Row 2, Col 2: safety warning + localized learn more link */}
                <div className="flex justify-end">
                  <div className={cn("flex items-center gap-2 text-xs text-right whitespace-nowrap", dark ? "text-neutral-400" : "text-neutral-600")}>
                    <span>{t('listing_warning', lang)}</span>
                    <a href={`/${lang}/safety`} className={cn("font-semibold underline", dark ? "text-neutral-300" : "text-neutral-700")}>{t('learn_more', lang)}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: static top area + scrollable description */}
          <div className={cn("md:col-span-2 border-l flex flex-col", dark ? "border-neutral-900" : "border-neutral-200")} style={{ maxHeight: "calc(90vh - 64px)" }}>
            <div className="p-3 pr-6 shrink-0">
              {/* Top row: price left, location right */}
              <div className="flex items-center justify-between gap-2">
                <div className="shrink-0">
                  <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} size="md" compactFiat />
                </div>
                <div className="text-right">
                  <span className={cn("rounded-full px-3 py-1 text-[11px] inline-block", dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>📍 {listing.location}</span>
                  <div className="mt-1">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-white shadow-sm",
                      dark ? "bg-neutral-800/80 backdrop-blur-sm" : "bg-neutral-700 text-white"
                    )}>
                      {formatPostAge(listing.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className={cn("mt-2 h-px", dark ? "bg-neutral-900" : "bg-neutral-200")} />
            </div>
            
            {/* Description Interface */}
            <div className="flex-1 overflow-y-auto overscroll-contain scroll-bounce p-3 pr-10 mr-2 md:mr-3">
              <div className={cn("prose prose-sm max-w-none", dark ? "prose-invert" : "")}>
                <p className={cn("whitespace-pre-wrap", dark ? "text-neutral-300" : "text-neutral-800")}>{listing.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}


