"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendOffer: (amount: number, expiresAt?: number) => void;
  listingPrice?: number; // in satoshis
  dark?: boolean;
}

export default function OfferModal({
  isOpen,
  onClose,
  onSendOffer,
  listingPrice,
  dark = false
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
    if (amount <= 0) return;

    setIsSubmitting(true);
    try {
      const expiresAt = hasExpiration 
        ? Math.floor(Date.now() / 1000) + (expirationDays * 24 * 60 * 60)
        : undefined;
      
      await onSendOffer(amount, expiresAt);
      onClose();
    } catch (error) {
      console.error('Error sending offer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (satoshis: number) => {
    if (satoshis === 0) return "0";
    return satoshis.toLocaleString();
  };

  const parseAmount = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
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
                Offer Amount (sats)
              </label>
              <div className="relative">
                <input
                  type="text"
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
                  maxLength={10}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className={cn(
                    "text-sm font-medium",
                    dark ? "text-neutral-400" : "text-neutral-500"
                  )}>
                    sats
                  </span>
                </div>
              </div>
              {listingPrice && listingPrice > 0 && (
                <p className={cn(
                  "text-xs",
                  dark ? "text-neutral-400" : "text-neutral-500"
                )}>
                  Listing price: {formatAmount(listingPrice)} sats
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
                  "bg-blue-500 text-white hover:bg-blue-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
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
