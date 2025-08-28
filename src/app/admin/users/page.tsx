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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Admin - User Management</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Comprehensive user oversight with listings and chat analytics</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors text-sm"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Enhanced Filters and Search */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search usernames or emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
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
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy as any);
                  setSortOrder(newSortOrder as any);
                }}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
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
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    User Profile
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Status & Activity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Platform Stats
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-neutral-600 dark:text-neutral-400">Loading users...</p>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      No users found matching your criteria
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <React.Fragment key={user.id}>
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                        <td className="px-4 py-3">
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-white text-sm">
                              {user.username}
                            </h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                              {user.email}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              ID: {user.id}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              Joined: {formatDate(user.createdAt)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user)}`}>
                              {getStatusText(user)}
                            </span>
                            {user.isBanned && user.banReason && (
                              <p className="text-xs text-red-600 dark:text-red-400">
                                {user.banReason}
                              </p>
                            )}
                            {user.lastLoginAt && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                Last login: {formatRelativeTime(user.lastLoginAt)}
                              </p>
                            )}
                            {user.lastActivityAt && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                Last activity: {formatRelativeTime(user.lastActivityAt)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-600 dark:text-neutral-400">Listings:</span>
                              <span className="font-medium">{user.listingsCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-600 dark:text-neutral-400">Chats:</span>
                              <span className="font-medium text-orange-600">{user.chatsCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-600 dark:text-neutral-400">Messages:</span>
                              <span className="font-medium">{user.messagesCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-600 dark:text-neutral-400">Rating:</span>
                              <span className="font-medium">⭐ {user.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-600 dark:text-neutral-400">Deals:</span>
                              <span className="font-medium">{user.deals}</span>
                            </div>
                            {user.totalListingsValue > 0 && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-600 dark:text-neutral-400">Total Value:</span>
                                <span className="font-medium text-green-600">{formatPrice(user.totalListingsValue)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => toggleUserExpansion(user.id)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                            >
                              {expandedUser === user.id ? 'Hide' : 'View'} Details
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowVerifyModal(true);
                              }}
                              disabled={user.isVerified}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowBanModal(true);
                              }}
                              disabled={user.isBanned}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Ban
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded User Information */}
                      {expandedUser === user.id && (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800">
                            <div className="border-l-4 border-orange-500 pl-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* User Listings */}
                                <div>
                                  <h5 className="font-medium text-neutral-900 dark:text-white text-sm mb-3">
                                    User Listings ({user.listingsCount})
                                  </h5>
                                  
                                  {loadingUserData === user.id ? (
                                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                      Loading listings...
                                    </div>
                                  ) : userListings[user.id]?.length > 0 ? (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {userListings[user.id].map((listing) => (
                                        <div key={listing.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-700 rounded border">
                                          <div className="flex-1">
                                            <p className="text-xs font-medium text-neutral-900 dark:text-white">
                                              {listing.title}
                                            </p>
                                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                              {formatPrice(listing.priceSat)} • {listing.status} • {listing.views} views
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                              {formatDate(listing.createdAt)} • {listing.chatsCount} chats
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <a
                                              href={`/admin/listings?listingId=${listing.id}`}
                                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                                            >
                                              View Listing
                                            </a>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                      No listings found for this user.
                                    </p>
                                  )}
                                </div>

                                {/* User Chats */}
                                <div>
                                  <h5 className="font-medium text-neutral-900 dark:text-white text-sm mb-3">
                                    User Chats ({user.chatsCount})
                                  </h5>
                                  
                                  {loadingUserData === user.id ? (
                                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                      Loading chats...
                                    </div>
                                  ) : userChats[user.id]?.length > 0 ? (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {userChats[user.id].map((chat) => (
                                        <div key={chat.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-700 rounded border">
                                          <div className="flex-1">
                                            <p className="text-xs font-medium text-neutral-900 dark:text-white">
                                              {chat.listingTitle}
                                            </p>
                                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                              With: {chat.otherUsername}
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                              {chat.messageCount} messages • {chat.unreadCount} unread
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                              {formatRelativeTime(chat.lastMessageAt)}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <a
                                              href={`/admin/chats?chatId=${chat.id}`}
                                              className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 transition-colors"
                                            >
                                              View Chat
                                            </a>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
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
            <div className="flex justify-between items-center py-4 px-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-3 py-1 text-sm font-medium text-neutral-900 dark:text-white">
                  {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Ban User: {selectedUser.username}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Ban Reason
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for banning this user..."
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Ban Duration (days)
                </label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
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
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => banUser(selectedUser.id, banReason, banDuration)}
                disabled={!banReason.trim() || isProcessing}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'Banning...' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify User Modal */}
      {showVerifyModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Verify User: {selectedUser.username}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to verify this user? This will grant them verified status on the platform.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => verifyUser(selectedUser.id)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'Verifying...' : 'Verify User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
