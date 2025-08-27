"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const lang = useLang();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Simple password check - you can change this password
      if (password === "admin123") {
        setIsAuthenticated(true);
        setPassword("");
      } else {
        setError("Incorrect password");
      }
    } catch (error) {
      setError("Login failed");
    } finally {
      setLoading(false);
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
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                Admin Dashboard
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                Welcome to the admin panel
              </p>
            </div>
            
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Admin Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={cn(
              "p-6 rounded-2xl border",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800"
            )}>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">1,234</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Users</div>
            </div>
            <div className={cn(
              "p-6 rounded-2xl border",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800"
            )}>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">567</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Active Listings</div>
            </div>
            <div className={cn(
              "p-6 rounded-2xl border",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800"
            )}>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">89</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Pending Reviews</div>
            </div>
            <div className={cn(
              "p-6 rounded-2xl border",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800"
            )}>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">99.9%</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}


