"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Listing {
  id: string;
  title: string;
  description: string;
  priceSat: number;
  adType: 'sell' | 'want';
  category: string;
  postedBy: string;
  username: string;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'sold' | 'expired';
  imageUrl?: string;
  location?: string;
  views: number;
  favorites: number;
  replies: number;
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
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'priceSat' | 'views' | 'replies'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadListings();
    } else {
      router.push('/admin');
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadListings();
    }
  }, [currentPage, isAuthenticated]);

  const loadListings = async () => {
    try {
      setIsLoading(true);
      const offset = (currentPage - 1) * itemsPerPage;
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      
      console.log('🔍 Loading listings with params:', params.toString());
      const response = await fetch(`/api/admin/listings/list?${params.toString()}`);
      
      if (response.ok) {
        const data: ListingsResponse = await response.json();
        console.log('🔍 Listings API response:', data);
        setListings(data.listings || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } else {
        console.error('🔍 Listings API error:', response.status, response.statusText);
        // Fallback to empty state
        setListings([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      // Fallback to empty state
      setListings([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
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
      } else {
        console.error('Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const bulkDeleteListings = async () => {
    if (selectedListings.size === 0) return;
    
    try {
      setIsBulkDeleting(true);
      const listingIds = Array.from(selectedListings);
      
      for (const listingId of listingIds) {
        const response = await fetch('/api/admin/listings/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId })
        });
        
        if (response.ok) {
          setListings(prev => prev.filter(l => l.id !== listingId));
        }
      }
      
      setSelectedListings(new Set());
    } catch (error) {
      console.error('Error bulk deleting listings:', error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleListingSelection = (listingId: string) => {
    setSelectedListings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listingId)) {
        newSet.delete(listingId);
      } else {
        newSet.add(listingId);
      }
      return newSet;
    });
  };

  const toggleAllListings = () => {
    if (selectedListings.size === listings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(listings.map(l => l.id)));
    }
  };

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
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Listings Management</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Total: {listings.length} | Page {currentPage} of {totalPages}
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-sm hover:bg-neutral-300 dark:hover:bg-neutral-600"
            >
              Admin dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Filters */}
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
            >
              <option value="all">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="books">Books</option>
              <option value="clothing">Clothing</option>
              <option value="home">Home & Garden</option>
              <option value="sports">Sports</option>
              <option value="vehicles">Vehicles</option>
              <option value="other">Other</option>
            </select>
            <button
              onClick={loadListings}
              disabled={isLoading}
              className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedListings.size > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-800 dark:text-orange-200">
                {selectedListings.size} listing(s) selected
              </span>
              <button
                onClick={bulkDeleteListings}
                disabled={isBulkDeleting}
                className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
              >
                {isBulkDeleting ? 'Deleting...' : `Delete ${selectedListings.size} Selected`}
              </button>
            </div>
          </div>
        )}

        {/* Listings Table */}
        <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-700">
                  <th className="px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedListings.size === listings.length && listings.length > 0}
                      onChange={toggleAllListings}
                      className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-3 py-2 text-left">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                    >
                      Date
                      {sortBy === 'createdAt' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">User</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Title</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Location</th>
                  <th className="px-3 py-2 text-left">
                    <button
                      onClick={() => handleSort('priceSat')}
                      className="flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                    >
                      Price
                      {sortBy === 'priceSat' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left">
                    <button
                      onClick={() => handleSort('views')}
                      className="flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                    >
                      Views
                      {sortBy === 'views' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left">
                    <button
                      onClick={() => handleSort('replies')}
                      className="flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                    >
                      Replies
                      {sortBy === 'replies' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={13} className="px-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Loading listings...
                      </div>
                    </td>
                  </tr>
                ) : listings.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      No listings found
                    </td>
                  </tr>
                ) : (
                  listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedListings.has(listing.id)}
                          onChange={() => toggleListingSelection(listing.id)}
                          className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">
                          {formatDate(listing.createdAt)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {formatRelativeTime(listing.createdAt)}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium text-neutral-900 dark:text-white">
                          {listing.username || listing.postedBy}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeColor(listing.adType)}`}>
                          {listing.adType === 'want' ? 'Want' : 'Sell'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="max-w-xs">
                          <div className="font-medium text-neutral-900 dark:text-white text-sm">{listing.title}</div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">{listing.description}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs text-neutral-500 px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">
                          {listing.category}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-neutral-900 dark:text-white">
                          {listing.location || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm font-bold text-green-600">
                          {formatPrice(listing.priceSat)}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-neutral-900 dark:text-white">
                          {listing.views.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-neutral-900 dark:text-white">
                          {listing.replies.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(listing.status)}`}>
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => { setSelectedListing(listing); setShowDetailsModal(true); }}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                          >
                            Details
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center py-3 px-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
              <div className="text-xs text-neutral-600">
                Page {currentPage} of {totalPages} | {listings.length} listings
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

      {/* Details Modal */}
      {showDetailsModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Listing Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Images and Basic Info */}
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Images</h4>
                {selectedListing.imageUrl ? (
                  <div className="space-y-2">
                    <img 
                      src={selectedListing.imageUrl} 
                      alt={selectedListing.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                    <span className="text-neutral-500 dark:text-neutral-400">No images</span>
                  </div>
                )}
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Type:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(selectedListing.adType)}`}>
                      {selectedListing.adType === 'want' ? 'Want' : 'Sell'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Category:</span>
                    <span className="text-neutral-900 dark:text-white">{selectedListing.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Location:</span>
                    <span className="text-neutral-900 dark:text-white">{selectedListing.location || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedListing.status)}`}>
                      {selectedListing.status}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Details */}
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Title</label>
                    <p className="text-neutral-900 dark:text-white">{selectedListing.title}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                    <p className="text-neutral-900 dark:text-white text-sm">{selectedListing.description}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Price</label>
                    <p className="text-2xl font-bold text-green-600">{formatPrice(selectedListing.priceSat)}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Views</label>
                      <p className="text-neutral-900 dark:text-white">{selectedListing.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Replies</label>
                      <p className="text-neutral-900 dark:text-white">{selectedListing.replies.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Posted By</label>
                    <p className="text-neutral-900 dark:text-white">{selectedListing.username || selectedListing.postedBy}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Created</label>
                      <p className="text-neutral-900 dark:text-white">{formatDate(selectedListing.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Updated</label>
                      <p className="text-neutral-900 dark:text-white">{formatDate(selectedListing.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Delete Listing</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to delete "{selectedListing.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteListing(selectedListing.id)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
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
