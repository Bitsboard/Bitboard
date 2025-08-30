"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  banReason?: string;
  banExpiresAt?: number;
  createdAt: number;
  lastLoginAt?: number;
  image?: string;
  listingsCount: number;
  chatsCount: number;
  messagesCount: number;
  rating: number;
  deals: number;
  totalListingsValue: number;
  lastActivityAt?: number;
}

export default function AdminUsersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const router = useRouter();

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadUsers();
    } else {
      router.push('/admin');
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [currentPage, isAuthenticated]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const offset = (currentPage - 1) * itemsPerPage;
      console.log('🔍 Loading users - Page:', currentPage, 'Items per page:', itemsPerPage, 'Offset:', offset);
      
      const response = await fetch(`/api/admin/users/list?limit=${itemsPerPage}&offset=${offset}`);
      
      if (response.ok) {
        const data: any = await response.json();
        console.log('🔍 Users loaded successfully:', data);
        
        if (data.success && data.users) {
          setUsers(data.users);
          setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
          console.log('✅ Set users:', data.users.length, 'Total pages:', Math.ceil((data.total || 0) / itemsPerPage));
        } else {
          console.error('❌ API returned success but no users:', data);
          setError('No users data received');
          setUsers([]);
        }
      } else {
        console.error('❌ API request failed:', response.status, response.statusText);
        setError(`Failed to load users: ${response.status}`);
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString();
  const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleTimeString();
  const formatPrice = (priceSat: number) => `${priceSat.toLocaleString()} sats`;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Back to Dashboard Button and Filters Row */}
        <div className="flex gap-3 mb-3">
          {/* Back to Dashboard Button */}
          <button
            onClick={() => router.push('/admin')}
            className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
          >
            ← Back to dashboard
          </button>

          {/* Condensed Filters */}
          <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-2 flex-1">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Search users..."
                className="px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-xs flex-1"
              />
              <select className="px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-xs">
                <option value="all">All Users</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="banned">Banned</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={loadUsers}
                disabled={isLoading}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-700">
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">ID</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Date</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Username</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Email</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Status</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Listings</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Chats</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Rating</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Deals</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Last Activity</th>
                </tr>
              </thead>
              <tbody className="space-y-0 font-mono text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-1.5 py-0.5 text-center text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={10} className="px-1.5 py-0.5 text-center text-neutral-500 dark:text-neutral-400">
                      <div className="text-center">
                        <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-600 dark:text-red-400 font-medium text-xs">Failed to load users</p>
                        <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">{error}</p>
                        <button
                          onClick={loadUsers}
                          className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          Try Again
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-1.5 py-0.5 text-center text-neutral-500 dark:text-neutral-400">
                      <div className="text-center">
                        <svg className="w-8 h-8 text-neutral-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-neutral-600 dark:text-neutral-400 font-medium text-xs">No users found</p>
                        <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">Try refreshing or check your connection</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {users.map((user) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded px-1.5 -mx-1.5 transition-colors cursor-pointer"
                      >
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                            {user.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            {formatDate(user.createdAt)}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {formatTime(user.createdAt)}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs font-medium text-neutral-900 dark:text-white">
                            {user.username}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs text-neutral-600 dark:text-neutral-400 max-w-32 truncate">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="flex flex-col gap-1">
                            {user.isAdmin && (
                              <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                Admin
                              </span>
                            )}
                            {user.isVerified && (
                              <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Verified
                              </span>
                            )}
                            {user.isBanned && (
                              <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                Banned
                              </span>
                            )}
                            {!user.isVerified && !user.isBanned && !user.isAdmin && (
                              <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                Unverified
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs text-neutral-900 dark:text-white">
                            {user.listingsCount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs text-neutral-900 dark:text-white">
                            {user.chatsCount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs text-neutral-900 dark:text-white">
                            {user.rating.toFixed(1)}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs text-neutral-900 dark:text-white">
                            {user.deals.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            {user.lastActivityAt ? formatDate(user.lastActivityAt) : 'Never'}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Fill remaining rows to maintain 20 row height */}
                    {Array.from({ length: Math.max(0, 20 - users.length) }).map((_, index) => (
                      <tr key={`empty-${index}`} className="h-6">
                        <td colSpan={10} className="px-1.5 py-0.5">
                          <div className="h-6"></div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center py-2 px-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
            <div className="text-xs text-neutral-600">
              {users.length} users • Page {currentPage} of {totalPages}
            </div>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-1.5 py-0.5 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-1.5 py-0.5 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-1.5 py-0.5 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-1.5 py-0.5 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
