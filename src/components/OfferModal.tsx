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
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={cn(
            "w-full max-w-sm rounded-lg shadow-xl",
            dark 
              ? "bg-neutral-900 border border-neutral-700" 
              : "bg-white border border-neutral-200"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
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
            <div className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-bold mb-2",
                    dark ? "text-white" : "text-neutral-900"
                  )}>
                    {unit === 'BTC' ? `₿${formatAmount(existingOffer.amount_sat)}` : `${formatAmount(existingOffer.amount_sat)} sats`}
                  </div>
                  <div className={cn(
                    "text-sm font-medium px-3 py-1 rounded-full inline-block",
                    existingOffer.status === 'pending' 
                      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200"
                      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  )}>
                    {existingOffer.status === 'pending' ? 'Pending' : existingOffer.status}
                  </div>
                </div>
                
                {existingOffer.expires_at && (
                  <div className="text-center">
                    <div className={cn(
                      "text-sm",
                      dark ? "text-neutral-400" : "text-neutral-500"
                    )}>
                      Expires {new Date(existingOffer.expires_at * 1000).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    dark 
                      ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700" 
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  )}
                >
                  Close
                </button>
                {existingOffer.status === 'pending' && onAbortOffer && (
                  <button
                    type="button"
                    onClick={() => setShowAbortConfirm(true)}
                    className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
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
              <div>
                <label className={cn(
                  "block text-sm font-medium mb-2",
                  dark ? "text-neutral-300" : "text-neutral-700"
                )}>
                  Offer Amount
                </label>
                <div className="relative">
                  <input
                    type={unit === "BTC" ? "number" : "text"}
                    step={unit === "BTC" ? "0.00000001" : undefined}
                    value={formatAmount(amount)}
                    onChange={(e) => setAmount(parseAmount(e.target.value))}
                    placeholder="0"
                    className={cn(
                      "w-full px-3 py-2 rounded-md border text-lg font-medium",
                      "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
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
                    "text-xs mt-1",
                    dark ? "text-neutral-400" : "text-neutral-500"
                  )}>
                    Listing price: {unit === "BTC" ? `₿${formatAmount(listingPrice)}` : `${formatAmount(listingPrice)} sats`}
                  </p>
                )}
              </div>

              {/* Expiration Time */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cn(
                    "text-sm font-medium",
                    dark ? "text-neutral-300" : "text-neutral-700"
                  )}>
                    Expires in
                  </label>
                  <select
                    value={expirationHours}
                    onChange={(e) => setExpirationHours(parseInt(e.target.value))}
                    className={cn(
                      "px-3 py-1 rounded-md border text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
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
                </div>
                <p className={cn(
                  "text-xs",
                  dark ? "text-neutral-400" : "text-neutral-500"
                )}>
                  {new Date(Date.now() + (expirationHours * 60 * 60 * 1000)).toLocaleString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    dark 
                      ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700" 
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={amount <= 0 || isSubmitting}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors",
                    "bg-orange-600 hover:bg-orange-700",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-orange-300"
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
                "w-full max-w-sm rounded-lg shadow-xl border p-6",
                dark 
                  ? "bg-neutral-900 border-neutral-700" 
                  : "bg-white border-neutral-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={cn(
                "text-lg font-semibold mb-2",
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
                    "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    dark 
                      ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700" 
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAbortConfirm}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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