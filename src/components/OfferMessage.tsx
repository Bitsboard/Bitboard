"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface OfferMessageProps {
  offer: {
    id: string;
    amount_sat?: number;
    expires_at?: number;
    status?: string;
    from_id?: string; // For Message type compatibility
    from_user_id?: string; // For original offer type compatibility
    to_user_id?: string;
    created_at: number;
  };
  currentUserId: string;
  dark?: boolean;
  unit?: 'sats' | 'BTC';
  onAction?: (offerId: string, action: 'accept' | 'decline' | 'revoke') => void;
}

export default function OfferMessage({ 
  offer, 
  currentUserId, 
  dark = false, 
  unit = 'sats',
  onAction 
}: OfferMessageProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isFromCurrentUser = (offer.from_user_id || offer.from_id) === currentUserId;
  const isExpired = offer.expires_at && offer.expires_at < Math.floor(Date.now() / 1000);
  const isActive = offer.status === 'pending' && !isExpired;

  const formatAmount = (satoshis: number | undefined) => {
    if (!satoshis) return '0';
    
    if (unit === 'BTC') {
      const btc = satoshis / 1e8;
      return btc.toFixed(8).replace(/\.?0+$/, '');
    }
    
    return satoshis.toLocaleString();
  };

  const getAmountSymbol = () => {
    return unit === 'BTC' ? '₿' : 'sats';
  };

  const formatExpiration = (expiresAt: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = expiresAt - now;
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / 3600);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} left`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} left`;
    } else {
      const minutes = Math.floor(diff / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} left`;
    }
  };

  const getStatusColor = () => {
    switch (offer.status || 'pending') {
      case 'accepted':
        return 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300';
      case 'declined':
        return 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
      case 'revoked':
        return 'bg-gray-100 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-300';
      case 'expired':
        return 'bg-gray-100 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-300';
      default:
        return 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
    }
  };

  const getStatusText = () => {
    switch (offer.status || 'pending') {
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      case 'revoked':
        return 'Revoked';
      case 'expired':
        return 'Expired';
      default:
        return 'Pending';
    }
  };

  const handleAction = async (action: 'accept' | 'decline' | 'revoke') => {
    if (!onAction || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onAction(offer.id, action);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn(
      "max-w-sm mx-4 my-3 p-5 rounded-3xl shadow-lg border-2",
      isFromCurrentUser 
        ? "ml-auto bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 dark:from-orange-900/30 dark:to-orange-800/30 dark:border-orange-600" 
        : "mr-auto bg-gradient-to-br from-white to-neutral-50 border-neutral-300 dark:from-neutral-800 dark:to-neutral-700 dark:border-neutral-600",
      !isActive && "opacity-75"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shadow-md",
            isFromCurrentUser 
              ? "bg-gradient-to-br from-orange-500 to-orange-600" 
              : "bg-gradient-to-br from-neutral-500 to-neutral-600"
          )}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <span className={cn(
            "text-sm font-semibold tracking-wide",
            isFromCurrentUser 
              ? "text-orange-800 dark:text-orange-200" 
              : "text-neutral-800 dark:text-neutral-200"
          )}>
            Offer
          </span>
        </div>
        <div className={cn(
          "px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm",
          getStatusColor()
        )}>
          {getStatusText()}
        </div>
      </div>

      {/* Amount */}
      <div className="mb-4">
        <div className={cn(
          "text-3xl font-bold tracking-tight",
          isFromCurrentUser 
            ? "text-orange-900 dark:text-orange-100" 
            : "text-neutral-900 dark:text-neutral-100"
        )}>
          {unit === 'BTC' ? `${getAmountSymbol()}${formatAmount(offer.amount_sat)}` : `${formatAmount(offer.amount_sat)} ${getAmountSymbol()}`}
        </div>
        {offer.expires_at && (
          <div className={cn(
            "text-sm mt-2 font-medium",
            isFromCurrentUser 
              ? "text-orange-700 dark:text-orange-300" 
              : "text-neutral-600 dark:text-neutral-400"
          )}>
            ⏰ {formatExpiration(offer.expires_at)}
          </div>
        )}
      </div>

      {/* Actions */}
      {isActive && (
        <div className="flex gap-3">
          {isFromCurrentUser ? (
            // Offer sender can revoke
            <button
              onClick={() => handleAction('revoke')}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {isProcessing ? 'Aborting...' : 'Abort Offer'}
            </button>
          ) : (
            // Offer recipient can accept/decline
            <>
              <button
                onClick={() => handleAction('accept')}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {isProcessing ? 'Accepting...' : 'Accept'}
              </button>
              <button
                onClick={() => handleAction('decline')}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {isProcessing ? 'Declining...' : 'Decline'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
