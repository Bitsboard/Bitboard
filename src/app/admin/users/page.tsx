"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  username: string;
  sso: string;
  verified: boolean;
  is_admin: boolean;
  banned: boolean;
  created_at: number;
  image?: string;
  rating: number;
  deals: number;
  last_active: number;
  has_chosen_username: boolean;
  // Additional fields from API
  isVerified?: boolean;
  isAdmin?: boolean;
  isBanned?: boolean;
  banReason?: string;
  banExpiresAt?: number;
  createdAt?: number;
  lastLoginAt?: number;
  listingsCount?: number;
  chatsCount?: number;
  messagesCount?: number;
  totalListingsValue?: number;
  lastActivityAt?: number;
}

interface UserListing {
  id: string;
  title: string;
  priceSat: number;
  adType: 'sell' | 'want';
  location: string;
  category: string;
  createdAt: number;
  views: number;
  status: string;
  replies?: number; // Added for new_listing_count
}

interface UserChat {
  id: string;
  listing_id: string;
  listing_title: string;
  other_user_id: string;
  other_username: string;
  createdAt: number;
  lastMessageAt: number;
  messageCount: number;
  unreadCount: number;
}

export default function AdminUsersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified' | 'banned' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'username' | 'email' | 'listingsCount' | 'chatsCount' | 'rating' | 'lastActivity'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Selected user state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [userChats, setUserChats] = useState<UserChat[]>([]);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  
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

  // Handle search and filter changes
  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [searchQuery, statusFilter]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const offset = (currentPage - 1) * itemsPerPage;
      console.log('🔍 Loading users - Page:', currentPage, 'Items per page:', itemsPerPage, 'Offset:', offset);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', itemsPerPage.toString());
      params.append('offset', offset.toString());
      if (searchQuery) params.append('q', searchQuery);
      
      const response = await fetch(`/api/admin/users/list?${params.toString()}`);
      
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

  const loadUserListings = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/listings`);
      if (response.ok) {
        const data = await response.json() as { success: boolean; listings?: any[]; error?: string };
        if (data.success) {
          setUserListings(data.listings || []);
        } else {
          console.error('Failed to load user listings:', data.error);
          setUserListings([]);
        }
      } else {
        console.error('Failed to load user listings:', response.status);
        setUserListings([]);
      }
    } catch (error) {
      console.error('Error loading user listings:', error);
      setUserListings([]);
    }
  };

  const loadUserChats = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/chats`);
      if (response.ok) {
        const data = await response.json() as { success: boolean; chats?: any[]; error?: string };
        if (data.success) {
          setUserChats(data.chats || []);
        } else {
          console.error('Failed to load user chats:', data.error);
          setUserChats([]);
        }
      } else {
        console.error('Failed to load user chats:', response.status);
        setUserChats([]);
      }
    } catch (error) {
      console.error('Error loading user chats:', error);
      setUserChats([]);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setIsLoadingUserData(true);
    
    // Load user's listings and chats
    Promise.all([
      loadUserListings(user.id),
      loadUserChats(user.id)
    ]).finally(() => {
      setIsLoadingUserData(false);
    });
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };

  const handleStatusFilterChange = (newStatus: typeof statusFilter) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    // Note: Status filtering would need to be implemented in the API
    loadUsers();
  };

  const clearSelectedUser = () => {
    setSelectedUser(null);
    setUserListings([]);
    setUserChats([]);
  };

  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString();
  const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleTimeString();
  const formatPrice = (priceSat: number) => `${priceSat.toLocaleString()} sats`;

  const getTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 2592000)}mo ago`;
  };

  const getStatusBadge = (user: User) => {
    if (user.isAdmin || user.is_admin) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          Admin
        </span>
      );
    }
    if (user.isBanned || user.banned) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Banned
        </span>
      );
    }
    if (user.isVerified || user.verified) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        Unverified
      </span>
    );
  };

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-xs flex-1"
              />
              <select 
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as typeof statusFilter)}
                className="px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-xs"
              >
                <option value="all">All Users</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="banned">Banned</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Search'}
              </button>
              <button
                onClick={loadUsers}
                disabled={isLoading}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
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

        {/* Top Section - Always Visible */}
        <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-4 mb-4">
          {selectedUser ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - User Details (1/3 width) */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  {/* Row 1: Username and Status */}
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(selectedUser)}
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                      {selectedUser.username}
                    </h3>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600">
                      ID: {selectedUser.id}
                    </span>
                  </div>
                  
                  {/* Row 2: Email and Signup Date */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 dark:text-neutral-400">Email:</span>
                      <span className="text-neutral-900 dark:text-white truncate">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 dark:text-neutral-400">Signed up:</span>
                      <span className="text-neutral-900 dark:text-white">{formatDate(selectedUser.createdAt || selectedUser.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Row 3: Stats */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 dark:text-neutral-400">Listings:</span>
                      <span className="text-neutral-900 dark:text-white font-medium">{selectedUser.listingsCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 dark:text-neutral-400">Chats:</span>
                      <span className="text-neutral-900 dark:text-white font-medium">{selectedUser.chatsCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 dark:text-neutral-400">Reputation:</span>
                      <span className="text-neutral-900 dark:text-white font-medium">{selectedUser.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 dark:text-neutral-400">Deals:</span>
                      <span className="text-neutral-900 dark:text-white font-medium">{selectedUser.deals}</span>
                    </div>
                  </div>
                  
                  {/* Row 4: Last Activity */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Last activity:</span>
                    <span className="text-neutral-900 dark:text-white">
                      {selectedUser.lastActivityAt || selectedUser.last_active ? getTimeAgo(selectedUser.lastActivityAt || selectedUser.last_active) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Middle Column - User Listings (1/3 width) */}
              <div className="lg:col-span-1">
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600 p-3 h-full">
                  <h3 className="text-md font-semibold text-neutral-900 dark:text-white mb-3">
                    User Listings ({userListings?.length || 0})
                  </h3>
                  
                  <div className="h-[calc(100%-3rem)] overflow-y-auto space-y-2">
                    {isLoadingUserData ? (
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Loading listings...</div>
                    ) : userListings && userListings.length > 0 ? (
                      userListings.map((listing) => (
                        <div 
                          key={listing.id} 
                          className="bg-green-200 dark:bg-green-800 rounded p-2 border border-green-300 dark:border-green-600 hover:bg-green-300 dark:hover:bg-green-700 transition-colors cursor-pointer relative"
                          onClick={() => window.location.href = `/admin/listings?title=${encodeURIComponent(listing.title)}&id=${encodeURIComponent(listing.id)}`}
                        >
                          {/* External Link Icon - Top Right */}
                          <svg className="absolute top-1.5 right-1.5 w-3 h-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          
                          {/* Listing Title - Top Left */}
                          <div className="mb-2">
                            <div className="text-xs font-medium text-green-800 dark:text-green-200 truncate">
                              {listing.title}
                            </div>
                          </div>
                          
                          {/* Bottom Row - Price, Type, Age, Stats */}
                          <div className="flex items-center justify-between text-xs text-green-800 dark:text-green-200">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
                                listing.adType === 'want' 
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                              }`}>
                                {listing.adType === 'want' ? 'Want' : 'Sell'}
                              </span>
                              <span>{listing.priceSat.toLocaleString()} sats</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs">{getTimeAgo(listing.createdAt)}</div>
                              <div className="text-xs">{listing.views || 0} views • {listing.replies || 0} replies</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">No listings found</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column - Active Chats (1/3 width) */}
              <div className="lg:col-span-1">
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600 p-3 h-full">
                  <h3 className="text-md font-semibold text-neutral-900 dark:text-white mb-3">
                    Active Chats ({userChats?.length || 0})
                  </h3>
                  
                  <div className="h-[calc(100%-3rem)] overflow-y-auto space-y-2">
                    {isLoadingUserData ? (
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Loading chats...</div>
                    ) : userChats && userChats.length > 0 ? (
                      userChats.map((chat) => (
                        <div 
                          key={chat.id} 
                          className="bg-purple-200 dark:bg-purple-800 rounded p-2 border border-purple-300 dark:border-purple-600 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors cursor-pointer relative"
                          onClick={() => window.location.href = `/admin/chats?chatId=${encodeURIComponent(chat.id)}&search=${encodeURIComponent(chat.listing_title || '')}`}
                        >
                          {/* External Link Icon - Top Right */}
                          <svg className="absolute top-1.5 right-1.5 w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          
                          {/* Listing Title - Top Left */}
                          <div className="mb-2">
                            <div className="text-xs font-medium text-purple-800 dark:text-purple-200 truncate">
                              {chat.listing_title}
                            </div>
                          </div>
                          
                          {/* Bottom Row - Messages & Last Activity */}
                          <div className="flex items-center justify-between text-xs text-purple-800 dark:text-purple-200">
                            <span>{chat.messageCount} messages</span>
                            <span>{getTimeAgo(chat.lastMessageAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">No active chats</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">No User Selected</h3>
              <p className="text-neutral-500 dark:text-neutral-400">Click on a user in the table below to view their details</p>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full space-y-0 font-mono text-xs">
              <thead className="bg-neutral-100 dark:bg-neutral-800">
                <tr>
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      Date Signed Up
                      {sortBy === 'createdAt' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">User ID</th>
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('username')}
                  >
                    <div className="flex items-center gap-1">
                      Username
                      {sortBy === 'username' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      {sortBy === 'email' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Status</th>
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('listingsCount')}
                  >
                    <div className="flex items-center gap-1">
                      # Listings
                      {sortBy === 'listingsCount' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('chatsCount')}
                  >
                    <div className="flex items-center gap-1">
                      # Chats
                      {sortBy === 'chatsCount' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('rating')}
                  >
                    <div className="flex items-center gap-1">
                      Reputation
                      {sortBy === 'rating' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('lastActivity')}
                  >
                    <div className="flex items-center gap-1">
                      Last Activity
                      {sortBy === 'lastActivity' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="space-y-0 font-mono text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-neutral-600 dark:text-neutral-400">Loading users...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      {error}
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  <>
                    {users.map((user) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer border-b border-neutral-200 dark:border-neutral-600"
                        onClick={() => handleUserClick(user)}
                      >
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-600 dark:text-neutral-400">
                            {formatDate(user.createdAt || user.created_at)}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="font-mono text-xs text-neutral-900 dark:text-white">
                            {user.id}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="flex items-center gap-2">
                            {user.image && (
                              <img 
                                src={user.image} 
                                alt={user.username}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            )}
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {user.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-600 dark:text-neutral-400 max-w-32 truncate">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          {getStatusBadge(user)}
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-900 dark:text-white">
                            {user.listingsCount || 0}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-900 dark:text-white">
                            {user.chatsCount || 0}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-900 dark:text-white">
                            {user.rating.toFixed(1)}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-600 dark:text-neutral-400">
                            {user.lastActivityAt || user.last_active ? getTimeAgo(user.lastActivityAt || user.last_active) : 'Never'}
                          </div>
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
