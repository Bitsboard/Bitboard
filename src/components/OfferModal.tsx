"use client";

import { useState, useEffect } from "react";
import { cn, formatBTCFromSats, formatCADAmount, satsToFiat } from "@/lib/utils";
import { useBtcRate } from "@/lib/contexts/BtcRateContext";
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
  const [rawInput, setRawInput] = useState<string>(""); // Track raw input for BTC
  const [expirationHours, setExpirationHours] = useState(24); // Default to 24 hours
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);
  
  // Min/Max limits
  const MIN_SATS = 1; // 0.00000001 BTC
  const MAX_SATS = 999999999; // 9.99999999 BTC
  const MIN_BTC = 0.00000001;
  const MAX_BTC = 9.99999999;
  
  // Get BTC rate for dollar equivalent
  const btcRate = useBtcRate();

  // Set default amount to listing price when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingOffer) {
        // Show existing offer
        setAmount(existingOffer.amount_sat);
        if (unit === "BTC") {
          setRawInput(formatBTCDisplay(existingOffer.amount_sat));
        } else {
          setRawInput(formatAmount(existingOffer.amount_sat));
        }
        // Set expiration hours from existing offer
        if (existingOffer.expires_at) {
          const now = Math.floor(Date.now() / 1000);
          const hoursLeft = Math.max(1, Math.ceil((existingOffer.expires_at - now) / 3600));
          setExpirationHours(hoursLeft);
        }
      } else if (listingPrice && listingPrice > 0) {
        // New offer with listing price
      setAmount(listingPrice);
        if (unit === "BTC") {
          setRawInput(formatBTCDisplay(listingPrice));
        } else {
          setRawInput(formatAmount(listingPrice));
        }
        setExpirationHours(24); // Reset to 24 hours default
      } else {
        // New offer without listing price
        setAmount(MIN_SATS);
        setRawInput(unit === "BTC" ? "0.00000000" : "1");
        setExpirationHours(24);
      }
    }
  }, [isOpen, listingPrice, unit, existingOffer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount < MIN_SATS || amount > MAX_SATS) {
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

  // Parse abbreviations (k, m) for sats
  const parseAbbreviations = (value: string) => {
    if (unit !== "sats") return value;
    
    const cleanValue = value.toLowerCase().trim();
    const match = cleanValue.match(/^([\d.]+)([km])?$/);
    
    if (!match) return value;
    
    const [, number, suffix] = match;
    const num = parseFloat(number);
    
    if (isNaN(num)) return value;
    
    switch (suffix) {
      case 'k': return (num * 1000).toString();
      case 'm': return (num * 1000000).toString();
      default: return number;
    }
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

  // Format BTC for display without forcing 8 decimals
  const formatBTCDisplay = (amount: number) => {
    const btc = amount / 100000000;
    // If it's a whole number, don't show decimals
    if (btc % 1 === 0) {
      return btc.toString();
    }
    // Otherwise show up to 8 decimals, removing trailing zeros
    return btc.toFixed(8).replace(/\.?0+$/, '');
  };

  const handleAmountChange = (value: string) => {
    // Parse abbreviations for sats
    const parsedValue = parseAbbreviations(value);
    
    // Update raw input
    setRawInput(parsedValue);
    
    const newAmount = parseAmount(parsedValue);
    
    // Validate min/max limits
    if (newAmount < MIN_SATS) {
      setAmount(MIN_SATS);
      setRawInput(unit === "BTC" ? "0.00000000" : "1");
      return;
    }
    
    if (newAmount > MAX_SATS) {
      setAmount(MAX_SATS);
      setRawInput(unit === "BTC" ? "9.99999999" : "999,999,999");
      return;
    }
    
    // If listing price exists and new amount exceeds it, revert to listing price
    if (listingPrice && listingPrice > 0 && newAmount > listingPrice) {
      setAmount(listingPrice);
      if (unit === "BTC") {
        setRawInput(formatBTCDisplay(listingPrice));
      } else {
        setRawInput(formatAmount(listingPrice));
      }
    } else {
      setAmount(newAmount);
    }
  };

  const handleSliderChange = (value: number) => {
    setAmount(value);
    if (unit === "BTC") {
      setRawInput(formatBTCDisplay(value));
    } else {
      setRawInput(formatAmount(value));
    }
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
    <div>
      {/* Modal with backdrop */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
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
            "px-6 py-5 flex items-center justify-between",
            dark 
              ? "bg-neutral-900 border-b border-neutral-800" 
              : "bg-white border-b border-neutral-200"
          )}>
            <div>
            <h2 className={cn(
                "text-xl font-bold",
              dark ? "text-white" : "text-neutral-900"
            )}>
              {existingOffer ? "Your Offer" : "Make an Offer"}
            </h2>
              {existingOffer && (
                <p className={cn(
                  "text-sm",
                  dark ? "text-orange-200" : "text-orange-600"
                )}>
                  Current offer details
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
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
                    {btcRate && (
                      <div className={cn(
                        "text-sm font-normal mt-1",
                        dark ? "text-neutral-400" : "text-neutral-500"
                      )}>
                        {formatCADAmount(satsToFiat(amount, btcRate))}
                      </div>
                    )}
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
                    <div className="relative pt-3">
                      {/* Pin Icon positioned above slider */}
                      <div 
                        className="absolute -top-2 transform -translate-x-1/2 z-20 transition-all duration-200 ease-out"
                        style={{
                          left: `${Math.min(Math.max((getSliderValue() / listingPrice) * 100, 0), 100)}%`
                        }}
                      >
                        <div className="relative group flex-shrink-0">
                          <img 
                            src="/Bitsbarterlogo.svg" 
                            alt="Pin" 
                            className="w-[28px] h-[28px] min-w-[28px] min-h-[28px] drop-shadow-lg transition-transform duration-200 group-hover:scale-110 cursor-pointer flex-shrink-0"
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              // Get the slider input
                              const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
                              if (slider) {
                                // Calculate the position relative to the slider
                                const rect = slider.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const percentage = x / rect.width;
                                
                                // Snap to 5% increments
                                const snappedPercentage = Math.round(percentage * 20) / 20; // 20 steps = 5% each
                                const newValue = Math.round(snappedPercentage * listingPrice);
                                const clampedValue = Math.max(0, Math.min(newValue, listingPrice));
                                
                                // Update the slider value
                                slider.value = clampedValue.toString();
                                handleSliderChange(clampedValue);
                                
                                // Add mouse move and mouse up listeners for dragging
                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                  const newX = moveEvent.clientX - rect.left;
                                  const newPercentage = newX / rect.width;
                                  
                                  // Snap to 5% increments
                                  const newSnappedPercentage = Math.round(newPercentage * 20) / 20;
                                  const newClampedValue = Math.max(0, Math.min(Math.round(newSnappedPercentage * listingPrice), listingPrice));
                                  
                                  slider.value = newClampedValue.toString();
                                  handleSliderChange(newClampedValue);
                                };
                                
                                const handleMouseUp = () => {
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }
                            }}
                          />
                        </div>
              </div>

                      <div className="relative h-2">
                        {/* Background track - clickable */}
                        <div 
                          className="slider-track cursor-pointer"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const percentage = x / rect.width;
                            const snappedPercentage = Math.round(percentage * 20) / 20; // Snap to 5% increments
                            const newValue = Math.round(snappedPercentage * listingPrice);
                            const clampedValue = Math.max(0, Math.min(newValue, listingPrice));
                            handleSliderChange(clampedValue);
                          }}
                        ></div>
                        {/* Animated fill */}
                        <div 
                          className={`slider-fill ${getSliderValue() >= listingPrice ? 'max' : ''} cursor-pointer`}
                          style={{
                            width: `${Math.min(Math.max((getSliderValue() / listingPrice) * 100, 0), 100)}%`
                          }}
                          onClick={(e) => {
                            const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                            if (!rect) return;
                            const x = e.clientX - rect.left;
                            const percentage = x / rect.width;
                            const snappedPercentage = Math.round(percentage * 20) / 20; // Snap to 5% increments
                            const newValue = Math.round(snappedPercentage * listingPrice);
                            const clampedValue = Math.max(0, Math.min(newValue, listingPrice));
                            handleSliderChange(clampedValue);
                          }}
                        ></div>
                        {/* Invisible slider input */}
                        <input
                          type="range"
                          min="0"
                          max={listingPrice}
                          step={Math.round(listingPrice / 20)}
                          value={getSliderValue()}
                          onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer slider animated-slider absolute top-0 left-0 opacity-0 z-0"
                        />
                      </div>
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
                  <div>
                    {unit === "BTC" ? (
                  /* Special BTC input with always visible 9 digits */
                  <div className="relative">
                    <div className={cn(
                      "w-full px-6 py-4 rounded-2xl border-2 text-xl font-mono text-center transition-all duration-200",
                      "focus-within:outline-none focus-within:ring-4 focus-within:ring-orange-500/20 focus-within:border-orange-500",
                      "border-neutral-200 dark:border-neutral-700",
                      "shadow-sm hover:shadow-md focus-within:shadow-lg",
                      dark 
                        ? "bg-neutral-900" 
                        : "bg-white"
                    )}>
                      {/* Visual display of BTC amount with 9 digits */}
                      <div className="flex items-center justify-center gap-1">
                        {/* Integer part */}
                        <span className={cn(
                          "text-xl font-semibold",
                          dark ? "text-white" : "text-neutral-900"
                        )}>
                          {rawInput.split('.')[0] || '0'}
                        </span>
                        
                        {/* Decimal point */}
                        <span className={cn(
                          "text-xl font-semibold",
                          dark ? "text-white" : "text-neutral-900"
                        )}>
                          .
                        </span>
                        
                        {/* 8 decimal places with significance highlighting */}
                        <div className="flex">
                          {[0,1,2,3,4,5,6,7].map((i) => {
                            const decimalPart = rawInput.split('.')[1] || '';
                            const digit = decimalPart[i] || '0';
                            
                            // Find the last non-zero digit to determine significance
                            const lastNonZeroIndex = decimalPart.split('').reverse().findIndex(d => d !== '0');
                            const isSignificant = lastNonZeroIndex === -1 || i <= (decimalPart.length - 1 - lastNonZeroIndex);
                            
                            return (
                              <span 
                                key={i}
                                className={cn(
                                  "text-xl font-semibold transition-colors duration-150",
                                  isSignificant
                                    ? dark ? "text-white" : "text-neutral-900"
                                    : dark ? "text-neutral-500" : "text-neutral-400"
                                )}
                              >
                                {digit}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Hidden input for actual interaction */}
                      <input
                        type="text"
                        value={rawInput}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-text font-mono"
                        inputMode="decimal"
                        pattern="[0-9]*\\.?[0-9]*"
                        style={{ caretColor: 'transparent' }}
                        onKeyDown={(e) => {
                          // Prevent backspace when at minimum value
                          if (e.key === 'Backspace' && rawInput === '0.00000000') {
                            e.preventDefault();
                          }
                        }}
                      />
                    </div>
                    
                    {/* Bitcoin symbol */}
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <span className={cn(
                        "text-lg font-bold",
                        dark ? "text-orange-400" : "text-orange-600"
                      )}>
                        ₿
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Regular sats input with abbreviations */
                  <div className="relative">
                    <input
                      type="text"
                      value={rawInput}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="1"
                      className={cn(
                        "w-full px-6 py-4 rounded-2xl border-2 text-xl font-semibold text-center transition-all duration-200",
                        "focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500",
                        "border-neutral-200 dark:border-neutral-700",
                        "shadow-sm hover:shadow-md focus:shadow-lg",
                        dark 
                          ? "bg-neutral-900 text-white placeholder-neutral-500" 
                          : "bg-white text-neutral-900 placeholder-neutral-400"
                      )}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={15}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <span className={cn(
                        "text-lg font-bold",
                        dark ? "text-orange-400" : "text-orange-600"
                      )}>
                        sats
                      </span>
                    </div>
                  </div>
                )}
                  </div>
                )}
              </div>

              {/* Expiration Section */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className={cn(
                      "text-lg font-bold",
                      dark ? "text-white" : "text-neutral-900"
                    )}>
                      Offer Expiration
                    </h3>
                    <div className="relative group">
                      <div className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center cursor-help",
                        dark ? "bg-neutral-700 text-neutral-400" : "bg-neutral-200 text-neutral-600"
                      )}>
                        <span className="text-xs font-bold">i</span>
                      </div>
                      <div className={cn(
                        "fixed px-3 py-2 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
                        "bg-black text-white shadow-lg",
                        "z-[9999]"
                      )} style={{
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        maxWidth: '300px',
                        whiteSpace: 'normal'
                      }}>
                        Your offer will remain valid until the expiration timer runs out, until you revoke your offer, or if the other user accepts/declines it.
                      </div>
                    </div>
                  </div>
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
          <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAbortConfirm(false)}
        >
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
      )}
    </div>
  );
}