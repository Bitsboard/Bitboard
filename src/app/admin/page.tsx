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
  recentActivity: Array<{
    type: string;
    identifier: string;
    action: string;
    timestamp: number;
  }>;
}

type ActivityFilter = 'all' | 'listings' | 'chats' | 'users' | 'messages';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
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

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  // Filter recent activity based on selected filter
  const filteredActivity = stats?.recentActivity?.filter(activity => {
    if (activityFilter === 'all') return true;
    return activity.type === activityFilter.slice(0, -1); // Remove 's' from plural
  }) || [];

  // Get action color based on action type
  const getActionColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('created') || lowerAction.includes('added') || lowerAction.includes('joined')) {
      return 'text-green-600 dark:text-green-400';
    } else if (lowerAction.includes('deleted') || lowerAction.includes('removed') || lowerAction.includes('banned')) {
      return 'text-red-600 dark:text-red-400';
    } else if (lowerAction.includes('updated') || lowerAction.includes('modified') || lowerAction.includes('changed')) {
      return 'text-blue-600 dark:text-blue-400';
    } else if (lowerAction.includes('sent') || lowerAction.includes('message')) {
      return 'text-purple-600 dark:text-purple-400';
    } else {
      return 'text-neutral-600 dark:text-neutral-400';
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
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                Platform overview and activity monitoring
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={loadStats}
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

          {/* Simple Stats Overview */}
          {statsLoading ? (
            <div className="text-center py-12">
              <div className="text-neutral-600 dark:text-neutral-400">Loading statistics...</div>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* Users */}
              <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.users.total}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Users</div>
                <div className="text-xs text-neutral-500 mt-1">+{stats.users.new7d} this week</div>
              </div>

              {/* Listings */}
              <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.listings.total}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Listings</div>
                <div className="text-xs text-neutral-500 mt-1">+{stats.listings.new7d} this week</div>
              </div>

              {/* Chats */}
              <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.chats.total}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Active Chats</div>
                <div className="text-xs text-neutral-500 mt-1">+{stats.chats.new7d} this week</div>
              </div>

              {/* Messages */}
              <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.messages.total}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Messages</div>
                <div className="text-xs text-neutral-500 mt-1">{stats.messages.unread} unread</div>
              </div>
            </div>
          ) : null}

          {/* Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <button 
              onClick={() => router.push('/admin/users')}
              className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left"
            >
              <div className="font-medium text-neutral-900 dark:text-white">User Management</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Manage users and permissions</div>
            </button>

            <button 
              onClick={() => router.push('/admin/listings')}
              className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-green-300 dark:hover:border-green-600 transition-colors text-left"
            >
              <div className="font-medium text-neutral-900 dark:text-white">Listing Management</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Manage marketplace listings</div>
            </button>

            <button 
              onClick={() => router.push('/admin/chats')}
              className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-600 transition-colors text-left"
            >
              <div className="font-medium text-neutral-900 dark:text-white">Chat Management</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Monitor all conversations</div>
            </button>

            <button 
              onClick={async () => {
                if (confirm('Are you sure you want to wipe your account? This cannot be undone.')) {
                  try {
                    const response = await fetch('/api/admin/users/wipe-me', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: 'georged1997@gmail.com' })
                    });
                    
                    if (response.ok) {
                      alert('Account wiped successfully! Redirecting to home page.');
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
              className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-red-300 dark:hover:border-red-600 transition-colors text-left"
            >
              <div className="font-medium text-neutral-900 dark:text-white">Testing Tools</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Wipe my account</div>
            </button>
          </div>

          {/* Live Activity Feed */}
          {stats?.recentActivity && stats.recentActivity.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Live Activity Feed</h2>
                
                {/* Activity Filter */}
                <div className="flex gap-2">
                  {(['all', 'listings', 'chats', 'users', 'messages'] as ActivityFilter[]).map((filter) => (
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
              
              {/* Activity Table */}
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {filteredActivity.map((activity, index) => (
                        <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800">
                          <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                            {formatTime(activity.timestamp)}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                            <span className={cn(
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                              activity.type === 'user' ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                              activity.type === 'listing' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                              activity.type === 'chat' ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                              "bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                            )}>
                              {activity.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={cn("font-medium", getActionColor(activity.action))}>
                              {activity.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-900 dark:text-white">
                            {activity.identifier}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {filteredActivity.length === 0 && (
                  <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                    No {activityFilter === 'all' ? '' : activityFilter} activity found
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


