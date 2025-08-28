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
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check');
        if (response.ok) {
          const data = await response.json() as { isAdmin: boolean };
          if (data.isAdmin) {
            setIsAuthenticated(true);
            loadListings();
          } else {
            router.push('/admin');
          }
        } else {
          router.push('/admin');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin');
      }
    };

    checkAuth();
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Admin - Listings Management</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Comprehensive overview of all platform listings with chat analytics</p>
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search listings, descriptions, or usernames..."
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
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="all">All Types</option>
                <option value="sell">Sell</option>
                <option value="want">Want</option>
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
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Listing Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    User & Stats
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Engagement
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
                      <p className="text-neutral-600 dark:text-neutral-400">Loading listings...</p>
                    </td>
                  </tr>
                ) : paginatedListings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      No listings found matching your criteria
                    </td>
                  </tr>
                ) : (
                  paginatedListings.map((listing) => (
                    <React.Fragment key={listing.id}>
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center overflow-hidden">
                              {listing.imageUrl ? (
                                <img 
                                  src={listing.imageUrl} 
                                  alt={listing.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral-900 dark:text-white text-sm">
                                {listing.title}
                              </h4>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-xs">
                                {listing.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(listing.adType)}`}>
                                  {listing.adType}
                                </span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
                                  {listing.status}
                                </span>
                                <span className="text-xs text-neutral-500 dark:text-neutral-500">
                                  {listing.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white text-sm">
                              {listing.postedByUsername}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              ID: {listing.postedBy}
                            </p>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                              {formatPrice(listing.priceSat)}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              Created: {formatDate(listing.createdAt)}
                            </p>
                            {listing.updatedAt !== listing.createdAt && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                Updated: {formatDate(listing.updatedAt)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-600 dark:text-neutral-400">Views:</span>
                              <span className="font-medium">{listing.views}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-600 dark:text-neutral-400">Favorites:</span>
                              <span className="font-medium">{listing.favorites}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-600 dark:text-neutral-400">Chats:</span>
                              <span className="font-medium text-orange-600">{listing.chatsCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-600 dark:text-neutral-400">Messages:</span>
                              <span className="font-medium">{listing.messagesCount}</span>
                            </div>
                            {listing.lastActivityAt && (
                              <div className="text-xs text-neutral-500 dark:text-neutral-500">
                                Last activity: {formatRelativeTime(listing.lastActivityAt)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => toggleListingExpansion(listing.id)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                            >
                              {expandedListing === listing.id ? 'Hide' : 'View'} Chats
                            </button>
                            <button
                              onClick={() => {
                                setSelectedListing(listing);
                                setShowDeleteModal(true);
                              }}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Chat Information */}
                      {expandedListing === listing.id && (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800">
                            <div className="border-l-4 border-orange-500 pl-4">
                              <h5 className="font-medium text-neutral-900 dark:text-white text-sm mb-2">
                                Chat Conversations ({listing.chatsCount})
                              </h5>
                              
                              {loadingChats === listing.id ? (
                                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                  Loading chats...
                                </div>
                              ) : listingChats[listing.id]?.length > 0 ? (
                                <div className="space-y-2">
                                  {listingChats[listing.id].map((chat) => (
                                    <div key={chat.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-700 rounded border">
                                      <div className="flex-1">
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                          <span className="font-medium">Buyer:</span> {chat.buyerUsername}
                                        </p>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                          <span className="font-medium">Seller:</span> {chat.sellerUsername}
                                        </p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                          {chat.messageCount} messages • {chat.unreadCount} unread
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-neutral-500 dark:text-neutral-500">
                                          {formatRelativeTime(chat.lastMessageAt)}
                                        </span>
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
            <div className="flex justify-between items-center py-4 px-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredListings.length)} of {filteredListings.length} listings
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Delete Listing
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to delete &quot;{selectedListing.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteListing(selectedListing.id)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
