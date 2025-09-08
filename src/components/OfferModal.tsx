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
            "w-full max-w-md rounded-2xl shadow-2xl border-2",
            dark 
              ? "bg-neutral-900 border-orange-500/30" 
              : "bg-white border-orange-200"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn(
            "px-6 py-4 border-b bg-gradient-to-r",
            dark 
              ? "border-orange-500/30 from-orange-500/10 to-orange-600/10" 
              : "border-orange-200 from-orange-50 to-orange-100"
          )}>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <h2 className={cn(
                "text-lg font-bold",
                dark ? "text-white" : "text-neutral-900"
              )}>
                {existingOffer ? "Your Offer" : "Make an Offer"}
              </h2>
            </div>
          </div>

          {/* Content */}
          {existingOffer ? (
            // Show existing offer details
            <div className="p-6 space-y-5">
              {/* Offer Details */}
              <div className="space-y-4">
                <div className={cn(
                  "p-5 rounded-xl border-2 bg-gradient-to-br",
                  existingOffer.status === 'pending' 
                    ? "from-orange-50 to-orange-100 border-orange-300 dark:from-orange-900/20 dark:to-orange-800/20 dark:border-orange-500/50"
                    : "from-neutral-50 to-neutral-100 border-neutral-300 dark:from-neutral-800/20 dark:to-neutral-700/20 dark:border-neutral-600"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        existingOffer.status === 'pending' ? "bg-orange-500" : "bg-neutral-500"
                      )}></div>
                      <span className={cn(
                        "text-sm font-bold",
                        existingOffer.status === 'pending' 
                          ? "text-orange-800 dark:text-orange-200" 
                          : "text-neutral-800 dark:text-neutral-200"
                      )}>
                        {existingOffer.status === 'pending' ? 'Pending Offer' : 'Offer Status: ' + existingOffer.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className={cn(
                      "text-3xl font-black",
                      existingOffer.status === 'pending' 
                        ? "text-orange-900 dark:text-orange-100" 
                        : "text-neutral-900 dark:text-neutral-100"
                    )}>
                      {unit === 'BTC' ? `₿${formatAmount(existingOffer.amount_sat)}` : `${formatAmount(existingOffer.amount_sat)} sats`}
                    </div>
                    
                    {existingOffer.expires_at && (
                      <div className="flex items-center space-x-2">
                        <span className="text-orange-500">⏰</span>
                        <div className={cn(
                          "text-sm font-semibold",
                          existingOffer.status === 'pending' 
                            ? "text-orange-700 dark:text-orange-300" 
                            : "text-neutral-600 dark:text-neutral-400"
                        )}>
                          Expires: {new Date(existingOffer.expires_at * 1000).toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 rounded-full bg-neutral-400"></div>
                      <div className={cn(
                        "text-xs font-medium",
                        existingOffer.status === 'pending' 
                          ? "text-orange-600 dark:text-orange-400" 
                          : "text-neutral-500 dark:text-neutral-500"
                      )}>
                        Created: {new Date(existingOffer.created_at * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2",
                    dark 
                      ? "bg-neutral-800 border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:border-orange-500/50 hover:text-white" 
                      : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200 hover:border-orange-300 hover:text-neutral-900"
                  )}
                >
                  Close
                </button>
                {existingOffer.status === 'pending' && onAbortOffer && (
                  <button
                    type="button"
                    onClick={() => setShowAbortConfirm(true)}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 border-2 bg-gradient-to-r from-red-500 to-red-600 border-red-500 hover:from-red-600 hover:to-red-700 hover:border-red-600 hover:shadow-lg hover:shadow-red-500/25"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>⚠️</span>
                      <span>Abort Offer</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Show new offer form
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Amount Input */}
              <div className="space-y-3">
                <label className={cn(
                  "block text-sm font-semibold",
                  dark ? "text-neutral-200" : "text-neutral-800"
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
                      "w-full px-4 py-3 rounded-xl border-2 text-lg font-bold transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
                      dark 
                        ? "bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400 hover:border-orange-500/50" 
                        : "bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500 hover:border-orange-300"
                    )}
                    maxLength={unit === "BTC" ? 12 : 10}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className={cn(
                      "text-sm font-bold",
                      dark ? "text-orange-400" : "text-orange-600"
                    )}>
                      {unit === "BTC" ? "₿" : "sats"}
                    </span>
                  </div>
                </div>
                {listingPrice && listingPrice > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                    <p className={cn(
                      "text-xs font-medium",
                      dark ? "text-neutral-400" : "text-neutral-600"
                    )}>
                      Listing price: {unit === "BTC" ? `₿${formatAmount(listingPrice)}` : `${formatAmount(listingPrice)} sats`}
                    </p>
                  </div>
                )}
              </div>

              {/* Expiration Time (Required) - Compact Layout */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={cn(
                    "text-sm font-semibold flex items-center space-x-2",
                    dark ? "text-neutral-200" : "text-neutral-800"
                  )}>
                    <span>⏰</span>
                    <span>Offer expires in</span>
                  </label>
                  <select
                    value={expirationHours}
                    onChange={(e) => setExpirationHours(parseInt(e.target.value))}
                    className={cn(
                      "px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
                      "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 text-orange-800",
                      "dark:from-orange-900/30 dark:to-orange-800/30 dark:border-orange-500/50 dark:text-orange-200"
                    )}
                  >
                    <option value={1}>1 hour</option>
                    <option value={4}>4 hours</option>
                    <option value={12}>12 hours</option>
                    <option value={24}>24 hours</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                  <p className={cn(
                    "text-xs font-medium",
                    dark ? "text-neutral-400" : "text-neutral-600"
                  )}>
                    Expires: {new Date(Date.now() + (expirationHours * 60 * 60 * 1000)).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2",
                    dark 
                      ? "bg-neutral-800 border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:border-orange-500/50 hover:text-white" 
                      : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200 hover:border-orange-300 hover:text-neutral-900"
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={amount <= 0 || isSubmitting}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2",
                    "bg-gradient-to-r from-orange-500 to-orange-600 border-orange-500 text-white",
                    "hover:from-orange-600 hover:to-orange-700 hover:border-orange-600 hover:shadow-lg hover:shadow-orange-500/25",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:from-orange-300 disabled:to-orange-400 disabled:border-orange-300 disabled:shadow-none"
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>🚀</span>
                      <span>Send Offer</span>
                    </div>
                  )}
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
                "w-full max-w-sm rounded-2xl shadow-2xl border-2 p-6",
                dark 
                  ? "bg-neutral-900 border-red-500/30" 
                  : "bg-white border-red-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <h3 className={cn(
                  "text-lg font-bold",
                  dark ? "text-white" : "text-neutral-900"
                )}>
                  Abort Offer?
                </h3>
              </div>
              <p className={cn(
                "text-sm mb-6 font-medium",
                dark ? "text-neutral-300" : "text-neutral-600"
              )}>
                Are you sure you want to abort this offer? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAbortConfirm(false)}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2",
                    dark 
                      ? "bg-neutral-800 border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:border-orange-500/50 hover:text-white" 
                      : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200 hover:border-orange-300 hover:text-neutral-900"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAbortConfirm}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 border-2 bg-gradient-to-r from-red-500 to-red-600 border-red-500 hover:from-red-600 hover:to-red-700 hover:border-red-600 hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Aborting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>⚠️</span>
                      <span>Abort</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}