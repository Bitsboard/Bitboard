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

  const formatBTCAmount = (amount: number) => {
    return (amount / 100000000).toFixed(8);
  };

  const handleAmountChange = (value: string) => {
    const newAmount = parseAmount(value);
    
    // If listing price exists and new amount exceeds it, revert to listing price
    if (listingPrice && listingPrice > 0 && newAmount > listingPrice) {
      setAmount(listingPrice);
    } else {
      setAmount(newAmount);
    }
  };

  const handleSliderChange = (value: number) => {
    setAmount(value);
  };

  const getSliderSteps = () => {
    if (!listingPrice || listingPrice <= 0) return [];
    
    const steps = [];
    const stepCount = 10; // 10 steps from 0 to listing price
    const stepSize = listingPrice / stepCount;
    
    for (let i = 0; i <= stepCount; i++) {
      steps.push(Math.round(i * stepSize));
    }
    
    return steps;
  };

  const getSliderValue = () => {
    if (!listingPrice || listingPrice <= 0) return 0;
    return Math.min(amount, listingPrice);
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
      {/* Custom Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
        }
      `}</style>
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={cn(
            "w-full max-w-md rounded-2xl shadow-2xl border-2 overflow-hidden",
            dark 
              ? "bg-gradient-to-br from-neutral-900 to-neutral-800 border-neutral-700" 
              : "bg-gradient-to-br from-white to-neutral-50 border-neutral-200"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn(
            "px-6 py-5 bg-gradient-to-r",
            dark 
              ? "from-orange-500/10 to-orange-600/10 border-b border-orange-500/20" 
              : "from-orange-50 to-orange-100 border-b border-orange-200"
          )}>
            <div>
              <h2 className={cn(
                "text-xl font-bold",
                dark ? "text-white" : "text-neutral-900"
              )}>
                {existingOffer ? "Your Offer" : "Make an Offer"}
              </h2>
              <p className={cn(
                "text-sm",
                dark ? "text-orange-200" : "text-orange-600"
              )}>
                {existingOffer ? "Current offer details" : "Set your offer amount and expiration"}
              </p>
            </div>
          </div>

          {/* Content */}
          {existingOffer ? (
            // Show existing offer details
            <div className="p-6">
              <div className="text-center space-y-6">
                {/* Offer Amount */}
                <div className={cn(
                  "p-6 rounded-xl border-2",
                  existingOffer.status === 'pending' 
                    ? "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 dark:from-orange-900/20 dark:to-orange-800/20 dark:border-orange-500/50"
                    : "bg-gradient-to-br from-neutral-50 to-neutral-100 border-neutral-300 dark:from-neutral-800/20 dark:to-neutral-700/20 dark:border-neutral-600"
                )}>
                  <div className={cn(
                    "text-3xl font-black mb-2",
                    existingOffer.status === 'pending' 
                      ? "text-orange-900 dark:text-orange-100" 
                      : "text-neutral-900 dark:text-neutral-100"
                  )}>
                    {unit === 'BTC' ? `₿${formatAmount(existingOffer.amount_sat)}` : `${formatAmount(existingOffer.amount_sat)} sats`}
                  </div>
                  <div className={cn(
                    "text-sm font-bold px-4 py-2 rounded-full inline-block",
                    existingOffer.status === 'pending' 
                      ? "bg-orange-500 text-white"
                      : "bg-neutral-500 text-white"
                  )}>
                    {existingOffer.status === 'pending' ? 'PENDING' : existingOffer.status.toUpperCase()}
                  </div>
                </div>
                
                {/* Expiration */}
                {existingOffer.expires_at && (
                  <div className={cn(
                    "p-4 rounded-lg border",
                    dark ? "bg-neutral-800/50 border-neutral-700" : "bg-neutral-100 border-neutral-200"
                  )}>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <div className={cn(
                        "text-sm font-medium",
                        dark ? "text-neutral-300" : "text-neutral-600"
                      )}>
                        Expires {new Date(existingOffer.expires_at * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2",
                    dark 
                      ? "bg-neutral-800 border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:border-orange-400 hover:text-white" 
                      : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200 hover:border-orange-300 hover:text-neutral-900"
                  )}
                >
                  Close
                </button>
                {existingOffer.status === 'pending' && onAbortOffer && (
                  <button
                    type="button"
                    onClick={() => setShowAbortConfirm(true)}
                    className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 border-2 bg-gradient-to-r from-red-500 to-red-600 border-red-500 hover:from-red-600 hover:to-red-700 hover:border-red-600 hover:shadow-lg hover:shadow-red-500/25"
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
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Amount Section */}
              <div className="space-y-4">
                {/* Amount Display */}
                <div className="text-center">
                  <div className={cn(
                    "text-4xl font-black mb-2",
                    dark ? "text-white" : "text-neutral-900"
                  )}>
                    {unit === "BTC" ? `₿${formatAmount(amount)}` : `${formatAmount(amount)} sats`}
                  </div>
                  {listingPrice && listingPrice > 0 && (
                    <div className={cn(
                      "text-sm font-medium",
                      dark ? "text-orange-400" : "text-orange-600"
                    )}>
                      {Math.round((amount / listingPrice) * 100)}% of asking price
                    </div>
                  )}
                </div>

                {/* Slider for items with asking price */}
                {listingPrice && listingPrice > 0 ? (
                  <div className="space-y-4">
                    <div className="relative pt-6">
                      {/* Pin Icon positioned above slider */}
                      <div 
                        className="absolute -top-6 transform -translate-x-1/2 z-10 transition-all duration-200 ease-out"
                        style={{
                          left: `${(getSliderValue() / listingPrice) * 100}%`
                        }}
                      >
                        <div className="relative group">
                          <img 
                            src="/Bitsbarterlogo.svg" 
                            alt="Pin" 
                            className="w-6 h-6 drop-shadow-lg transition-transform duration-200 group-hover:scale-110"
                          />
                          {/* Small triangle pointing down to slider */}
                          <div 
                            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 transition-all duration-200"
                            style={{
                              borderLeft: '4px solid transparent',
                              borderRight: '4px solid transparent',
                              borderTop: '6px solid #f97316'
                            }}
                          />
                        </div>
                      </div>
                      
                      <input
                        type="range"
                        min="0"
                        max={listingPrice}
                        step={Math.round(listingPrice / 20)}
                        value={getSliderValue()}
                        onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #f97316 0%, #f97316 ${(getSliderValue() / listingPrice) * 100}%, #e5e7eb ${(getSliderValue() / listingPrice) * 100}%, #e5e7eb 100%)`,
                          animation: getSliderValue() > 0 ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                        }}
                      />
                      <div className="flex justify-between text-xs mt-2">
                        <span className={cn(
                          "font-medium",
                          dark ? "text-neutral-400" : "text-neutral-500"
                        )}>
                          0
                        </span>
                        <span className={cn(
                          "font-medium",
                          dark ? "text-neutral-400" : "text-neutral-500"
                        )}>
                          {unit === "BTC" ? `₿${formatAmount(listingPrice)}` : `${formatAmount(listingPrice)} sats`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Manual input for items without asking price */
                  <div className="relative">
                    <input
                      type="text"
                      value={unit === "BTC" ? formatBTCAmount(amount) : formatAmount(amount)}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder={unit === "BTC" ? "0.00000000" : "0"}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border-2 text-lg font-medium text-center",
                        "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
                        dark 
                          ? "bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400" 
                          : "bg-white border-neutral-300 text-neutral-900 placeholder-neutral-500"
                      )}
                      maxLength={unit === "BTC" ? 15 : 10}
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
                )}
              </div>

              {/* Expiration Section */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className={cn(
                    "text-lg font-bold mb-1",
                    dark ? "text-white" : "text-neutral-900"
                  )}>
                    Offer Expiration
                  </h3>
                  <p className={cn(
                    "text-sm",
                    dark ? "text-neutral-400" : "text-neutral-600"
                  )}>
                    How long should this offer remain valid?
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[24, 12, 4, 1].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setExpirationHours(hours)}
                      className={cn(
                        "px-3 py-3 rounded-xl border-2 font-medium transition-all duration-200",
                        expirationHours === hours
                          ? "bg-orange-500 border-orange-500 text-white shadow-lg"
                          : cn(
                              "border-neutral-300 dark:border-neutral-600",
                              dark 
                                ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:border-orange-400" 
                                : "bg-white text-neutral-700 hover:bg-orange-50 hover:border-orange-300"
                            )
                      )}
                    >
                      <div className="text-sm font-bold">{hours}h</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2",
                    dark 
                      ? "bg-neutral-800 border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:border-orange-400 hover:text-white" 
                      : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200 hover:border-orange-300 hover:text-neutral-900"
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={amount <= 0 || isSubmitting}
                  className={cn(
                    "flex-1 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 border-2",
                    "bg-gradient-to-r from-orange-500 to-orange-600 border-orange-500",
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
                  ? "bg-gradient-to-br from-neutral-900 to-neutral-800 border-red-500/30" 
                  : "bg-gradient-to-br from-white to-neutral-50 border-red-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className={cn(
                  "text-xl font-bold mb-2",
                  dark ? "text-white" : "text-neutral-900"
                )}>
                  Abort Offer?
                </h3>
                <p className={cn(
                  "text-sm",
                  dark ? "text-neutral-300" : "text-neutral-600"
                )}>
                  Are you sure you want to abort this offer? This action cannot be undone.
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowAbortConfirm(false)}
                  className={cn(
                    "flex-1 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2",
                    dark 
                      ? "bg-neutral-800 border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:border-orange-400 hover:text-white" 
                      : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200 hover:border-orange-300 hover:text-neutral-900"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAbortConfirm}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 border-2 bg-gradient-to-r from-red-500 to-red-600 border-red-500 hover:from-red-600 hover:to-red-700 hover:border-red-600 hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Aborting...</span>
                    </div>
                  ) : (
                    "Abort"
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