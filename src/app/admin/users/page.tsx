"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: number;
  lastLoginAt?: number;
  isVerified: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  banReason?: string;
  banExpiresAt?: number;
  listingsCount: number;
  chatsCount: number;
  messagesCount: number;
  rating: number;
  deals: number;
  totalListingsValue: number;
  lastActivityAt?: number;
}

interface UserListing {
  id: string;
  title: string;
  priceSat: number;
  status: 'active' | 'sold' | 'expired';
  createdAt: number;
  views: number;
  chatsCount: number;
}

interface UserChat {
  id: string;
  listingTitle: string;
  listingId: string;
  otherUsername: string;
  lastMessageAt: number;
  messageCount: number;
  unreadCount: number;
}

interface UsersResponse {
  success: boolean;
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminUsersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified' | 'banned' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastLoginAt' | 'listingsCount' | 'rating' | 'deals' | 'totalListingsValue' | 'lastActivityAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState(7); // days
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userListings, setUserListings] = useState<{ [key: string]: UserListing[] }>({});
  const [userChats, setUserChats] = useState<{ [key: string]: UserChat[] }>({});
  const [loadingUserData, setLoadingUserData] = useState<string | null>(null);
  
  const router = useRouter();
  const lang = useLang();

  // Check admin authentication
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadUsers();
    } else {
      router.push('/admin');
    }
  }, [router]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users/list');
      if (response.ok) {
        const data: UsersResponse = await response.json();
        setUsers(data.users || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    if (userListings[userId] && userChats[userId]) return; // Already loaded
    
    try {
      setLoadingUserData(userId);
      
      // Load user listings
      const listingsResponse = await fetch(`/api/admin/users/${userId}/listings`);
      if (listingsResponse.ok) {
        const listingsData = await listingsResponse.json() as { listings: UserListing[] };
        setUserListings(prev => ({
          ...prev,
          [userId]: listingsData.listings || []
        }));
      }
      
      // Load user chats
      const chatsResponse = await fetch(`/api/admin/users/${userId}/chats`);
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json() as { chats: UserChat[] };
        setUserChats(prev => ({
          ...prev,
          [userId]: chatsData.chats || []
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoadingUserData(null);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
      loadUserData(userId);
    }
  };

  const banUser = async (userId: string, reason: string, durationDays: number) => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          reason, 
          durationDays 
        })
      });

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                isBanned: true, 
                banReason: reason,
                banExpiresAt: Date.now() + (durationDays * 24 * 60 * 60 * 1000)
              }
            : user
        ));
        setShowBanModal(false);
        setSelectedUser(null);
        setBanReason("");
      } else {
        console.error('Failed to ban user');
      }
    } catch (error) {
      console.error('Error banning user:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyUser = async (userId: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/admin/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, isVerified: true }
            : user
        ));
        setShowVerifyModal(false);
        setSelectedUser(null);
      } else {
        console.error('Failed to verify user');
      }
    } catch (error) {
      console.error('Error verifying user:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    switch (statusFilter) {
      case 'verified': matchesStatus = user.isVerified; break;
      case 'unverified': matchesStatus = !user.isVerified; break;
      case 'banned': matchesStatus = user.isBanned; break;
      case 'admin': matchesStatus = user.isAdmin; break;
    }
    
    return matchesSearch && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'createdAt':
        aValue = a.createdAt;
        bValue = b.createdAt;
        break;
      case 'lastLoginAt':
        aValue = a.lastLoginAt || 0;
        bValue = b.lastLoginAt || 0;
        break;
      case 'listingsCount':
        aValue = a.listingsCount;
        bValue = b.listingsCount;
        break;
      case 'rating':
        aValue = a.rating;
        bValue = b.rating;
        break;
      case 'deals':
        aValue = a.deals;
        bValue = b.deals;
        break;
      case 'totalListingsValue':
        aValue = a.totalListingsValue;
        bValue = b.totalListingsValue;
        break;
      case 'lastActivityAt':
        aValue = a.lastActivityAt || 0;
        bValue = b.lastActivityAt || 0;
        break;
      default:
        aValue = a.createdAt;
        bValue = b.createdAt;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const formatPrice = (priceSats: number) => {
    return `${priceSats.toLocaleString()} sats`;
  };

  const getStatusColor = (user: User) => {
    if (user.isBanned) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (user.isAdmin) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (user.isVerified) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  };

  const getStatusText = (user: User) => {
    if (user.isBanned) return 'Banned';
    if (user.isAdmin) return 'Admin';
    if (user.isVerified) return 'Verified';
    return 'Unverified';
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-200/50 dark:border-neutral-700/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">User Management</h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mt-2">Comprehensive user oversight with listings and chat analytics</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              ← Back to Admin
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Filters and Search */}
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 mb-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Search Users
              </label>
              <input
                type="text"
                placeholder="Search usernames or emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm shadow-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm shadow-sm"
              >
                <option value="all">All Users</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="banned">Banned</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Sort By
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy as any);
                  setSortOrder(newSortOrder as any);
                }}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm shadow-sm"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="lastLoginAt-desc">Last Login</option>
                <option value="listingsCount-desc">Most Listings</option>
                <option value="rating-desc">Highest Rating</option>
                <option value="deals-desc">Most Deals</option>
                <option value="totalListingsValue-desc">Highest Value</option>
                <option value="lastActivityAt-desc">Most Active</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Users Table */}
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-500 to-amber-500">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    User Profile
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    Status & Activity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    Platform Stats
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/50 dark:divide-neutral-700/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-neutral-600 dark:text-neutral-400 text-lg">Loading users...</p>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400 text-lg">
                      No users found matching your criteria
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <React.Fragment key={user.id}>
                      <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-700/50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-neutral-900 dark:text-white text-lg">
                                {user.username}
                              </h4>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {user.email}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 font-mono">
                                ID: {user.id.slice(0, 8)}...
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                Joined: {formatDate(user.createdAt)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${getStatusColor(user)}`}>
                              {getStatusText(user)}
                            </span>
                            {user.isBanned && user.banReason && (
                              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                🚫 {user.banReason}
                              </p>
                            )}
                            {user.lastLoginAt && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                🔐 Last login: {formatRelativeTime(user.lastLoginAt)}
                              </p>
                            )}
                            {user.lastActivityAt && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                📍 Last activity: {formatRelativeTime(user.lastActivityAt)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{user.listingsCount}</div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">Listings</div>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{user.chatsCount}</div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">Chats</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user.messagesCount}</div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">Messages</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">⭐ {user.rating.toFixed(1)}</div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">Rating</div>
                            </div>
                          </div>
                          {user.totalListingsValue > 0 && (
                            <div className="mt-3 text-center">
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatPrice(user.totalListingsValue)}
                              </div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">Total Value</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() => toggleUserExpansion(user.id)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-md"
                            >
                              {expandedUser === user.id ? '👁️ Hide' : '🔍 View'} Details
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowVerifyModal(true);
                              }}
                              disabled={user.isVerified}
                              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-md"
                            >
                              ✅ Verify
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowBanModal(true);
                              }}
                              disabled={user.isBanned}
                              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-md"
                            >
                              🚫 Ban
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded User Information */}
                      {expandedUser === user.id && (
                        <tr>
                          <td colSpan={4} className="px-6 py-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                            <div className="border-l-4 border-orange-500 pl-6">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* User Listings */}
                                <div>
                                  <h5 className="font-bold text-neutral-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                                    📋 User Listings ({user.listingsCount})
                                  </h5>
                                  
                                  {loadingUserData === user.id ? (
                                    <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                      Loading listings...
                                    </div>
                                  ) : userListings[user.id]?.length > 0 ? (
                                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                                      {userListings[user.id].map((listing) => (
                                        <div key={listing.id} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-700 rounded-xl border border-neutral-200 dark:border-neutral-600 shadow-sm">
                                          <div className="flex-1">
                                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                              {listing.title}
                                            </p>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                              {formatPrice(listing.priceSat)} • {listing.status} • {listing.views} views
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                              {formatDate(listing.createdAt)} • {listing.chatsCount} chats
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <a
                                              href={`/admin/listings?listingId=${listing.id}`}
                                              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-md"
                                            >
                                              🔗 View Listing
                                            </a>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-700 p-4 rounded-xl border border-neutral-200 dark:border-neutral-600">
                                      No listings found for this user.
                                    </p>
                                  )}
                                </div>

                                {/* User Chats */}
                                <div>
                                  <h5 className="font-bold text-neutral-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                                    💬 User Chats ({user.chatsCount})
                                  </h5>
                                  
                                  {loadingUserData === user.id ? (
                                    <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                      Loading chats...
                                    </div>
                                  ) : userChats[user.id]?.length > 0 ? (
                                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                                      {userChats[user.id].map((chat) => (
                                        <div key={chat.id} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-700 rounded-xl border border-neutral-200 dark:border-neutral-600 shadow-sm">
                                          <div className="flex-1">
                                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                              {chat.listingTitle}
                                            </p>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                              With: {chat.otherUsername}
                                            </p>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                              {chat.messageCount} messages • {chat.unreadCount} unread
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                              {formatRelativeTime(chat.lastMessageAt)}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <a
                                              href={`/admin/chats?chatId=${chat.id}`}
                                              className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-xs font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 shadow-md"
                                            >
                                              🔗 View Chat
                                            </a>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-700 p-4 rounded-xl border border-neutral-200 dark:border-neutral-600">
                                      No chat conversations found for this user.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center py-6 px-6 border-t border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-700 dark:to-neutral-800">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-sm font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600">
                  {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ban User Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
              🚫 Ban User: {selectedUser.username}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Ban Reason
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for banning this user..."
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Ban Duration
                </label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                >
                  <option value={1}>1 day</option>
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>1 year</option>
                  <option value={-1}>Permanent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 px-6 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => banUser(selectedUser.id, banReason, banDuration)}
                disabled={!banReason.trim() || isProcessing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                {isProcessing ? '🚫 Banning...' : '🚫 Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify User Modal */}
      {showVerifyModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
              ✅ Verify User: {selectedUser.username}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-lg">
              Are you sure you want to verify this user? This will grant them verified status on the platform.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 px-6 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => verifyUser(selectedUser.id)}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                {isProcessing ? '✅ Verifying...' : '✅ Verify User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
