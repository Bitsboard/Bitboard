"use client";

import React from "react";
import Link from "next/link";
import { PriceBlock } from "./PriceBlock";
import { Carousel } from "./Carousel";
import { Modal, ModalHeader, ModalTitle, ModalCloseButton } from "./Modal";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-client";
import { generateProfilePicture, getInitials, formatPostAge, cn } from "@/lib/utils";
import type { Listing, Category, Unit, Seller } from "@/lib/types";
import { ChatModal } from "./ChatModal";
import { PrimaryButton } from "./ui/Button";
import { Avatar } from "./ui/Avatar";
import { ModalOrchestratorProvider, useModalOrchestrator } from "./modal-orchestrator";

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
  fromMessagesPage?: boolean; // New prop to indicate if opened from messages page
}

function accent(listing: Listing) {
  if (listing.type === "sell") {
    return { stripe: "from-emerald-500 to-teal-500", chip: "from-emerald-500 to-teal-500" };
  }
  return { stripe: "from-fuchsia-500 to-violet-500", chip: "from-fuchsia-500 to-violet-500" };
}

export function ListingModal({ listing, onClose, unit, btcCad, dark, onChat, open, user, onShowAuth, fromMessagesPage = false }: ListingModalProps) {
  return (
    <ModalOrchestratorProvider offerWidthPx={420}>
      <ListingShell 
        listing={listing} 
        onClose={onClose} 
        unit={unit} 
        btcCad={btcCad} 
        dark={dark} 
        onChat={onChat} 
        open={open} 
        user={user} 
        onShowAuth={onShowAuth} 
        fromMessagesPage={fromMessagesPage} 
      />
    </ModalOrchestratorProvider>
  );
}

function ListingShell({ listing, onClose, unit, btcCad, dark, onChat, open, user, onShowAuth, fromMessagesPage = false }: ListingModalProps) {
  const boosted = Boolean(listing.boostedUntil && listing.boostedUntil > Date.now());
  const lang = useLang();
  const a = accent(listing);
  const [sellerImageError, setSellerImageError] = React.useState(false);
  const [showChat, setShowChat] = React.useState(false);
  const [isTrackingView, setIsTrackingView] = React.useState(false);
  
  // Get orchestrator state
  const { isOfferOpen, isDesktop, offerDockRef, offerWidthPx, dockReady, setDockReady } = useModalOrchestrator();
  
  
  // Track view when modal opens
  React.useEffect(() => {
    if (open && listing.id) {
      trackListingView(listing.id);
    }
  }, [open, listing.id]);

  // Function to track listing view
  const trackListingView = async (listingId: string) => {
    try {
      setIsTrackingView(true);
      const response = await fetch(`/api/listings/${listingId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json() as { success: boolean; alreadyViewed?: boolean; message?: string };
        if (data.success && !data.alreadyViewed) {
          // View tracked successfully
        } else if (data.alreadyViewed) {
          // View already recorded recently
        }
      }
    } catch (error) {
      console.error('Failed to track listing view:', error);
    } finally {
      setIsTrackingView(false);
    }
  };
  

  function sanitizeTitle(raw: string, type: "sell" | "want"): string {
    if (type !== "want") return raw;
    const cleaned = raw.replace(/^\s*(looking\s*for\s*:?-?\s*)/i, "");
    return cleaned.trim();
  }

  function handleChatClick() {
    
    if (!user) {
      
      if (onShowAuth) {
        onShowAuth();
      }
    } else {
      
      // If opened from messages page, close the modal instead of opening chat
      if (fromMessagesPage) {
        onClose();
      } else {
        setShowChat(true);
      }
    }
  }

  // Always render the dock and container, conditionally show ChatModal or ListingModal content

  // When the offer is open on desktop, shift listing left to create consistent gap.
  // Chat modal moves left, offer modal slides in from right
  const GAP_PX = 80; // Fixed gap between modals
  const shiftAmount = isDesktop && isOfferOpen ? -(offerWidthPx + GAP_PX) : 0;

  // CSS vars and styles for dynamic positioning
  const style = { 
    ['--offer-w' as any]: `${offerWidthPx}px`,
    transform: isDesktop && isOfferOpen ? `translateX(${shiftAmount}px)` : 'translateX(0px)',
    transition: 'transform 300ms ease-out'
  };

  // Use a two-phase approach: first render in closed state, then transition to open
  const [dockPhase, setDockPhase] = React.useState<'closed' | 'transitioning' | 'open'>('closed');
  
  React.useEffect(() => {
    if (isOfferOpen && isDesktop) {
      // Phase 1: Start in closed state
      setDockPhase('closed');
      setDockReady(false);
      
      // Phase 2: After a brief delay, start transition
      const transitionTimer = setTimeout(() => {
        setDockPhase('transitioning');
      }, 10);
      
      // Phase 3: After transition completes, mark as ready
      const readyTimer = setTimeout(() => {
        setDockPhase('open');
        setDockReady(true);
      }, 50);
      
      return () => {
        clearTimeout(transitionTimer);
        clearTimeout(readyTimer);
      };
    } else {
      setDockPhase('closed');
      setDockReady(false);
    }
  }, [isOfferOpen, isDesktop, setDockReady]);
  
  // Determine dock state based on phase
  const dockState = dockPhase === 'open' ? 'open' : 'closed';
  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Right-side dock that OfferModal will portal into (desktop only) */}
      <div
        ref={offerDockRef}
        aria-hidden
        data-state={dockState}
        style={{ width: offerWidthPx }}
        className={cn(
          "pointer-events-auto fixed top-1/2 -translate-y-1/2 shadow-2xl transition-transform duration-300 ease-out transform-gpu z-50",
          // Position dock with fixed gap from right edge when open
          dockPhase === 'open' ? `right-[${GAP_PX}px]` : "right-0 translate-x-full",
          isDesktop ? "block" : "hidden"
        )}
      />

      {/* Conditionally render ChatModal or ListingModal content */}
      {showChat ? (
        <ChatModal
          listing={listing}
          onClose={onClose} // This will close the entire modal and return to base page
          dark={dark}
          btcCad={btcCad}
          unit={unit}
          onBackToListing={() => setShowChat(false)} // This goes back to listing modal
          user={user}
          className="transition-transform duration-300 ease-out"
          style={style}
          showBackground={false} // Don't show background since ListingModal provides it
        />
      ) : (
        /* Listing container */
        <div
          style={style}
          className={cn(
            "relative z-10 w-full max-w-5xl rounded-2xl shadow-xl transition-transform duration-300 ease-out",
            dark ? "bg-neutral-950 text-neutral-100" : "bg-white text-neutral-900"
          )}
        >
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
        <div className="grid grid-cols-1 md:grid-cols-5" style={{ maxHeight: "calc(95vh - 80px)" }}>
          {/* Left: media + seller + safety/report (static) */}
          <div className="md:col-span-3 flex flex-col overflow-hidden">
            <div className="flex-shrink-0">
              <Carousel images={listing.images} alt={listing.title} dark={dark} className="aspect-[3/2]" showThumbnails showDots={false} rounded="" />
              <div className={cn("pointer-events-none absolute left-0 right-0 top-0 h-1 bg-gradient-to-r", a.stripe)} />
              {/* Overlay chips removed per request */}
            </div>
            <div className="p-3 flex-shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1.5 items-center">
                {/* Row 1, Col 1: seller info */}
                <div className={cn("text-sm flex items-center gap-1.5", dark ? "text-neutral-300" : "text-neutral-700")}>
                  {/* Username as clickable pill/tag - encapsulates both icon and name */}
                  <Link
                    href={`/profile/${listing.seller.name}`}
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full font-medium transition-all duration-200 cursor-pointer relative",
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
                    <div className="flex-shrink-0 -ml-1.5">
                      {!sellerImageError ? (
                        <img
                          src={generateProfilePicture(listing.seller.name)}
                          alt={`${listing.seller.name}'s profile picture`}
                          className="w-4 h-4 rounded-full object-cover"
                          onError={() => setSellerImageError(true)}
                        />
                      ) : (
                        <Avatar size="sm">
                          {getInitials(listing.seller.name)}
                        </Avatar>
                      )}
                    </div>
                    
                    {/* Username - Right side of pill with proper spacing */}
                    <span className={cn("text-sm ml-1", dark ? "text-white" : "text-neutral-700")}>{listing.seller.name}</span>
                  </Link>
                  
                  {(listing.seller.verifications.email || listing.seller.verifications.phone || listing.seller.verifications.lnurl) && (
                    <span
                      className={cn(
                        "verified-badge inline-flex h-5 w-5 items-center justify-center rounded-full text-white font-bold shadow-md"
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
                {/* Row 1, Col 2: button */}
                <div className="flex justify-end">
                  <PrimaryButton 
                    onClick={handleChatClick} 
                    className="min-w-[200px]"
                  >
                    {t('send_message', lang)}
                  </PrimaryButton>
                </div>
                {/* Row 2, Col 1: report (same size as warning, bold) */}
                <div>
                  <span className={cn("text-xs font-bold cursor-pointer", dark ? "text-red-400" : "text-red-600")}>{t('report_listing', lang)}</span>
                </div>
                {/* Row 2, Col 2: safety warning + localized learn more link */}
                <div className="flex justify-end">
                  <div className={cn("flex items-center gap-1.5 text-xs text-right whitespace-nowrap", dark ? "text-neutral-400" : "text-neutral-600")}>
                    <span>{t('listing_warning', lang)}</span>
                    <a href={`/${lang}/safety`} className={cn("font-semibold underline", dark ? "text-neutral-300" : "text-neutral-700")}>{t('learn_more', lang)}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: static top area + scrollable description */}
          <div className={cn("md:col-span-2 border-l flex flex-col", dark ? "border-neutral-900" : "border-neutral-200")}>
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
            <div className="flex-1 overflow-y-auto overscroll-contain scroll-bounce p-3 pr-10 mr-2 md:mr-3 min-h-0">
              <div className={cn("prose prose-sm max-w-none", dark ? "prose-invert" : "")}>
                <p className={cn("whitespace-pre-wrap", dark ? "text-neutral-300" : "text-neutral-800")}>{listing.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
        </div>
      )}
    </div>
  );
}


