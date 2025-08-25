"use client";

import React, { useState } from "react";
import { PriceBlock } from "./PriceBlock";
import { Modal } from "./Modal";
import type { Listing, Category, Unit, Seller } from "@/lib/types";
import Link from "next/link";

interface ChatModalProps {
  listing: Listing;
  onClose: () => void;
  dark: boolean;
  btcCad: number | null;
  unit: Unit;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function ChatModal({ listing, onClose, dark, btcCad, unit }: ChatModalProps) {
  const [messages, setMessages] = useState<{ id: number; who: "me" | "seller"; text: string; at: number }[]>([
    { id: 1, who: "seller", text: "Hey! Happy to answer any questions.", at: Date.now() - 1000 * 60 * 12 },
  ]);
  const [text, setText] = useState("");
  const [attachEscrow, setAttachEscrow] = useState(false);
  const [showEscrow, setShowEscrow] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  function send() {
    if (!text && !attachEscrow) return;
    if (text) setMessages((prev) => [...prev, { id: Math.random(), who: "me", text, at: Date.now() }]);
    if (attachEscrow) setShowEscrow(true);
    setText("");
    setAttachEscrow(false);
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      dark={dark}
      size="xl"
      ariaLabel={`Chat about ${listing.title}`}
      panelClassName={cn("flex w-full flex-col h-[95vh]")}
      maxHeightVh={95}
    >
      {/* Header with listing details and back button */}
      <div className={cn("flex items-center justify-between border-b px-6 py-4", dark ? "border-neutral-900" : "border-neutral-200")}>
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white shadow hover:from-orange-600 hover:to-red-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          {/* Listing image */}
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={listing.images[0]} 
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Listing details */}
          <div className="flex flex-col">
            <h3 className={cn("font-semibold text-sm", dark ? "text-white" : "text-neutral-900")}>
              {listing.title}
            </h3>
            <div className="flex items-center gap-2">
              <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} size="sm" />
              <span className={cn("text-xs", dark ? "text-neutral-400" : "text-neutral-600")}>
                📍 {listing.location}
              </span>
            </div>
          </div>
        </div>
        
        {/* Right side: Close button and Seller username pill */}
        <div className="flex items-center gap-3">
          {/* Close button */}
          <button
            onClick={onClose}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
              dark 
                ? "hover:bg-neutral-800 text-neutral-400 hover:text-white" 
                : "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-800"
            )}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Seller username pill */}
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
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${listing.seller.name}`}
                alt={`${listing.seller.name}'s profile picture`}
                className="w-5 h-5 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-xs font-bold text-white';
                    fallback.textContent = listing.seller.name.split(' ').map(n => n[0]).join('').toUpperCase();
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            
            {/* Username - Right side of pill with proper spacing */}
            <span className={cn("text-sm ml-1", dark ? "text-white" : "text-neutral-700")}>{listing.seller.name}</span>
            
            {/* Verified badge */}
            {(listing.seller.verifications?.email || listing.seller.verifications?.phone || listing.seller.verifications?.lnurl) && (
              <span
                className={cn(
                  "verified-badge inline-flex h-6 w-6 items-center justify-center rounded-full text-white font-bold shadow-md ml-2"
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
          </Link>
        </div>
      </div>

      {/* Chat content */}
      <div className="flex-1 flex flex-col min-h-0">
        {showTips && (
          <div className={cn("m-4 rounded-xl p-3 text-xs", dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>
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
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex",
                m.who === "me" ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[70%] rounded-2xl px-3 py-2 text-sm break-words relative",
                m.who === "me" 
                  ? "bg-orange-500 text-white" 
                  : dark ? "bg-neutral-900" : "bg-neutral-100"
              )}>
                <div className="mb-1">{m.text}</div>
                <div className={cn(
                  "text-xs opacity-70",
                  m.who === "me" ? "text-white/80" : dark ? "text-neutral-400" : "text-neutral-500"
                )}>
                  {new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Message Input */}
        <div className={cn("flex items-center gap-2 border-t p-4", dark ? "border-neutral-900" : "border-neutral-200")}>
          {/* Plus button with options */}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-200",
                dark 
                  ? "border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800" 
                  : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-100"
              )}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            
            {/* Dropdown options */}
            {showOptions && (
              <div className={cn(
                "absolute bottom-full left-0 mb-2 w-48 rounded-xl shadow-lg border z-10",
                dark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
              )}>
                <div className="py-2">
                  <button
                    onClick={() => {
                      setText("I'd like to make an offer on this item. What's your best price?");
                      setShowOptions(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-orange-500 hover:text-white transition-colors duration-200",
                      dark ? "text-neutral-300 hover:bg-orange-500" : "text-neutral-700 hover:bg-orange-500"
                    )}
                  >
                    💰 Give an offer
                  </button>
                  <button
                    onClick={() => {
                      setText("Is this item still available?");
                      setShowOptions(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-orange-500 hover:text-white transition-colors duration-200",
                      dark ? "text-neutral-300 hover:bg-orange-500" : "text-neutral-700 hover:bg-orange-500"
                    )}
                  >
                    ❓ Check availability
                  </button>
                  <button
                    onClick={() => {
                      setText("Can I see more photos of this item?");
                      setShowOptions(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-orange-500 hover:text-white transition-colors duration-200",
                      dark ? "text-neutral-300 hover:bg-orange-500" : "text-neutral-700 hover:bg-orange-500"
                    )}
                  >
                    📸 Request more photos
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message…"
            className={cn("flex-1 rounded-xl px-3 py-2 focus:outline-none", dark ? "border border-neutral-800 bg-neutral-900 text-neutral-100" : "border border-neutral-300 bg-white text-neutral-900")}
            onKeyPress={(e) => e.key === 'Enter' && send()}
          />
          <label className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-xs", dark ? "border border-neutral-800" : "border border-neutral-300")}>
            <input type="checkbox" checked={attachEscrow} onChange={(e) => setAttachEscrow(e.target.checked)} /> Attach escrow
          </label>
          <button onClick={send} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
            Send
          </button>
        </div>
        
        {/* Escrow Panel */}
        {showEscrow && (
          <div className={cn("border-t", dark ? "border-neutral-900" : "border-neutral-200")}>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="font-semibold">Escrow proposal</div>
              <button onClick={() => setShowEscrow(false)} className={cn("rounded px-2 py-1 text-xs", dark ? "hover:bg-neutral-900" : "hover:bg-neutral-200")}>
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
          <button onClick={() => setStep(2)} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow shadow-orange-500/30">
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
