"use client";

import React, { useState, useEffect, useRef } from "react";
import { PriceBlock } from "./PriceBlock";
import { Modal } from "./Modal";
import { generateProfilePicture, getInitials } from "@/lib/utils";
import type { Listing, Category, Unit, Seller } from "@/lib/types";
import Link from "next/link";

interface ChatModalProps {
  listing: Listing;
  onClose: () => void;
  dark: boolean;
  btcCad: number | null;
  unit: Unit;
  onBackToListing?: () => void;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function ChatModal({ listing, onClose, dark, btcCad, unit, onBackToListing }: ChatModalProps) {
  const [messages, setMessages] = useState<{ id: number; who: "me" | "seller"; text: string; at: number }[]>([
    { id: 1, who: "seller", text: "Hey! Happy to answer any questions.", at: Date.now() - 1000 * 60 * 12 },
  ]);
  const [text, setText] = useState("");
  const [showEscrow, setShowEscrow] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [sellerImageError, setSellerImageError] = useState(false);
  
  // Ref for the chat container to enable auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-scroll to bottom when modal opens
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  function send() {
    if (!text) return;
    setMessages((prev) => [...prev, { id: Math.random(), who: "me", text, at: Date.now() }]);
    setText("");
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      dark={dark}
      size="md"
      ariaLabel={`Chat about ${listing.title}`}
      panelClassName={cn("flex w-full flex-col h-[95vh]")}
      maxHeightVh={95}
    >
      {/* Header with listing details and back button */}
      <div className={cn("relative flex items-center justify-between border-b px-6 py-4", dark ? "border-neutral-900" : "border-neutral-200")}>
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button 
            onClick={onBackToListing || onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white shadow hover:from-orange-600 hover:to-red-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          {/* Listing title - now with truncation */}
          <h2 className={cn("text-lg font-semibold truncate max-w-sm", dark ? "text-white" : "text-neutral-900")}>
            {listing.title}
          </h2>
        </div>
        
        {/* Close button - positioned absolutely at the very top right */}
        <button
          onClick={onClose}
          className={cn(
            "absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
            dark 
              ? "hover:bg-neutral-800 text-neutral-400 hover:text-white" 
              : "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-800"
          )}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Chat content - now scrollable as one unit */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Scrollable chat container that includes listing info */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto min-h-0"
        >
          {/* Listing details box - now mimics list-view card */}
          <div 
            className={cn(
              "m-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
              dark ? "bg-neutral-900 border-neutral-700 hover:border-orange-500/50" : "bg-neutral-100 border-neutral-200 hover:border-orange-500/50"
            )}
            onClick={() => {
              if (onBackToListing) {
                onBackToListing();
              } else {
                onClose();
              }
            }}
          >
            <div className="flex items-start gap-4">
              {/* Listing image - now even larger */}
              <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={listing.images[0]} 
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Listing details */}
              <div className="flex flex-col flex-1 min-h-0">
                {/* Top row: Type pill and Location */}
                <div className="flex items-center justify-between mb-2">
                  {/* Type pill */}
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    listing.type === 'sell' 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  )}>
                    {listing.type === 'sell' ? 'Selling' : 'Looking for'}
                  </span>
                  
                  {/* Location pill - now positioned top right */}
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    dark ? "bg-neutral-800 text-neutral-300 border border-neutral-700" : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                  )}>
                    📍 {listing.location}
                  </span>
                </div>
                
                {/* Title */}
                <h3 className={cn("font-semibold text-sm mb-2", dark ? "text-white" : "text-neutral-900")}>
                  {listing.title}
                </h3>
                
                {/* Price */}
                <div className="mb-2">
                  <PriceBlock sats={listing.priceSats} unit={unit} btcCad={btcCad} dark={dark} size="sm" />
                </div>
                
                {/* Spacer to push username up */}
                <div className="flex-1 min-h-[20px]"></div>
                
                {/* Bottom row: Username and Reputation */}
                <div className="flex items-center justify-end gap-2">
                  {/* Username pill */}
                  <Link
                    href={`/profile/${listing.seller.name}`}
                    className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer relative",
                      "bg-white/10 dark:bg-neutral-800/50 hover:bg-white/20 dark:hover:bg-neutral-700/50",
                      "border border-neutral-300/60 dark:border-neutral-700/50",
                      "hover:scale-105 hover:shadow-md"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose(); // Close the modal when clicking username
                    }}
                  >
                    {/* Profile Icon */}
                    <div className="flex-shrink-0 -ml-1 mr-1">
                      {!sellerImageError ? (
                        <img
                          src={generateProfilePicture(listing.seller.name)}
                          alt={`${listing.seller.name}'s profile picture`}
                          className="w-3 h-3 rounded-full object-cover"
                          onError={() => setSellerImageError(true)}
                        />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                          {getInitials(listing.seller.name)}
                        </div>
                      )}
                    </div>
                    
                    {/* Username */}
                    <span className={cn("text-xs", dark ? "text-white" : "text-neutral-700")}>{listing.seller.name}</span>
                    
                    {/* Verified badge */}
                    {(listing.seller.verifications?.email || listing.seller.verifications?.phone || listing.seller.verifications?.lnurl) && (
                      <span
                        className={cn(
                          "ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full text-white font-bold shadow-md"
                        )}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                        }}
                        aria-label="Verified"
                        title="User has verified their identity"
                      >
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </Link>
                  
                  {/* User reputation - positioned to the right of username */}
                  <span className={cn(
                    "text-xs font-medium",
                    dark ? "text-neutral-300" : "text-neutral-600"
                  )}>
                    +{listing.seller.score} 👍
                  </span>
                </div>
              </div>
            </div>
          </div>

          {showTips && (
            <div className="mx-4 rounded-xl p-3 text-xs bg-red-600 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="mr-2">Safety tips:</strong>
                  stay safe and meet in a very public place, like a mall, café, or a police e-commerce zone. Keep all chats in-app, and report any suspicious activity.{' '}
                  <Link 
                    href="/safety" 
                    className="underline hover:text-red-200 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Learn more
                  </Link>
                </div>
                <button onClick={() => setShowTips(false)} className="rounded px-2 py-1 hover:bg-red-700 transition-colors">
                  Hide
                </button>
              </div>
            </div>
          )}
          
          {/* Messages */}
          <div className="p-4 space-y-3">
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
              <>
                {/* Click outside overlay */}
                <div 
                  className="fixed inset-0 z-0" 
                  onClick={() => setShowOptions(false)}
                />
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
              </>
            )}
          </div>
          
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message…"
            className={cn("flex-1 rounded-xl px-3 py-2 focus:outline-none", dark ? "border border-neutral-800 bg-neutral-900 text-neutral-100" : "border border-neutral-300 bg-white text-neutral-900")}
            onKeyPress={(e) => e.key === 'Enter' && send()}
          />
          <button 
            onClick={send} 
            disabled={!text.trim()}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200",
              text.trim() 
                ? "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer" 
                : "bg-neutral-400 text-neutral-600 cursor-not-allowed"
            )}
          >
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
