"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PrimaryButton } from "@/components/ui/Button";

interface AdminStats {
  users: {
    total: number;
    verified: number;
    admin: number;
    banned: number;
    new7d: number;
    new30d: number;
  };
  listings: {
    total: number;
    active: number;
    sold: number;
    new7d: number;
    new30d: number;
    avgPriceSats: number;
    totalValueActive: number;
  };
  conversations: {
    total: number;
    messages: number;
    unread: number;
    new7d: number;
    new30d: number;
  };
  recentActivity: Array<{
    type: string;
    username: string;
    user_id: string; // Now 8 alphanumeric characters
    email: string;
    action: string;
    timestamp: number;
    listing_title: string | null;
    listing_id: string | null; // Now 10 alphanumeric characters
    other_username: string | null;
    other_user_id: string | null; // Now 8 alphanumeric characters or null
    chat_id: string | null; // Now 10 alphanumeric characters
    message_count?: number; // Added for message activity
    offer_amount?: number; // Added for offer activity
    offer_expires_at?: number; // Added for offer expiration
    offer_status?: string; // Added for offer status
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ActivityItem {
  type: 'user_joined' | 'listing_created' | 'chat_started' | 'escrow_proposed';
  timestamp: number;
  user_id: string; // Now 8 alphanumeric characters
  username: string;
  listing_id: string | null; // Now 10 alphanumeric characters or null
  listing_title: string | null;
  chat_id: string | null; // Now 10 alphanumeric characters or null
  other_user_id: string | null; // Now 8 alphanumeric characters or null
  other_username: string | null;
}

type ActivityFilter = 'all' | 'listings' | 'conversations' | 'users' | 'offers';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(50);
  
  // System notification state
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    targetGroup: 'all' as 'all' | 'verified' | 'unverified' | 'admin' | 'buyers' | 'sellers',
    title: '',
    message: '',
    icon: 'info' as 'info' | 'success' | 'warning' | 'error' | 'system',
    actionUrl: ''
  });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  
  const router = useRouter();
  const lang = useLang();

  const loadStats = useCallback(async (page: number = currentPage) => {
    try {
      setStatsLoading(true);
      const response = await fetch(`/api/admin/stats?page=${page}&limit=${itemsPerPage}&filter=${activityFilter}`);
      if (response.ok) {
        const data = await response.json() as { success: boolean; data?: AdminStats };
        if (data.success && data.data) {
          setStats(data.data);
          if (data.data.pagination) {
            setTotalPages(data.data.pagination.totalPages);
            setCurrentPage(data.data.pagination.page);
          }
        }
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [currentPage, itemsPerPage, activityFilter]);

  // Check if user is already authenticated on component mount
  useEffect(() => {
    // Don't auto-authenticate - require admin password every time
    // checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/check');
      if (response.ok) {
        const data = await response.json() as { success: boolean; isAdmin: boolean };
        if (data.success && data.isAdmin) {
          setIsAuthenticated(true);
          loadStats();
        }
      }
    } catch (error) {
      console.error('Error checking admin auth:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/admin/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const data = await response.json() as { success: boolean; error?: string };
        if (data.success) {
          setIsAuthenticated(true);
          setPassword("");
          // No localStorage - rely on session
          loadStats();
        } else {
          setError(data.error || 'Invalid password');
        }
      } else {
        setError('Authentication failed');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setStats(null);
    }
  };

  const sendSystemNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingNotification(true);
    setNotificationError(null);
    setNotificationSuccess(null);

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(notificationForm),
      });

      const data = await response.json() as { success: boolean; message?: string; error?: string };

      if (response.ok && data.success) {
        setNotificationSuccess(data.message || 'Notification sent successfully');
        setNotificationForm({
          targetGroup: 'all',
          title: '',
          message: '',
          icon: 'info',
          actionUrl: ''
        });
        setShowNotificationForm(false);
      } else {
        setNotificationError(data.error || 'Failed to send notification');
      }
    } catch (error) {
      setNotificationError('Network error. Please try again.');
      console.error('Error sending notification:', error);
    } finally {
      setSendingNotification(false);
    }
  };

  const resetNotificationForm = () => {
    setNotificationForm({
      targetGroup: 'all',
      title: '',
      message: '',
      icon: 'info',
      actionUrl: ''
    });
    setNotificationError(null);
    setNotificationSuccess(null);
  };



  const formatSats = (sats: number) => {
    return new Intl.NumberFormat().format(sats);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  // Filter recent activity based on selected filter
  // Use server-side paginated activity directly
  const paginatedActivity = stats?.recentActivity || [];

  // Reset to first page when filter changes and reload data
  useEffect(() => {
    setCurrentPage(1);
    loadStats(1);
  }, [activityFilter, loadStats]);

  // Get action color based on action type
  const getActionColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('created') || lowerAction.includes('added') || lowerAction.includes('joined') || lowerAction.includes('listed')) {
      return 'text-green-600 dark:text-green-400';
    } else if (lowerAction.includes('deleted') || lowerAction.includes('removed') || lowerAction.includes('banned')) {
      return 'text-red-600 dark:text-red-400';
    } else if (lowerAction.includes('updated') || lowerAction.includes('modified') || lowerAction.includes('changed')) {
      return 'text-blue-600 dark:text-blue-400';
            } else if (lowerAction.includes('messaged')) {
      return 'text-neutral-900 dark:text-white';
    } else {
      return 'text-neutral-600 dark:text-neutral-400';
    }
  };

  // Format activity description based on type
  const formatActivityDescription = (activity: AdminStats['recentActivity'][0]) => {
    const UserTag = ({ username, userId }: { username: string; userId: string }) => (
      <a 
        href={`/admin/users?search=${encodeURIComponent(username)}&userId=${encodeURIComponent(userId)}`}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors border border-blue-300 dark:border-blue-600"
      >
        {username}
        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
        </svg>
      </a>
    );

    const ListingTag = ({ title, id }: { title: string | null; id: string | null }) => (
      <a 
        href={`/admin/listings?title=${encodeURIComponent(title || '')}&id=${encodeURIComponent(id || '')}`}
        className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs font-medium bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 hover:bg-green-300 dark:hover:bg-green-700 transition-colors border border-green-300 dark:border-green-600"
      >
        <span>{title || 'Unknown Listing'}</span>
        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
        </svg>
      </a>
    );

    switch (activity.type) {
      case 'user':
        return (
          <>
            <UserTag username={activity.username} userId={activity.user_id} />
            {' '}created their account
          </>
        );
      case 'listing':
        return (
          <>
            <UserTag username={activity.username} userId={activity.user_id} />
            {' '}posted{' '}
            <ListingTag title={activity.listing_title} id={activity.listing_id} />
          </>
        );
      case 'message':
        return (
          <>
            <UserTag username={activity.username} userId={activity.user_id} />
            {' '}messaged{' '}
            <UserTag username={activity.other_username || 'Unknown User'} userId={activity.other_user_id || ''} />
            {' '}about{' '}
            <ListingTag title={activity.listing_title} id={activity.listing_id} />
            {'. '}
            <a 
              href={`/admin/chats?chatId=${encodeURIComponent(activity.chat_id || '')}&search=${encodeURIComponent(activity.listing_title || '')}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors border border-purple-300 dark:border-purple-600"
            >
              view conversation
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </>
        );
      case 'offer':
        const formatOfferAmount = (amount: number) => {
          return new Intl.NumberFormat().format(amount);
        };
        
        const formatExpiration = (expiresAt: number | null) => {
          if (!expiresAt) return null;
          const now = Math.floor(Date.now() / 1000);
          const diff = expiresAt - now;
          
          if (diff <= 0) return "expired";
          
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

        const expirationText = formatExpiration(activity.offer_expires_at || null);
        
        if (activity.action === 'sent' || activity.action === 'offered') {
          return (
            <>
              <UserTag username={activity.username} userId={activity.user_id} />
              {' '}offered{' '}
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 border border-orange-300 dark:border-orange-600">
                {formatOfferAmount(activity.offer_amount || 0)} sats
              </span>
              {' '}for{' '}
              <ListingTag title={activity.listing_title} id={activity.listing_id} />
              {expirationText && (
                <>
                  {' '}- expires in{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-600">
                    {expirationText}
                  </span>
                </>
              )}
              {'. '}
              <a 
                href={`/admin/chats?chatId=${encodeURIComponent(activity.chat_id || '')}&search=${encodeURIComponent(activity.listing_title || '')}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors border border-purple-300 dark:border-purple-600"
              >
                view conversation
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </>
          );
        } else if (activity.action === 'offer expired') {
          return (
            <>
              <UserTag username={activity.username} userId={activity.user_id} />
              {' '}'s offer for{' '}
              <ListingTag title={activity.listing_title} id={activity.listing_id} />
              {' '}expired.{' '}
              <a 
                href={`/admin/chats?chatId=${encodeURIComponent(activity.chat_id || '')}&search=${encodeURIComponent(activity.listing_title || '')}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors border border-purple-300 dark:border-purple-600"
              >
                view conversation
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </>
          );
        } else if (activity.action === 'revoked offer') {
          return (
            <>
              <UserTag username={activity.username} userId={activity.user_id} />
              {' '}'s offer for{' '}
              <ListingTag title={activity.listing_title} id={activity.listing_id} />
              {' '}was revoked.{' '}
              <a 
                href={`/admin/chats?chatId=${encodeURIComponent(activity.chat_id || '')}&search=${encodeURIComponent(activity.listing_title || '')}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors border border-purple-300 dark:border-purple-600"
              >
                view conversation
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </>
          );
        } else if (activity.action === 'declined offer') {
          return (
            <>
              <UserTag username={activity.other_username || 'Unknown User'} userId={activity.other_user_id || ''} />
              {' '}declined{' '}
              <UserTag username={activity.username} userId={activity.user_id} />
              {' '}'s{' '}
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 border border-orange-300 dark:border-orange-600">
                {formatOfferAmount(activity.offer_amount || 0)} sats
              </span>
              {' '}offer.{' '}
              <a 
                href={`/admin/chats?chatId=${encodeURIComponent(activity.chat_id || '')}&search=${encodeURIComponent(activity.listing_title || '')}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors border border-purple-300 dark:border-purple-600"
              >
                view conversation
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </>
          );
        } else if (activity.action === 'accepted offer') {
          return (
            <>
              <UserTag username={activity.other_username || 'Unknown User'} userId={activity.other_user_id || ''} />
              {' '}accepted{' '}
              <UserTag username={activity.username} userId={activity.user_id} />
              {' '}'s{' '}
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 border border-orange-300 dark:border-orange-600">
                {formatOfferAmount(activity.offer_amount || 0)} sats
              </span>
              {' '}offer.{' '}
              <a 
                href={`/admin/chats?chatId=${encodeURIComponent(activity.chat_id || '')}&search=${encodeURIComponent(activity.listing_title || '')}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors border border-purple-300 dark:border-purple-600"
              >
                view conversation
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </>
          );
        }
        return (
          <>
            <UserTag username={activity.username} userId={activity.user_id} />
            {' '}
            <span className="text-neutral-600 dark:text-neutral-400">{activity.action}</span>
          </>
        );
      default:
        return (
          <>
            <UserTag username={activity.username} userId={activity.user_id} />
            {' '}
            <span className="text-neutral-600 dark:text-neutral-400">{activity.action}</span>
          </>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              Admin Access
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Enter password to access admin dashboard
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500",
                  "bg-white dark:bg-neutral-900",
                  "border-neutral-300 dark:border-neutral-700",
                  "text-neutral-900 dark:text-white",
                  "placeholder-neutral-500 dark:placeholder-neutral-400"
                )}
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            
            <PrimaryButton
              type="submit"
              disabled={!password.trim() || loading}
              className="w-full py-3"
            >
              {loading ? "Checking..." : "Access Admin"}
            </PrimaryButton>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                Platform overview and activity monitoring
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => loadStats(currentPage)}
                disabled={statsLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {statsLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Integrated Stats & Management Boxes */}
          {statsLoading ? (
            <div className="text-center py-12">
              <div className="text-neutral-600 dark:text-neutral-400">Loading statistics...</div>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              {/* Users Box with Management Button */}
              <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-md flex flex-col">
                <div className="flex-1">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-0.5">{stats.users.total}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">Users</div>
                </div>
                <button 
                  onClick={() => router.push('/admin/users')}
                  className="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  User Management
                </button>
              </div>

              {/* Listings Box with Management Button */}
              <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 hover:shadow-md flex flex-col">
                <div className="flex-1">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-0.5">{stats.listings.total}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">Listings</div>
                </div>
                <button 
                  onClick={() => router.push('/admin/listings')}
                  className="w-full px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Listing Management
                </button>
              </div>

              {/* Chats Box with Management Button */}
              <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 hover:shadow-md flex flex-col">
                <div className="flex-1">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-0.5">{stats.conversations.total}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">Active Conversations</div>
                </div>
                <button 
                  onClick={() => router.push('/admin/chats')}
                  className="w-full px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Chat Management
                </button>
              </div>

              {/* Admin Actions - 2x2 Grid */}
              <div className="md:col-span-2 p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div className="grid grid-cols-2 gap-2 h-full">
                  <button 
                    onClick={() => setShowNotificationForm(true)}
                    className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Send System Msg
                  </button>
                  <button 
                    onClick={() => router.push('/admin/reports')}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Manage reports
                  </button>
                  <button 
                    onClick={() => router.push('/admin/analytics')}
                    className="px-3 py-2 bg-neutral-500 hover:bg-neutral-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    View Analytics
                  </button>
                  <button 
                    onClick={() => router.push('/admin/security')}
                    className="px-3 py-2 bg-black hover:bg-neutral-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Security Center
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* System Notification Modal */}
          {showNotificationForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                      Send System Notification
                    </h2>
                    <button
                      onClick={() => {
                        setShowNotificationForm(false);
                        resetNotificationForm();
                      }}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                    Send a notification to users that will appear in their messages
                  </p>
                </div>

                <form onSubmit={sendSystemNotification} className="p-6 space-y-6">
                  {/* Target Group */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                      Target Group *
                    </label>
                    <select
                      value={notificationForm.targetGroup}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, targetGroup: e.target.value as any }))}
                      required
                    >
                      <option value="all">All Users</option>
                      <option value="verified">Verified Users Only</option>
                      <option value="unverified">Unverified Users Only</option>
                      <option value="admin">Admin Users Only</option>
                      <option value="buyers">Buyers Only</option>
                      <option value="sellers">Sellers Only</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter notification title"
                      required
                      maxLength={100}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                      Message *
                    </label>
                    <textarea
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter notification message"
                      rows={4}
                      required
                      maxLength={500}
                    />
                    <div className="text-xs text-neutral-500 mt-1 text-right">
                      {notificationForm.message.length}/500
                    </div>
                  </div>

                  {/* Icon */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                      Icon *
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                      {(['info', 'success', 'warning', 'error', 'system'] as const).map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNotificationForm(prev => ({ ...prev, icon }))}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            notificationForm.icon === icon
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                              : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                          }`}
                        >
                          <div className="text-center">
                            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                              {icon === 'info' && (
                                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {icon === 'success' && (
                                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {icon === 'warning' && (
                                <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                              )}
                              {icon === 'error' && (
                                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {icon === 'system' && (
                                <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              )}
                            </div>
                            <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                              {icon}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action URL (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                      Action URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={notificationForm.actionUrl}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, actionUrl: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="https://example.com (optional)"
                    />
                    <div className="text-xs text-neutral-500 mt-1">
                      Users can click this URL when viewing the notification
                    </div>
                  </div>

                  {/* Success/Error Messages */}
                  {notificationSuccess && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-800 dark:text-green-200">{notificationSuccess}</span>
                      </div>
                    </div>
                  )}

                  {notificationError && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-red-800 dark:text-red-200">{notificationError}</span>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotificationForm(false);
                        resetNotificationForm();
                      }}
                      className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingNotification || !notificationForm.title.trim() || !notificationForm.message.trim()}
                      className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingNotification ? 'Sending...' : 'Send Notification'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Live Activity Feed */}
          {stats?.recentActivity && stats.recentActivity.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Live Activity Feed</h2>
                
                {/* Activity Filter */}
                <div className="flex gap-2">
                  {(['all', 'listings', 'conversations', 'users', 'offers'] as ActivityFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActivityFilter(filter)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                        activityFilter === filter
                          ? "bg-orange-500 text-white"
                          : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                      )}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Activity Feed - Condensed Text Editor Style */}
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-4">
                  {paginatedActivity.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                      No {activityFilter === 'all' ? '' : activityFilter} activity found
                    </div>
                  ) : (
                    <div className="space-y-0 font-mono text-sm">
                      {paginatedActivity.map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 py-0.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded px-2 -mx-2 transition-colors flex-nowrap min-w-0">
                          <span className="text-neutral-400 dark:text-neutral-500 text-xs font-mono flex-shrink-0 w-36">
                            {new Date(activity.timestamp * 1000).toLocaleString([], { 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                          <span className="text-neutral-600 dark:text-neutral-400 flex-1 min-w-0 overflow-hidden">
                            {formatActivityDescription(activity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Pagination - Condensed Style */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center py-3 px-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, stats?.pagination?.total || 0)} of {stats?.pagination?.total || 0} activities
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => loadStats(1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1 rounded text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        First
                      </button>
                      <button
                        onClick={() => loadStats(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 rounded text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Prev
                      </button>
                      
                      <span className="px-2 py-1 text-xs font-medium text-neutral-900 dark:text-white">
                        {currentPage} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => loadStats(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 rounded text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                      <button
                        onClick={() => loadStats(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 rounded text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}


