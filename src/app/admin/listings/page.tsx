"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { t } from "@/lib/i18n";

interface Listing {
  id: string;
  title: string;
  description: string;
  priceSat: number;
  adType: 'sell' | 'want';
  category: string;
  postedBy: string;
  postedByUsername: string;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'sold' | 'expired';
  imageUrl?: string;
  location?: string;
  views: number;
  favorites: number;
  chatsCount: number;
  messagesCount: number;
  lastActivityAt?: number;
}

interface ChatSummary {
  id: string;
  buyerUsername: string;
  sellerUsername: string;
  buyer_id: string;
  seller_id: string;
  lastMessageAt: number;
  messageCount: number;
  unreadCount: number;
}

interface ListingsResponse {
  success: boolean;
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminListingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'sold' | 'expired'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sell' | 'want'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'priceSat' | 'views' | 'chatsCount' | 'lastActivityAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const [listingChats, setListingChats] = useState<{ [key: string]: ChatSummary[] }>({});
  const [loadingChats, setLoadingChats] = useState<string | null>(null);
  
  const router = useRouter();
  const lang = useLang();

  // Check admin authentication
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadListings();
    } else {
      router.push('/admin');
    }
  }, [router]);

  const loadListings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/listings/list');
      if (response.ok) {
        const data: ListingsResponse = await response.json();
        setListings(data.listings || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadListingChats = async (listingId: string) => {
    if (listingChats[listingId]) return; // Already loaded
    
    try {
      setLoadingChats(listingId);
      const response = await fetch(`/api/admin/listings/${listingId}/chats`);
      if (response.ok) {
        const data = await response.json() as { chats: ChatSummary[] };
        setListingChats(prev => ({
          ...prev,
          [listingId]: data.chats || []
        }));
      }
    } catch (error) {
      console.error('Error loading listing chats:', error);
    } finally {
      setLoadingChats(null);
    }
  };

  const toggleListingExpansion = (listingId: string) => {
    if (expandedListing === listingId) {
      setExpandedListing(null);
    } else {
      setExpandedListing(listingId);
      loadListingChats(listingId);
    }
  };

  const deleteListing = async (listingId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch('/api/admin/listings/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId })
      });

      if (response.ok) {
        setListings(prev => prev.filter(l => l.id !== listingId));
        setShowDeleteModal(false);
        setSelectedListing(null);
        setExpandedListing(null);
        setListingChats(prev => {
          const { [listingId]: removed, ...rest } = prev;
          return rest;
        });
      } else {
        console.error('Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.postedByUsername.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    const matchesType = typeFilter === 'all' || listing.adType === typeFilter;
    const matchesCategory = categoryFilter === 'all' || listing.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesCategory;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'createdAt':
        aValue = a.createdAt;
        bValue = b.createdAt;
        break;
      case 'updatedAt':
        aValue = a.updatedAt;
        bValue = b.updatedAt;
        break;
      case 'priceSat':
        aValue = a.priceSat;
        bValue = b.priceSat;
        break;
      case 'views':
        aValue = a.views;
        bValue = b.views;
        break;
      case 'chatsCount':
        aValue = a.chatsCount;
        bValue = b.chatsCount;
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

  const paginatedListings = sortedListings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatPrice = (priceSat: number) => {
    return `${priceSat.toLocaleString()} sats`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp * 1000;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'sold': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sell': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'want': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200';
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-200/50 dark:border-neutral-700/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Listings Management</h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mt-2">Comprehensive overview of all platform listings with chat analytics</p>
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Search Listings
              </label>
              <input
                type="text"
                placeholder="Search listings, descriptions, or usernames..."
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
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm shadow-sm"
              >
                <option value="all">All Types</option>
                <option value="sell">Sell</option>
                <option value="want">Want</option>
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
                <option value="updatedAt-desc">Recently Updated</option>
                <option value="priceSat-desc">Highest Price</option>
                <option value="priceSat-asc">Lowest Price</option>
                <option value="views-desc">Most Views</option>
                <option value="chatsCount-desc">Most Chats</option>
                <option value="lastActivityAt-desc">Most Active</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Listings Table */}
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-500 to-amber-500">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    Listing Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    User & Stats
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    Engagement
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
                      <p className="text-neutral-600 dark:text-neutral-400 text-lg">Loading listings...</p>
                    </td>
                  </tr>
                ) : paginatedListings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400 text-lg">
                      No listings found matching your criteria
                    </td>
                  </tr>
                ) : (
                  paginatedListings.map((listing) => (
                    <React.Fragment key={listing.id}>
                      <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-700/50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                              {listing.imageUrl ? (
                                <img 
                                  src={listing.imageUrl} 
                                  alt={listing.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-neutral-900 dark:text-white text-lg mb-2">
                                {listing.title}
                              </h4>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 max-w-md mb-3">
                                {listing.description}
                              </p>
                              <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${getTypeColor(listing.adType)}`}>
                                  {listing.adType === 'want' ? '🔍 Looking For' : '💰 Selling'}
                                </span>
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${getStatusColor(listing.status)}`}>
                                  {listing.status === 'active' ? '✅ Active' : listing.status === 'sold' ? '🎯 Sold' : '⏰ Expired'}
                                </span>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200">
                                  📂 {listing.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                {listing.postedByUsername.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-neutral-900 dark:text-white text-sm">
                                  {listing.postedByUsername}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-500 font-mono">
                                  ID: {listing.postedBy.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatPrice(listing.priceSat)}
                              </div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">Price</div>
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-500 space-y-1">
                              <p>📅 Created: {formatDate(listing.createdAt)}</p>
                              {listing.updatedAt !== listing.createdAt && (
                                <p>🔄 Updated: {formatDate(listing.updatedAt)}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{listing.views}</div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">Views</div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{listing.favorites}</div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">Favorites</div>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{listing.chatsCount}</div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">Chats</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{listing.messagesCount}</div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">Messages</div>
                            </div>
                          </div>
                          {listing.lastActivityAt && (
                            <div className="mt-3 text-center">
                              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                📍 Last activity: {formatRelativeTime(listing.lastActivityAt)}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() => toggleListingExpansion(listing.id)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-md"
                            >
                              {expandedListing === listing.id ? '👁️ Hide' : '🔍 View'} Chats
                            </button>
                            <button
                              onClick={() => {
                                setSelectedListing(listing);
                                setShowDeleteModal(true);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 hover:scale-105 shadow-md"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Chat Information */}
                      {expandedListing === listing.id && (
                        <tr>
                          <td colSpan={4} className="px-6 py-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                            <div className="border-l-4 border-orange-500 pl-6">
                              <h5 className="font-bold text-neutral-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                                💬 Chat Conversations ({listing.chatsCount})
                              </h5>
                              
                              {loadingChats === listing.id ? (
                                <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                  Loading chats...
                                </div>
                              ) : listingChats[listing.id]?.length > 0 ? (
                                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                                  {listingChats[listing.id].map((chat) => (
                                    <div key={chat.id} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-700 rounded-xl border border-neutral-200 dark:border-neutral-600 shadow-sm">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-600 dark:text-blue-400 font-semibold">👤 Buyer:</span>
                                            <span className="font-medium">{chat.buyerUsername || chat.buyer_id}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-green-600 dark:text-green-400 font-semibold">💬 Seller:</span>
                                            <span className="font-medium">{chat.sellerUsername || chat.seller_id}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                                          <span>📨 {chat.messageCount} messages</span>
                                          <span>🔴 {chat.unreadCount} unread</span>
                                          <span>⏰ {formatRelativeTime(chat.lastMessageAt)}</span>
                                        </div>
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
                                  No chat conversations for this listing yet.
                                </p>
                              )}
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredListings.length)} of {filteredListings.length} listings
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedListing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
              🗑️ Delete Listing
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-lg">
              Are you sure you want to delete &quot;{selectedListing.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteListing(selectedListing.id)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
