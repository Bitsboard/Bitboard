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
  onAction?: (offerId: string, action: 'accept' | 'decline' | 'revoke') => void;
}

export default function OfferMessage({ 
  offer, 
  currentUserId, 
  dark = false, 
  onAction 
}: OfferMessageProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isFromCurrentUser = (offer.from_user_id || offer.from_id) === currentUserId;
  const isExpired = offer.expires_at && offer.expires_at < Math.floor(Date.now() / 1000);
  const isActive = offer.status === 'pending' && !isExpired;

  const formatAmount = (satoshis: number | undefined) => {
    return (satoshis || 0).toLocaleString();
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
      "max-w-xs mx-4 my-2 p-4 rounded-2xl border-2",
      isFromCurrentUser 
        ? "ml-auto bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800" 
        : "mr-auto bg-white border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700",
      !isActive && "opacity-75"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <span className={cn(
            "text-sm font-medium",
            isFromCurrentUser 
              ? "text-orange-800 dark:text-orange-300" 
              : "text-neutral-800 dark:text-neutral-200"
          )}>
            Offer
          </span>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          getStatusColor()
        )}>
          {getStatusText()}
        </div>
      </div>

      {/* Amount */}
      <div className="mb-3">
        <div className={cn(
          "text-2xl font-bold",
          isFromCurrentUser 
            ? "text-orange-900 dark:text-orange-100" 
            : "text-neutral-900 dark:text-neutral-100"
        )}>
          {formatAmount(offer.amount_sat)} sats
        </div>
        {offer.expires_at && (
          <div className={cn(
            "text-sm mt-1",
            isFromCurrentUser 
              ? "text-orange-700 dark:text-orange-300" 
              : "text-neutral-600 dark:text-neutral-400"
          )}>
            {formatExpiration(offer.expires_at)}
          </div>
        )}
      </div>

      {/* Actions */}
      {isActive && (
        <div className="flex gap-2">
          {isFromCurrentUser ? (
            // Offer sender can revoke
            <button
              onClick={() => handleAction('revoke')}
              disabled={isProcessing}
              className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Revoking...' : 'Revoke'}
            </button>
          ) : (
            // Offer recipient can accept/decline
            <>
              <button
                onClick={() => handleAction('accept')}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Accepting...' : 'Accept'}
              </button>
              <button
                onClick={() => handleAction('decline')}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
