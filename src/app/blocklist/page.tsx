"use client";

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/lib/settings';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface BlockedUser {
  block_id: string;
  blocked_id: string;
  created_at: number;
  reason?: string;
  username: string;
  email: string;
  image?: string;
  verified: boolean;
  thumbs_up: number;
  deals: number;
}

export default function BlockListPage() {
  const { user } = useSettings();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setError('Please log in to view your block list');
      setIsLoading(false);
      return;
    }

    loadBlockedUsers();
  }, [user]);

  const loadBlockedUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/blocklist');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBlockedUsers(data.blockedUsers || []);
        } else {
          setError(data.error || 'Failed to load block list');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load block list');
      }
    } catch (error) {
      console.error('Error loading blocked users:', error);
      setError('Failed to load block list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (blockedUserId: string, username: string) => {
    if (!confirm(`Are you sure you want to unblock ${username}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/users/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: blockedUserId,
          action: 'unblock'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Remove from local state
          setBlockedUsers(prev => prev.filter(u => u.blocked_id !== blockedUserId));
          alert(data.message);
        } else {
          alert(data.error || 'Failed to unblock user');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to unblock user');
      }
    } catch (error) {
      console.error('Unblock error:', error);
      alert('Failed to unblock user');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Login Required</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Please log in to view your block list.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading block list...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Error</h1>
          <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
          <button
            onClick={loadBlockedUsers}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Blocked Users</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Manage users you have blocked. Blocked users cannot see your listings, send you messages, or reply to your listings.
          </p>
        </div>

        {/* Block List */}
        {blockedUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">No Blocked Users</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You haven't blocked any users yet. Block users from their profile pages.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {blockedUsers.map((blockedUser) => (
              <div
                key={blockedUser.block_id}
                className={`p-6 rounded-lg border ${
                  dark 
                    ? 'bg-neutral-800 border-neutral-700' 
                    : 'bg-white border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {blockedUser.image ? (
                        <img
                          src={blockedUser.image}
                          alt={`${blockedUser.username}'s avatar`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold">
                          {blockedUser.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                          {blockedUser.username}
                        </h3>
                        {blockedUser.verified && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                        {blockedUser.email}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                        <span>{blockedUser.thumbs_up} reputation</span>
                        <span>{blockedUser.deals} deals</span>
                        <span>Blocked on {formatDate(blockedUser.created_at)}</span>
                      </div>
                      {blockedUser.reason && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          Reason: {blockedUser.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Unblock Button */}
                  <button
                    onClick={() => handleUnblock(blockedUser.blocked_id, blockedUser.username)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    Unblock
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className={`mt-8 p-4 rounded-lg ${
          dark ? 'bg-neutral-800 border border-neutral-700' : 'bg-neutral-50 border border-neutral-200'
        }`}>
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">About Blocking</h3>
          <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
            <li>• Blocked users cannot see your listings or profile</li>
            <li>• Blocked users cannot send you messages or reply to your listings</li>
            <li>• You cannot see listings from users you have blocked</li>
            <li>• You can unblock users at any time from this page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
