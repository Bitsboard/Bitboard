"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Session } from "@/lib/auth";

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const lang = useLang();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const response = await fetch('/api/auth/session');
        console.log('Session response status:', response.status);
        
        if (response.ok) {
          const data = await response.json() as { session?: Session | null };
          console.log('Session data:', data);
          const userSession = data?.session;
          
          if (userSession) {
            console.log('User session found:', userSession);
            setSession(userSession);

            if (userSession.user?.email) {
              console.log('Checking admin status for:', userSession.user.email);
              // Check if user is admin
              const adminResponse = await fetch('/api/admin/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userSession.user.email })
              });

              console.log('Admin check response status:', adminResponse.status);
              if (adminResponse.ok) {
                const adminData = await adminResponse.json() as { isAdmin: boolean };
                console.log('Admin data:', adminData);
                setIsAdmin(adminData.isAdmin);
              } else {
                console.error('Admin check failed:', adminResponse.status);
              }
            }
          } else {
            console.log('No user session found');
          }
        } else {
          console.error('Session response not ok:', response.status);
        }
      } catch (error) {
        console.error('Failed to check authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && !session) {
      console.log('No session, redirecting to home');
      router.push('/');
    }
  }, [loading, session, router]);

  useEffect(() => {
    if (!loading && session && !isAdmin) {
      console.log('Session exists but not admin, redirecting to home');
      router.push('/');
    }
  }, [loading, session, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              Admin Dashboard
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Welcome back, {session.user?.username || session.user?.email}
            </p>
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
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Manage user accounts and permissions</p>
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200">
                Manage Users
              </button>
            </div>

            {/* Listing Management */}
            <div className={cn(
              "p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800",
              "hover:border-orange-300 dark:hover:border-orange-600"
            )}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Listing Management</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Review and moderate listings</p>
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200">
                Manage Listings
              </button>
            </div>

            {/* System Analytics */}
            <div className={cn(
              "p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800",
              "hover:border-orange-300 dark:hover:border-orange-600"
            )}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Analytics</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">View system statistics and reports</p>
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200">
                View Analytics
              </button>
            </div>

            {/* Content Moderation */}
            <div className={cn(
              "p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800",
              "hover:border-orange-300 dark:hover:border-orange-600"
            )}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Content Moderation</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Review reported content and users</p>
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200">
                Review Reports
              </button>
            </div>

            {/* System Settings */}
            <div className={cn(
              "p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800",
              "hover:border-orange-300 dark:hover:border-orange-600"
            )}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">System Settings</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Configure system parameters</p>
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200">
                Configure System
              </button>
            </div>

            {/* Database Management */}
            <div className={cn(
              "p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800",
              "hover:border-orange-300 dark:hover:border-orange-600"
            )}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Database</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Manage database and backups</p>
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200">
                Database Tools
              </button>
            </div>

            {/* Chat Management */}
            <div className={cn(
              "p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg",
              "bg-white dark:bg-neutral-900",
              "border-neutral-200 dark:border-neutral-800",
              "hover:border-blue-300 dark:hover:border-blue-600"
            )}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Chat Management</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Monitor and manage user conversations</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/admin/chats')}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
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
                        body: JSON.stringify({ email: session.user?.email })
                      });
                      
                      if (response.ok) {
                        alert('Account wiped successfully! You will be redirected to the home page.');
                        // Clear session and redirect
                        setSession(null);
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


