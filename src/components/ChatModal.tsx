"use client";

import React, { useState } from "react";
import { PriceBlock } from "./PriceBlock";

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

  function send() {
    if (!text && !attachEscrow) return;
    if (text) setMessages((prev) => [...prev, { id: Math.random(), who: "me", text, at: Date.now() }]);
    if (attachEscrow) setShowEscrow(true);
    setText("");
    setAttachEscrow(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cn("flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl md:flex-row", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-200 bg-white")}>
        <div className={cn("flex items-center justify-between border-b px-4 py-3 md:border-b-0 md:border-r", dark ? "border-neutral-900" : "border-neutral-200")}>
          <div>
            <div className="text-sm opacity-70">Chat about</div>
            <div className="font-semibold">{listing.title}</div>
          </div>
          <button onClick={onClose} className={cn("rounded-lg px-3 py-1", dark ? "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800")}>
            Close
          </button>
        </div>

        {/* Chat column */}
        <div className="flex flex-1 flex-col">
          {showTips && (
            <div className={cn("m-3 rounded-xl p-3 text-xs", dark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>
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
          <div className={cn("flex items-center gap-2 border-t p-3", dark ? "border-neutral-900" : "border-neutral-200")}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message…"
              className={cn("flex-1 rounded-xl px-3 py-2 focus:outline-none", dark ? "border border-neutral-800 bg-neutral-900 text-neutral-100" : "border border-neutral-300 bg-white text-neutral-900")}
            />
            <label className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-xs", dark ? "border border-neutral-800" : "border border-neutral-300")}>
              <input type="checkbox" checked={attachEscrow} onChange={(e) => setAttachEscrow(e.target.checked)} /> Attach escrow proposal
            </label>
            <button onClick={send} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-neutral-950">
              Send
            </button>
          </div>
        </div>

        {/* Escrow side panel */}
        {showEscrow && (
          <div className={cn("w-full max-w-md border-l", dark ? "border-neutral-900" : "border-neutral-200")}>
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
    </div>
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
            I've deposited
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
