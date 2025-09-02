"use client";

import { useState, useEffect } from "react";
import { cn, formatBTCFromSats } from "@/lib/utils";
import type { Unit } from "@/lib/types";

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendOffer: (amount: number, expiresAt?: number) => void;
  listingPrice?: number; // in satoshis
  dark?: boolean;
  unit?: Unit;
}

export default function OfferModal({
  isOpen,
  onClose,
  onSendOffer,
  listingPrice,
  dark = false,
  unit = "sats"
}: OfferModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDays, setExpirationDays] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default amount to listing price when modal opens
  useEffect(() => {
    if (isOpen && listingPrice && listingPrice > 0) {
      setAmount(listingPrice);
    } else {
      setAmount(0);
    }
    setHasExpiration(false);
    setExpirationDays(1);
  }, [isOpen, listingPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎯 OfferModal: handleSubmit called');
    console.log('🎯 OfferModal: amount:', amount, 'unit:', unit);
    
    if (amount <= 0) {
      console.log('❌ OfferModal: amount is 0 or negative, returning');
      return;
    }

    setIsSubmitting(true);
    try {
      const expiresAt = hasExpiration 
        ? Math.floor(Date.now() / 1000) + (expirationDays * 24 * 60 * 60)
        : undefined;
      
      console.log('🎯 OfferModal: calling onSendOffer with:', { amount, expiresAt, hasExpiration, expirationDays });
      await onSendOffer(amount, expiresAt);
      console.log('✅ OfferModal: onSendOffer completed successfully');
      onClose();
    } catch (error) {
      console.error('❌ OfferModal: Error sending offer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert BTC to sats
  const btcToSats = (btc: number): number => {
    return Math.round(btc * 1e8);
  };

  // Convert sats to BTC
  const satsToBtc = (sats: number): number => {
    return sats / 1e8;
  };

  const formatAmount = (satoshis: number) => {
    if (satoshis === 0) return "0";
    if (unit === "BTC") {
      return formatBTCFromSats(satoshis);
    }
    return satoshis.toLocaleString();
  };

  const parseAmount = (value: string) => {
    if (unit === "BTC") {
      // For BTC, allow decimal input
      const cleaned = value.replace(/[^\d.]/g, '');
      const btc = parseFloat(cleaned) || 0;
      return btcToSats(btc);
    } else {
      // For sats, only allow integers
      const cleaned = value.replace(/[^\d]/g, '');
      return cleaned ? parseInt(cleaned, 10) : 0;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={cn(
            "w-full max-w-md rounded-2xl shadow-xl border",
            dark 
              ? "bg-neutral-900 border-neutral-700" 
              : "bg-white border-neutral-200"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn(
            "px-6 py-4 border-b",
            dark ? "border-neutral-700" : "border-neutral-200"
          )}>
            <h2 className={cn(
              "text-lg font-semibold",
              dark ? "text-white" : "text-neutral-900"
            )}>
              Make an Offer
            </h2>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <label className={cn(
                "block text-sm font-medium",
                dark ? "text-neutral-300" : "text-neutral-700"
              )}>
                Offer Amount ({unit === "BTC" ? "BTC" : "sats"})
              </label>
              <div className="relative">
                <input
                  type={unit === "BTC" ? "number" : "text"}
                  step={unit === "BTC" ? "0.00000001" : undefined}
                  value={formatAmount(amount)}
                  onChange={(e) => setAmount(parseAmount(e.target.value))}
                  placeholder="0"
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border text-lg font-medium",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    dark 
                      ? "bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400" 
                      : "bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500"
                  )}
                  maxLength={unit === "BTC" ? 12 : 10}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className={cn(
                    "text-sm font-medium",
                    dark ? "text-neutral-400" : "text-neutral-500"
                  )}>
                    {unit === "BTC" ? "₿" : "sats"}
                  </span>
                </div>
              </div>
              {listingPrice && listingPrice > 0 && (
                <p className={cn(
                  "text-xs",
                  dark ? "text-neutral-400" : "text-neutral-500"
                )}>
                  Listing price: {formatAmount(listingPrice)} {unit === "BTC" ? "₿" : "sats"}
                </p>
              )}
            </div>

            {/* Expiration Toggle */}
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExpiration}
                  onChange={(e) => setHasExpiration(e.target.checked)}
                  className={cn(
                    "w-4 h-4 rounded border-2 focus:ring-2 focus:ring-blue-500",
                    dark 
                      ? "bg-neutral-800 border-neutral-600 text-blue-500" 
                      : "bg-white border-neutral-300 text-blue-500"
                  )}
                />
                <span className={cn(
                  "text-sm font-medium",
                  dark ? "text-neutral-300" : "text-neutral-700"
                )}>
                  Set expiration time
                </span>
                <div className="relative group">
                  <svg 
                    className="w-4 h-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-help" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {/* Tooltip */}
                  <div className={cn(
                    "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg shadow-lg border z-10",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
                    "w-64 text-center",
                    dark 
                      ? "bg-neutral-800 border-neutral-700 text-neutral-200" 
                      : "bg-white border-neutral-200 text-neutral-700"
                  )}>
                    This will allow the offer to automatically expire in a set amount of time if no action is taken
                    <div className={cn(
                      "absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent",
                      dark ? "border-t-neutral-800" : "border-t-white"
                    )}></div>
                  </div>
                </div>
              </label>

              {hasExpiration && (
                <div className="ml-7">
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500",
                      dark 
                        ? "bg-neutral-800 border-neutral-600 text-white" 
                        : "bg-white border-neutral-300 text-neutral-900"
                    )}
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>1 week</option>
                    <option value={14}>2 weeks</option>
                    <option value={30}>1 month</option>
                  </select>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  dark 
                    ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white" 
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={amount <= 0 || isSubmitting}
                className={cn(
                  "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:from-orange-300 disabled:to-orange-400"
                )}
              >
                {isSubmitting ? "Sending..." : "Send Offer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
