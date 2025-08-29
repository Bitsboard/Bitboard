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
  const [itemsPerPage] = useState(50);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const [listingChats, setListingChats] = useState<{ [key: string]: ChatSummary[] }>({});
  const [loadingChats, setLoadingChats] = useState<string | null>(null);
  
  const router = useRouter();
  const lang = useLang();

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
    if (listingChats[listingId]) return;
    
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
      case 'createdAt': aValue = a.createdAt; bValue = b.createdAt; break;
      case 'updatedAt': aValue = a.updatedAt; bValue = b.updatedAt; break;
      case 'priceSat': aValue = a.priceSat; bValue = b.priceSat; break;
      case 'views': aValue = a.views; bValue = b.views; break;
      case 'chatsCount': aValue = a.chatsCount; bValue = b.chatsCount; break;
      case 'lastActivityAt': aValue = a.lastActivityAt || 0; bValue = b.lastActivityAt || 0; break;
      default: aValue = a.createdAt; bValue = b.createdAt;
    }
    
    return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
  });

  const paginatedListings = sortedListings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatPrice = (priceSat: number) => `${priceSat.toLocaleString()} sats`;
  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString();
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
      {/* Compact Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Listings Management</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Listings: {listings.length} | Active: {listings.filter(l => l.status === 'active').length} | Sold: {listings.filter(l => l.status === 'sold').length}</p>
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
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="sell">Sell</option>
              <option value="want">Want</option>
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
              <option value="priceSat-desc">Highest Price</option>
              <option value="views-desc">Most Views</option>
              <option value="chatsCount-desc">Most Chats</option>
            </select>
          </div>
        </div>

        {/* Compact Listings Table */}
        <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Listing</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">User & Price</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Stats</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-neutral-600 dark:text-neutral-400">Loading listings...</p>
                    </td>
                  </tr>
                ) : paginatedListings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      No listings found
                    </td>
                  </tr>
                ) : (
                  paginatedListings.map((listing) => (
                    <React.Fragment key={listing.id}>
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                        <td className="px-3 py-2">
                          <div>
                            <div className="font-medium text-neutral-900 dark:text-white">{listing.title}</div>
                            <div className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1 max-w-xs">{listing.description}</div>
                            <div className="flex gap-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeColor(listing.adType)}`}>
                                {listing.adType === 'want' ? 'Looking For' : 'Selling'}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(listing.status)}`}>
                                {listing.status}
                              </span>
                              <span className="text-xs text-neutral-500">{listing.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            <div className="font-medium text-neutral-900 dark:text-white">{listing.postedByUsername}</div>
                            <div className="text-xs text-neutral-500">ID: {listing.postedBy.slice(0, 8)}...</div>
                            <div className="text-sm font-bold text-green-600">{formatPrice(listing.priceSat)}</div>
                            <div className="text-xs text-neutral-500">
                              {formatDate(listing.createdAt)}
                              {listing.updatedAt !== listing.createdAt && ` (updated: ${formatDate(listing.updatedAt)})`}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs space-y-1">
                            <div>👁️ {listing.views} views</div>
                            <div>⭐ {listing.favorites} favorites</div>
                            <div>💬 {listing.chatsCount} chats</div>
                            <div>📨 {listing.messagesCount} messages</div>
                            {listing.lastActivityAt && (
                              <div className="text-neutral-500">📍 {formatRelativeTime(listing.lastActivityAt)}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => toggleListingExpansion(listing.id)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                            >
                              {expandedListing === listing.id ? 'Hide' : 'View'} Chats
                            </button>
                            <button
                              onClick={() => { setSelectedListing(listing); setShowDeleteModal(true); }}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Chat Data */}
                      {expandedListing === listing.id && (
                        <tr>
                          <td colSpan={4} className="px-3 py-3 bg-neutral-50 dark:bg-neutral-700">
                            <div className="border-l-4 border-orange-500 pl-3">
                              <h5 className="font-medium text-neutral-900 dark:text-white text-sm mb-2">
                                Chat Conversations ({listing.chatsCount})
                              </h5>
                              
                              {loadingChats === listing.id ? (
                                <div className="text-xs text-neutral-600">Loading...</div>
                              ) : listingChats[listing.id]?.length > 0 ? (
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {listingChats[listing.id].map((chat) => (
                                    <div key={chat.id} className="text-xs bg-white dark:bg-neutral-600 p-2 rounded border">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex gap-4 text-neutral-600">
                                            <span><strong>Buyer:</strong> {chat.buyerUsername || chat.buyer_id.slice(0, 8)}</span>
                                            <span><strong>Seller:</strong> {chat.sellerUsername || chat.seller_id.slice(0, 8)}</span>
                                          </div>
                                          <div className="text-neutral-500 mt-1">
                                            {chat.messageCount} messages • {chat.unreadCount} unread • {formatRelativeTime(chat.lastMessageAt)}
                                          </div>
                                        </div>
                                        <a
                                          href={`/admin/chats?chatId=${chat.id}`}
                                          className="text-orange-600 hover:underline ml-2"
                                        >
                                          View →
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-neutral-500">No chat conversations</div>
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

          {/* Compact Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center py-3 px-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
              <div className="text-xs text-neutral-600">
                Page {currentPage} of {totalPages} | {filteredListings.length} listings
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
      </div>

      {/* Compact Delete Modal */}
      {showDeleteModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded p-4 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Delete Listing</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4 text-sm">
              Delete &quot;{selectedListing.title}&quot;? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-3 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteListing(selectedListing.id)}
                disabled={isDeleting}
                className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm disabled:opacity-50"
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
