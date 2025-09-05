import React from 'react';
import { cn } from '@/lib/utils';
import type { Listing, User } from '@/lib/types';

interface ChatHeaderProps {
  listing: Listing;
  otherUser: User;
  onClose: () => void;
  dark: boolean;
  btcCad: number;
  unit: 'sats' | 'cad';
}

export function ChatHeader({ listing, otherUser, onClose, dark, btcCad, unit }: ChatHeaderProps) {
  const formatPrice = (priceSats: number) => {
    if (unit === 'sats') {
      return `${priceSats.toLocaleString()} sats`;
    } else {
      const priceCad = (priceSats / 100000000) * btcCad;
      return `$${priceCad.toFixed(2)} CAD`;
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-4 border-b",
      dark ? "border-neutral-700 bg-neutral-800" : "border-neutral-200 bg-white"
    )}>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {otherUser.handle?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div>
          <h3 className={cn(
            "font-semibold text-sm",
            dark ? "text-white" : "text-neutral-900"
          )}>
            {otherUser.handle || 'Unknown User'}
          </h3>
          <p className={cn(
            "text-xs",
            dark ? "text-neutral-400" : "text-neutral-500"
          )}>
            {listing.title}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <p className={cn(
            "text-sm font-semibold",
            dark ? "text-white" : "text-neutral-900"
          )}>
            {formatPrice(listing.price_sat)}
          </p>
          <p className={cn(
            "text-xs",
            dark ? "text-neutral-400" : "text-neutral-500"
          )}>
            {listing.pricing_type === 'fixed' ? 'Fixed Price' : 'Make Offer'}
          </p>
        </div>
        
        <button
          onClick={onClose}
          className={cn(
            "p-2 rounded-full transition-colors",
            dark 
              ? "hover:bg-neutral-700 text-neutral-400 hover:text-white" 
              : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700"
          )}
          aria-label="Close chat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
