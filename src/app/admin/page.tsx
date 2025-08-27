"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
  chats: {
    total: number;
    new7d: number;
    new30d: number;
  };
  messages: {
    total: number;
    new7d: number;
    new30d: number;
    unread: number;
  };
  categories: Array<{
    category: string;
    count: number;
    avg_price: number;
  }>;
  recentActivity: Array<{
    type: string;
    identifier: string;
    action: string;
    timestamp: number;
  }>;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const router = useRouter();
  const lang = useLang();

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadStats();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Simple password check - you can change this password
      if (password === "admin123") {
        setIsAuthenticated(true);
        setPassword("");
        // Save authentication state to localStorage
        localStorage.setItem('admin_authenticated', 'true');
        // Load stats immediately after login
        loadStats();
      } else {
        setError("Incorrect password");
      }
    } catch (error) {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
    setStats(null);
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json() as { success: boolean; data?: AdminStats };
        if (data.success && data.data) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const formatSats = (sats: number) => {
    return new Intl.NumberFormat().format(sats);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
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
            
            <button
              type="submit"
              disabled={!password.trim() || loading}
              className={cn(
                "w-full py-3 rounded-xl font-semibold transition-all duration-200",
                password.trim() && !loading
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                  : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
              )}
            >
              {loading ? "Checking..." : "Access Admin"}
            </button>
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
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                Admin Dashboard
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                Real-time platform statistics and management
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={loadStats}
                disabled={statsLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {statsLoading ? 'Refreshing...' : 'Refresh Stats'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Real-time Stats Grid */}
          {statsLoading ? (
            <div className="text-center py-12">
              <div className="text-neutral-600 dark:text-neutral-400">Loading statistics...</div>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Users */}
              <div className={cn(
                "p-6 rounded-2xl border",
                "bg-white dark:bg-neutral-900",
                "border-neutral-200 dark:border-neutral-800"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.users.total}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Users</div>
                  </div>
                </div>
                <div className="text-xs text-neutral-500 space-y-1">
                  <div>✅ {stats.users.verified} verified</div>
                  <div>👑 {stats.users.admin} admins</div>
                  <div>🚫 {stats.users.banned} banned</div>
                  <div>📈 +{stats.users.new7d} this week</div>
                </div>
              </div>

              {/* Listings */}
              <div className={cn(
                "p-6 rounded-2xl border",
                "bg-white dark:bg-neutral-900",
                "border-neutral-200 dark:border-neutral-800"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.listings.total}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Listings</div>
                  </div>
                </div>
                <div className="text-xs text-neutral-500 space-y-1">
                  <div>🟢 {stats.listings.active} active</div>
                  <div>💰 {stats.listings.sold} sold</div>
                  <div>📈 +{stats.listings.new7d} this week</div>
                  <div>💎 {formatSats(stats.listings.avgPriceSats)} avg sats</div>
                </div>
              </div>

              {/* Chats */}
              <div className={cn(
                "p-6 rounded-2xl border",
                "bg-white dark:bg-neutral-900",
                "border-neutral-200 dark:border-neutral-800"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.chats.total}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Active Chats</div>
                  </div>
                </div>
                <div className="text-xs text-neutral-500 space-y-1">
                  <div>💬 {stats.messages.total} messages</div>
                  <div>📧 {stats.messages.unread} unread</div>
                  <div>📈 +{stats.chats.new7d} this week</div>
                  <div>📅 +{stats.chats.new30d} this month</div>
                </div>
              </div>

              {/* Platform Value */}
              <div className={cn(
                "p-6 rounded-2xl border",
                "bg-white dark:bg-neutral-900",
                "border-neutral-200 dark:border-neutral-800"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-white">{formatSats(stats.listings.totalValueActive)}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Value (sats)</div>
                  </div>
                </div>
                <div className="text-xs text-neutral-500 space-y-1">
                  <div>💎 Active listings value</div>
                  <div>📊 {stats.listings.active} active items</div>
                  <div>📈 +{stats.listings.new7d} new this week</div>
                  <div>📅 +{stats.listings.new30d} new this month</div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Admin Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* User Management */}
            <div className={cn(
              "p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800",
              "hover:border-orange-300 dark:hover:border-orange-600"
            )}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">User Management</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Manage users and permissions</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/admin/users')}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
              >
                Manage Users
              </button>
            </div>

            {/* Listing Management */}
            <div className={cn(
              "p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800",
              "hover:border-green-300 dark:hover:border-green-600"
            )}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Listing Management</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Manage marketplace listings</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/admin/listings')}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
              >
                Manage Listings
              </button>
            </div>

            {/* Chat Management */}
            <div className={cn(
              "p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800",
              "hover:border-purple-300 dark:hover:border-purple-600"
            )}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Chat Management</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Monitor all chat conversations</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/admin/chats')}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
              >
                View Chats
              </button>
            </div>

            {/* Testing Tools */}
            <div className={cn(
              "p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800",
              "hover:border-red-300 dark:hover:border-red-600"
            )}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Testing Tools</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Development and testing utilities</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  if (confirm('Are you sure you want to wipe your account from the database? This action cannot be undone.')) {
                    try {
                      const response = await fetch('/api/admin/users/wipe-me', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: 'georged1997@gmail.com' })
                      });
                      
                      if (response.ok) {
                        alert('Account wiped successfully! You will be redirected to the home page.');
                        router.push('/');
                      } else {
                        const errorData = await response.json() as { error?: string };
                        alert(`Failed to wipe account: ${errorData.error || 'Unknown error'}`);
                      }
                    } catch (error: unknown) {
                      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                      alert('Failed to wipe account. Please try again.');
                      console.error('Error wiping account:', errorMessage);
                    }
                  }
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
              >
                Wipe My Account
              </button>
            </div>
          </div>

          {/* Category Distribution */}
          {stats?.categories && stats.categories.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Category Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.categories.map((category, index) => (
                  <div key={index} className={cn(
                    "p-4 rounded-xl border",
                    "bg-white dark:bg-neutral-900",
                    "border-neutral-200 dark:border-neutral-800"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-neutral-900 dark:text-white">{category.category}</span>
                      <span className="text-2xl font-bold text-orange-500">{category.count}</span>
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Avg: {formatSats(Math.round(category.avg_price))} sats
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {stats?.recentActivity && stats.recentActivity.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Recent Activity</h2>
              <div className={cn(
                "rounded-xl border overflow-hidden",
                "bg-white dark:bg-neutral-900",
                "border-neutral-200 dark:border-neutral-800"
              )}>
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                  <h3 className="font-semibold text-neutral-900 dark:text-white">Last 7 Days</h3>
                </div>
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="p-4 flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                        activity.type === 'user' ? "bg-blue-500" :
                        activity.type === 'listing' ? "bg-green-500" : "bg-purple-500"
                      )}>
                        {activity.type === 'user' ? '👤' : activity.type === 'listing' ? '📦' : '💬'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900 dark:text-white">
                          {activity.identifier}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          {activity.action} • {formatDate(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}


