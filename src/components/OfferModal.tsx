"use client";

import { useState, useEffect } from "react";
import { cn, formatBTCFromSats } from "@/lib/utils";
import type { Unit } from "@/lib/types";

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendOffer: (amount: number, expiresAt: number) => void;
  onAbortOffer?: (offerId: string, action: 'abort') => void;
  listingPrice?: number; // in satoshis
  dark?: boolean;
  unit?: Unit;
  existingOffer?: {
    id: string;
    amount_sat: number;
    expires_at?: number;
    status: string;
    from_user_id: string;
    to_user_id: string;
    created_at: number;
  } | null;
}

export default function OfferModal({
  isOpen,
  onClose,
  onSendOffer,
  onAbortOffer,
  listingPrice,
  dark = false,
  unit = "sats",
  existingOffer
}: OfferModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [expirationHours, setExpirationHours] = useState(24); // Default to 24 hours
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);

  // Set default amount to listing price when modal opens
  useEffect(() => {
    if (isOpen && listingPrice && listingPrice > 0) {
      setAmount(listingPrice);
    }
    setExpirationHours(24); // Reset to 24 hours default
  }, [isOpen, listingPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      // All offers must expire - calculate expiration time in seconds
      const expiresAt = Math.floor(Date.now() / 1000) + (expirationHours * 60 * 60);
      
      await onSendOffer(amount, expiresAt);
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
    if (!satoshis || satoshis === 0) return "0";
    if (unit === "BTC") {
      return formatBTCFromSats(satoshis);
    }
    return satoshis.toLocaleString();
  };

  const parseAmount = (value: string): number => {
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

  const handleAbortConfirm = async () => {
    if (!existingOffer || !onAbortOffer) return;
    
    setIsSubmitting(true);
    try {
      await onAbortOffer(existingOffer.id, 'abort');
      setShowAbortConfirm(false);
      onClose();
    } catch (error) {
      console.error('❌ OfferModal: Error aborting offer:', error);
    } finally {
      setIsSubmitting(false);
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
              {existingOffer ? "Your Offer" : "Make an Offer"}
            </h2>
          </div>

          {/* Content */}
          {existingOffer ? (
            // Show existing offer details
            <div className="p-6 space-y-6">
              {/* Offer Details */}
              <div className="space-y-4">
                <div className={cn(
                  "p-4 rounded-lg border-2",
                  existingOffer.status === 'pending' 
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                    : "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      "text-sm font-semibold",
                      existingOffer.status === 'pending' 
                        ? "text-blue-800 dark:text-blue-200" 
                        : "text-gray-800 dark:text-gray-200"
                    )}>
                      {existingOffer.status === 'pending' ? 'Pending Offer' : 'Offer Status: ' + existingOffer.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className={cn(
                      "text-2xl font-bold",
                      existingOffer.status === 'pending' 
                        ? "text-blue-900 dark:text-blue-100" 
                        : "text-gray-900 dark:text-gray-100"
                    )}>
                      {unit === 'BTC' ? `₿${formatAmount(existingOffer.amount_sat)}` : `${formatAmount(existingOffer.amount_sat)} sats`}
                    </div>
                    
                    {existingOffer.expires_at && (
                      <div className={cn(
                        "text-sm",
                        existingOffer.status === 'pending' 
                          ? "text-blue-700 dark:text-blue-300" 
                          : "text-gray-600 dark:text-gray-400"
                      )}>
                        ⏰ Expires: {new Date(existingOffer.expires_at * 1000).toLocaleString()}
                      </div>
                    )}
                    
                    <div className={cn(
                      "text-xs",
                      existingOffer.status === 'pending' 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-gray-500 dark:text-gray-500"
                    )}>
                      Created: {new Date(existingOffer.created_at * 1000).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    dark 
                      ? "bg-neutral-700 text-neutral-200 hover:bg-neutral-600" 
                      : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                  )}
                >
                  Close
                </button>
                {existingOffer.status === 'pending' && onAbortOffer && (
                  <button
                    type="button"
                    onClick={() => setShowAbortConfirm(true)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  >
                    Abort Offer
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Show new offer form
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
                    Listing price: {unit === "BTC" ? `₿${formatAmount(listingPrice)}` : `${formatAmount(listingPrice)} sats`}
                  </p>
                )}
              </div>

              {/* Expiration Time (Required) */}
              <div className="space-y-2">
                <label className={cn(
                  "block text-sm font-medium",
                  dark ? "text-neutral-300" : "text-neutral-700"
                )}>
                  Offer Expiration Time
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={expirationHours}
                    onChange={(e) => setExpirationHours(parseInt(e.target.value))}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg border text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500",
                      dark 
                        ? "bg-neutral-800 border-neutral-600 text-white" 
                        : "bg-white border-neutral-300 text-neutral-900"
                    )}
                  >
                    <option value={1}>1 hour</option>
                    <option value={4}>4 hours</option>
                    <option value={12}>12 hours</option>
                    <option value={24}>24 hours</option>
                  </select>
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
                      All offers automatically expire after the selected time if no action is taken
                      <div className={cn(
                        "absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent",
                        dark ? "border-t-neutral-800" : "border-t-white"
                      )}></div>
                    </div>
                  </div>
                </div>
                <p className={cn(
                  "text-xs",
                  dark ? "text-neutral-400" : "text-neutral-500"
                )}>
                  This offer will expire on {new Date(Date.now() + (expirationHours * 60 * 60 * 1000)).toLocaleString()}
                </p>
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
          )}
        </div>
      </div>

      {/* Abort Confirmation Modal */}
      {showAbortConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-60"
            onClick={() => setShowAbortConfirm(false)}
          />
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div 
              className={cn(
                "w-full max-w-sm rounded-2xl shadow-xl border p-6",
                dark 
                  ? "bg-neutral-900 border-neutral-700" 
                  : "bg-white border-neutral-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={cn(
                "text-lg font-semibold mb-4",
                dark ? "text-white" : "text-neutral-900"
              )}>
                Abort Offer?
              </h3>
              <p className={cn(
                "text-sm mb-6",
                dark ? "text-neutral-300" : "text-neutral-600"
              )}>
                Are you sure you want to abort this offer? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAbortConfirm(false)}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    dark 
                      ? "bg-neutral-700 text-neutral-200 hover:bg-neutral-600" 
                      : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAbortConfirm}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Aborting..." : "Abort"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}