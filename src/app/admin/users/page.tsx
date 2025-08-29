"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";

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
  const [sortBy, setSortBy] = useState<'username' | 'createdAt' | 'lastLoginAt' | 'listingsCount' | 'chatsCount' | 'rating' | 'deals' | 'totalListingsValue' | 'lastActivityAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(100);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState(7);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userListings, setUserListings] = useState<{ [key: string]: UserListing[] }>({});
  const [userChats, setUserChats] = useState<{ [key: string]: UserChat[] }>({});
  const [loadingUserData, setLoadingUserData] = useState<string | null>(null);
  
  const router = useRouter();
  const lang = useLang();

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
      const response = await fetch(`/api/admin/users/list?limit=${itemsPerPage}`);
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
    if (userListings[userId] && userChats[userId]) return;
    
    try {
      setLoadingUserData(userId);
      
      const listingsResponse = await fetch(`/api/admin/users/${userId}/listings`);
      if (listingsResponse.ok) {
        const listingsData = await listingsResponse.json() as { listings: UserListing[] };
        setUserListings(prev => ({
          ...prev,
          [userId]: listingsData.listings || []
        }));
      }
      
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

  const openUserModal = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
    loadUserData(user.id);
  };

  const banUser = async (userId: string, reason: string, durationDays: number) => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason, durationDays })
      });

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, isBanned: true, banReason: reason, banExpiresAt: Date.now() + (durationDays * 24 * 60 * 60 * 1000) }
            : user
        ));
        setShowBanModal(false);
        setSelectedUser(null);
        setBanReason("");
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
          user.id === userId ? { ...user, isVerified: true } : user
        ));
        setShowVerifyModal(false);
        setSelectedUser(null);
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
      case 'createdAt': aValue = a.createdAt; bValue = b.createdAt; break;
      case 'lastLoginAt': aValue = a.lastLoginAt || 0; bValue = b.lastLoginAt || 0; break;
      case 'listingsCount': aValue = a.listingsCount; bValue = b.listingsCount; break;
      case 'chatsCount': aValue = a.chatsCount; bValue = b.chatsCount; break;
      case 'rating': aValue = a.rating; bValue = b.rating; break;
      case 'deals': aValue = a.deals; bValue = b.deals; break;
      case 'totalListingsValue': aValue = a.totalListingsValue; bValue = b.totalListingsValue; break;
      case 'lastActivityAt': aValue = a.lastActivityAt || 0; bValue = b.lastActivityAt || 0; break;
    }
    
    return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
  });

  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString();
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}m ago`;
  };
  const formatPrice = (priceSats: number) => `${priceSats.toLocaleString()} sats`;

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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field as any);
      setSortOrder('asc');
    }
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
      {/* Compact Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">User Management</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Users: {users.length} | Verified: {users.filter(u => u.isVerified).length} | Banned: {users.filter(u => u.isBanned).length}</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-sm hover:bg-neutral-300 dark:hover:bg-neutral-600"
            >
              ← Admin
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Compact Filters */}
        <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-3 mb-4">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="banned">Banned</option>
              <option value="admin">Admins</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy as any);
                setSortOrder(newSortOrder as any);
              }}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
            >
              <option value="createdAt-desc">Newest</option>
              <option value="createdAt-asc">Oldest</option>
              <option value="lastLoginAt-desc">Last Login</option>
              <option value="listingsCount-desc">Most Listings</option>
              <option value="rating-desc">Highest Rating</option>
              <option value="deals-desc">Most Deals</option>
              <option value="totalListingsValue-desc">Highest Value</option>
              <option value="lastActivityAt-desc">Most Recent Activity</option>
            </select>
          </div>
        </div>

        {/* User Details Section - Appears when user is selected */}
        {selectedUser && (
          <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{selectedUser.username}</h2>
                <p className="text-neutral-600 dark:text-neutral-400">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* User Info */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">User ID:</span>
                  <span className="ml-2 font-mono text-neutral-900 dark:text-white">{selectedUser.id}</span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Created:</span>
                  <span className="ml-2 text-neutral-900 dark:text-white">{formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Last Login:</span>
                  <span className="ml-2 text-neutral-900 dark:text-white">
                    {selectedUser.lastLoginAt ? formatRelativeTime(selectedUser.lastLoginAt) : 'Never'}
                  </span>
                </div>
              </div>
              
              {/* Status & Stats */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
                  <span className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedUser)}`}>
                    {getStatusText(selectedUser)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Thumbs Up:</span>
                  <span className="ml-2 text-neutral-900 dark:text-white">👍 {selectedUser.rating}</span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Deals:</span>
                  <span className="ml-2 text-neutral-900 dark:text-white">🤝 {selectedUser.deals}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowVerifyModal(true); }}
                    disabled={selectedUser.isVerified}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 disabled:opacity-50 transition-colors"
                  >
                    {selectedUser.isVerified ? 'Verified' : 'Verify'}
                  </button>
                  <button
                    onClick={() => { setShowBanModal(true); }}
                    disabled={selectedUser.isBanned}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50 transition-colors"
                  >
                    {selectedUser.isBanned ? 'Banned' : 'Ban'}
                  </button>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Listings:</span>
                  <span className="ml-2 text-neutral-900 dark:text-white">📋 {selectedUser.listingsCount}</span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Total Value:</span>
                  <span className="ml-2 text-neutral-900 dark:text-white">💰 {formatPrice(selectedUser.totalListingsValue)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Users Table with Individual Stat Columns */}
        <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {/* Table Summary */}
          <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                <span className="font-medium">Total Users:</span> {users.length} of {Math.ceil((users.length / itemsPerPage) * itemsPerPage)} 
                {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-500">
                Showing {itemsPerPage} users per page
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('username')}
                  >
                    <div className="flex items-center gap-1">
                      User
                      {sortBy === 'username' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      {sortBy === 'createdAt' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('lastLoginAt')}
                  >
                    <div className="flex items-center gap-1">
                      Last Login
                      {sortBy === 'lastLoginAt' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('listingsCount')}
                  >
                    <div className="flex items-center gap-1">
                      Listings
                      {sortBy === 'listingsCount' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('chatsCount')}
                  >
                    <div className="flex items-center gap-1">
                      Chats
                      {sortBy === 'chatsCount' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('rating')}
                  >
                    <div className="flex items-center gap-1">
                      Rating
                      {sortBy === 'rating' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('deals')}
                  >
                    <div className="flex items-center gap-1">
                      Deals
                      {sortBy === 'deals' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('totalListingsValue')}
                  >
                    <div className="flex items-center gap-1">
                      Total Value
                      {sortBy === 'totalListingsValue' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-4 text-center">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-neutral-600 dark:text-neutral-400">Loading users...</p>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-4 text-center text-neutral-500 dark:text-neutral-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="px-3 py-2">
                        <div className="text-left">
                          <div className="font-medium text-neutral-900 dark:text-white">{user.username}</div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
                        {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never'}
                      </td>
                      <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
                        {user.listingsCount}
                      </td>
                      <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
                        {user.chatsCount}
                      </td>
                      <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
                        👍 {user.rating}
                      </td>
                      <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
                        {user.deals}
                      </td>
                      <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
                        {formatPrice(user.totalListingsValue)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(user)}`}>
                          {getStatusText(user)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setSelectedUser(user); setShowVerifyModal(true); }}
                            disabled={user.isVerified}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 disabled:opacity-50"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => { setSelectedUser(user); setShowBanModal(true); }}
                            disabled={user.isBanned}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50"
                          >
                            Ban
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

          {/* Compact Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center py-3 px-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
              <div className="text-xs text-neutral-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, users.length)} of {users.length} users
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-2 py-1 text-xs text-neutral-600">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            </div>
          )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{selectedUser.username}</h2>
                  <p className="text-neutral-600 dark:text-neutral-400">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Info */}
                <div className="space-y-4">
                  <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">User Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">User ID:</span>
                        <span className="font-mono text-neutral-900 dark:text-white">{selectedUser.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Created:</span>
                        <span className="text-neutral-900 dark:text-white">{formatDate(selectedUser.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Last Login:</span>
                        <span className="text-neutral-900 dark:text-white">
                          {selectedUser.lastLoginAt ? formatRelativeTime(selectedUser.lastLoginAt) : 'Never'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Last Activity:</span>
                        <span className="text-neutral-900 dark:text-white">
                          {selectedUser.lastActivityAt ? formatRelativeTime(selectedUser.lastActivityAt) : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Status & Permissions</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedUser)}`}>
                          {getStatusText(selectedUser)}
                        </span>
                      </div>
                      {selectedUser.isBanned && selectedUser.banReason && (
                        <div className="text-red-600 dark:text-red-400 text-xs">
                          Ban Reason: {selectedUser.banReason}
                        </div>
                      )}
                      {selectedUser.isBanned && selectedUser.banExpiresAt && (
                        <div className="text-red-600 dark:text-red-400 text-xs">
                          Ban Expires: {formatDate(selectedUser.banExpiresAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Stats */}
                <div className="space-y-4">
                  <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Statistics</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-white dark:bg-neutral-600 rounded">
                        <div className="text-2xl font-bold text-blue-600">{selectedUser.listingsCount}</div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">Listings</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-neutral-600 rounded">
                        <div className="text-2xl font-bold text-green-600">{selectedUser.chatsCount}</div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">Chats</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-neutral-600 rounded">
                        <div className="text-2xl font-bold text-purple-600">{selectedUser.messagesCount}</div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">Messages</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-neutral-600 rounded">
                        <div className="text-2xl font-bold text-orange-600">{selectedUser.deals || 0}</div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">Deals</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-neutral-600 rounded">
                        <div className="text-2xl font-bold text-yellow-600">👍 {selectedUser.rating}</div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">Thumbs Up</div>
                      </div>
                    </div>
                    {selectedUser.totalListingsValue > 0 && (
                      <div className="mt-4 text-center p-3 bg-white dark:bg-neutral-600 rounded">
                        <div className="text-2xl font-bold text-green-600">{formatPrice(selectedUser.totalListingsValue)}</div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">Total Value</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User Listings & Chats */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Listings */}
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">
                    Listings ({selectedUser.listingsCount})
                  </h3>
                  {loadingUserData === selectedUser.id ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading listings...</p>
                    </div>
                  ) : userListings[selectedUser.id]?.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {userListings[selectedUser.id].map((listing) => (
                        <div key={listing.id} className="bg-white dark:bg-neutral-600 p-3 rounded border">
                          <div className="font-medium text-sm text-neutral-900 dark:text-white">{listing.title}</div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                            {formatPrice(listing.priceSat)} • {listing.status} • {listing.views} views
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            {formatDate(listing.createdAt)} • {listing.chatsCount} chats
                          </div>
                          <a 
                            href={`/admin/listings?listingId=${listing.id}`}
                            className="text-blue-600 hover:underline text-xs mt-2 inline-block"
                          >
                            View in Admin →
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-neutral-500 dark:text-neutral-400 text-sm">
                      No listings found
                    </div>
                  )}
                </div>

                {/* User Chats */}
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">
                    Chats ({selectedUser.chatsCount})
                  </h3>
                  {loadingUserData === selectedUser.id ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading chats...</p>
                    </div>
                  ) : userChats[selectedUser.id]?.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {userChats[selectedUser.id].map((chat) => (
                        <div key={chat.id} className="bg-white dark:bg-neutral-600 p-3 rounded border">
                          <div className="font-medium text-sm text-neutral-900 dark:text-white">{chat.listingTitle}</div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                            With: {chat.otherUsername}
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            {chat.messageCount} messages • {chat.unreadCount} unread
                          </div>
                          <a 
                            href={`/admin/chats?chatId=${chat.id}`}
                            className="text-orange-600 hover:underline text-xs mt-2 inline-block"
                          >
                            View in Admin →
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-neutral-500 dark:text-neutral-400 text-sm">
                      No chats found
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => { setShowUserModal(false); setShowVerifyModal(true); }}
                  disabled={selectedUser.isVerified}
                  className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                >
                  Verify User
                </button>
                <button
                  onClick={() => { setShowUserModal(false); setShowBanModal(true); }}
                  disabled={selectedUser.isBanned}
                  className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                >
                  Ban User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Modals */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded p-4 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Ban User: {selectedUser.username}</h3>
            <div className="space-y-3">
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Ban reason..."
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
                rows={2}
              />
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
              >
                <option value={1}>1 day</option>
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={-1}>Permanent</option>
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 px-3 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => banUser(selectedUser.id, banReason, banDuration)}
                disabled={!banReason.trim() || isProcessing}
                className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm disabled:opacity-50"
              >
                {isProcessing ? 'Banning...' : 'Ban'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerifyModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded p-4 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Verify User: {selectedUser.username}</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4 text-sm">Grant verified status?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 px-3 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => verifyUser(selectedUser.id)}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 bg-green-500 text-white rounded text-sm disabled:opacity-50"
              >
                {isProcessing ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
