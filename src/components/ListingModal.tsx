"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PriceBlock } from "./PriceBlock";
import { Carousel } from "./Carousel";
import { Modal, ModalHeader, ModalTitle, ModalCloseButton } from "./Modal";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-client";
import { generateProfilePicture, getInitials, formatPostAge } from "@/lib/utils";
import type { Listing, Category, Unit, Seller } from "@/lib/types";

interface ListingModalProps {
  listing: Listing;
  onClose: () => void;
  unit: Unit;
  btcCad: number | null;
  dark: boolean;
  onChat: () => void;
  open: boolean;
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

export function ListingModal({ listing, onClose, unit, btcCad, dark, onChat, open }: ListingModalProps) {
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const lang = useLang();
  const a = accent(listing);
  const [sellerImageError, setSellerImageError] = React.useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<{ id: number; who: "me" | "seller"; text: string; at: number }[]>([
    { id: 1, who: "seller", text: "Hey! Happy to answer any questions.", at: Date.now() - 1000 * 60 * 12 },
  ]);
  const [text, setText] = useState("");
  const [attachEscrow, setAttachEscrow] = useState(false);
  const [showEscrow, setShowEscrow] = useState(false);
  const [showTips, setShowTips] = useState(true);
  
  // Debug: Log btcCad value
  React.useEffect(() => {
    console.log('ListingModal btcCad:', btcCad, 'unit:', unit, 'listing.priceSats:', listing.priceSats);
  }, [btcCad, unit, listing.priceSats]);

  function sanitizeTitle(raw: string, type: "sell" | "want"): string {
    if (type !== "want") return raw;
    const cleaned = raw.replace(/^\s*(looking\s*for\s*:?-?\s*)/i, "");
    return cleaned.trim();
  }

  function sendMessage() {
    if (!text && !attachEscrow) return;
    if (text) setMessages((prev) => [...prev, { id: Math.random(), who: "me", text, at: Date.now() }]);
    if (attachEscrow) setShowEscrow(true);
    setText("");
    setAttachEscrow(false);
  }

  function handleChatClick() {
    if (onChat) {
      onChat();
    } else {
      setShowChat(true);
    }
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
          <ModalCloseButton onClose={onClose} dark={dark} label={t('close', lang)} />
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
                    {showChat ? t('back_to_listing', lang) || 'Back to Listing' : t('send_message', lang)}
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

          {/* Right: static top area + scrollable description or chat */}
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
            
            {showChat ? (
              /* Chat Interface */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Safety Tips */}
                {showTips && (
                  <div className={cn("mx-3 rounded-xl p-3 text-xs", dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong className="mr-2">Safety tips:</strong>
                        Meet in a <em>very public</em> place (mall, café, police e-commerce zone), bring a friend, keep chats in-app, verify serials and condition before paying, and prefer Lightning escrow over cash.
                      </div>
                      <button onClick={() => setShowTips(false)} className={cn("rounded px-2 py-1", dark ? "hover:bg-neutral-800" : "hover:bg-neutral-200")}>
                        Hide
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Messages */}
                <div className="flex-1 space-y-2 overflow-auto p-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                        m.who === "me" ? "ml-auto bg-orange-500 text-neutral-950" : dark ? "bg-neutral-900" : "bg-neutral-100"
                      )}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>
                
                {/* Message Input */}
                <div className={cn("flex items-center gap-2 border-t p-3", dark ? "border-neutral-900" : "border-neutral-200")}>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write a message…"
                    className={cn("flex-1 rounded-xl px-3 py-2 focus:outline-none", dark ? "border border-neutral-800 bg-neutral-900 text-neutral-100" : "border border-neutral-300 bg-white text-neutral-900")}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <label className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-xs", dark ? "border border-neutral-800" : "border border-neutral-300")}>
                    <input type="checkbox" checked={attachEscrow} onChange={(e) => setAttachEscrow(e.target.checked)} /> Attach escrow
                  </label>
                  <button onClick={sendMessage} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-neutral-950">
                    Send
                  </button>
                </div>
                
                {/* Escrow Panel */}
                {showEscrow && (
                  <div className={cn("border-t", dark ? "border-neutral-900" : "border-neutral-200")}>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="font-semibold">Escrow proposal</div>
                      <button onClick={() => setShowEscrow(false)} className={cn("rounded px-2 py-1 text-xs", dark ? "hover:bg-neutral-900" : "hover:bg-neutral-100")}>
                        Hide
                      </button>
                    </div>
                    <div className="px-4 pb-4">
                      <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} />
                      <div className={cn("mt-1 text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>
                        Funds are locked via Lightning hold invoice until both parties confirm release.
                      </div>
                    </div>
                    <EscrowFlow listing={listing} onClose={() => setShowEscrow(false)} dark={dark} />
                  </div>
                )}
              </div>
            ) : (
              /* Description Interface */
              <div className="flex-1 overflow-y-auto overscroll-contain scroll-bounce p-3 pr-10 mr-2 md:mr-3">
                <div className={cn("prose prose-sm max-w-none", dark ? "prose-invert" : "")}>
                  <p className={cn("whitespace-pre-wrap", dark ? "text-neutral-300" : "text-neutral-800")}>{listing.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function EscrowFlow({ listing, onClose, dark }: { listing: Listing; onClose: () => void; dark: boolean }) {
  const [step, setStep] = useState(1);
  const feeBps = 100; // 1%
  const fee = Math.ceil((listing.priceSats * feeBps) / 10000);
  const total = listing.priceSats + fee;
  const [invoice, setInvoice] = useState(() => `lnbchold${total}n1p${Math.random().toString(36).slice(2, 10)}...`);

  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      <div className={cn("rounded-xl p-3 text-sm", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
        <div>
          Send <span className="font-bold text-orange-500">{formatSats(total)} sats</span> to lock funds:
        </div>
        <div className={cn("mt-3 rounded-lg p-3 text-xs", dark ? "bg-neutral-800" : "bg-neutral-100")}>{invoice}</div>
        <div className={cn("mt-2 text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>Includes escrow fee {formatSats(fee)} sats (1%).</div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setStep(2)} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-neutral-950 shadow shadow-orange-500/30">
            I&apos;ve deposited
          </button>
          <button
            onClick={() => setInvoice(`lnbchold${total}n1p${Math.random().toString(36).slice(2, 10)}...`)}
            className={cn("rounded-xl px-4 py-2 text-sm", dark ? "border border-neutral-800 hover:bg-neutral-900" : "border border-neutral-300 hover:bg-neutral-100")}
          >
            Regenerate
          </button>
          <button onClick={onClose} className={cn("ml-auto rounded-xl px-4 py-2 text-sm", dark ? "border border-neutral-800 hover:bg-neutral-900" : "border border-neutral-300 hover:bg-neutral-100")}>
            Close
          </button>
        </div>
      </div>
      <div className={cn("rounded-xl p-3 text-xs", dark ? "bg-neutral-900 text-neutral-400" : "bg-neutral-100 text-neutral-600")}>
        Step {step}/3 — Meet in a very public place; if all good, both confirm release. Otherwise request refund; mediator can arbitrate.
      </div>
    </div>
  );
}

function formatSats(n: number) {
  return new Intl.NumberFormat(undefined).format(n);
}
