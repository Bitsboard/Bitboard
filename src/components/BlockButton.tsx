"use client";

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/lib/settings';

interface BlockButtonProps {
  targetUserId: string;
  targetUsername: string;
  className?: string;
}

export function BlockButton({ targetUserId, targetUsername, className = "" }: BlockButtonProps) {
  const { user } = useSettings();
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  // Don't show block button for own profile
  if (!user || user.id === targetUserId) {
    return null;
  }

  // Check block status on mount
  useEffect(() => {
    const checkBlockStatus = async () => {
      try {
        const response = await fetch(`/api/users/block-status?targetUserId=${targetUserId}`);
        if (response.ok) {
          const data = await response.json();
          setIsBlocked(data.blockedByMe);
        }
      } catch (error) {
        console.error('Failed to check block status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkBlockStatus();
  }, [targetUserId]);

  const handleBlockToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const action = isBlocked ? 'unblock' : 'block';
      const response = await fetch('/api/users/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          action,
          reason: action === 'block' ? 'Blocked by user' : undefined
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsBlocked(!isBlocked);
          // Show success message
          alert(data.message);
        } else {
          alert(data.error || 'Failed to update block status');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update block status');
      }
    } catch (error) {
      console.error('Block/unblock error:', error);
      alert('Failed to update block status');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <button
        disabled
        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-white/20 text-white border border-white/30 ${className}`}
      >
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={handleBlockToggle}
      disabled={isLoading}
      className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 border ${
        isBlocked
          ? 'bg-green-500/20 text-green-100 border-green-400/50 hover:bg-green-500/30'
          : 'bg-red-500/20 text-red-100 border-red-400/50 hover:bg-red-500/30'
      } ${className}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {isBlocked ? 'Unblocking...' : 'Blocking...'}
        </>
      ) : (
        <>
          {isBlocked ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Unblock
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
              Block
            </>
          )}
        </>
      )}
    </button>
  );
}
