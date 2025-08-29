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
  const [itemsPerPage] = useState(100);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
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
      console.log('🔍 Loading listings with limit:', itemsPerPage);
      const response = await fetch(`/api/admin/listings/list?limit=${itemsPerPage}`);
      if (response.ok) {
        const data: ListingsResponse = await response.json();
        console.log('🔍 Listings API response:', data);
        setListings(data.listings || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } else {
        console.error('🔍 Listings API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
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
        setSelectedListings(prev => {
          const newSet = new Set(prev);
          newSet.delete(listingId);
          return newSet;
        });
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
      
      // Delete each listing
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
      setShowDeleteModal(false);
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
    if (selectedListings.size === filteredListings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(filteredListings.map(l => l.id)));
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.username.toLowerCase().includes(searchTerm.toLowerCase());
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
      case 'replies': aValue = a.replies; bValue = b.replies; break;
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
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Listings Management</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Total: {listings.length} | Active: {listings.filter(l => l.status === 'active').length} | 
                Sold: {listings.filter(l => l.status === 'sold').length} | Expired: {listings.filter(l => l.status === 'expired').length}
              </p>
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
        {/* Bulk Action Buttons */}
        {selectedListings.size > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-orange-800 dark:text-orange-200">
                <strong>{selectedListings.size}</strong> listing{selectedListings.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isBulkDeleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
                >
                  {isBulkDeleting ? 'Deleting...' : `Delete ${selectedListings.size} Listing${selectedListings.size !== 1 ? 's' : ''}`}
                </button>
                <button
                  onClick={() => setSelectedListings(new Set())}
                  className="px-4 py-2 bg-neutral-500 text-white rounded-lg text-sm hover:bg-neutral-600"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Mining Gear">Mining Gear</option>
              <option value="Home & Garden">Home & Garden</option>
              <option value="Sports & Bikes">Sports & Bikes</option>
              <option value="Tools">Tools</option>
              <option value="Games & Hobbies">Games & Hobbies</option>
              <option value="Furniture">Furniture</option>
              <option value="Services">Services</option>
            </select>
          </div>
        </div>

        {/* Enhanced Listings Table with Individual Stat Columns */}
        <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {/* Table Summary */}
          <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                <span className="font-medium">Total Listings:</span> {listings.length} of {Math.ceil((listings.length / itemsPerPage) * itemsPerPage)} 
                {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-500">
                Showing {itemsPerPage} listings per page
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    <input
                      type="checkbox"
                      checked={selectedListings.size === filteredListings.length && filteredListings.length > 0}
                      onChange={toggleAllListings}
                      className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
                    />
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      Timestamp
                      {sortBy === 'createdAt' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Username</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Listing Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Location</th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('priceSat')}
                  >
                    <div className="flex items-center gap-1">
                      Price
                      {sortBy === 'priceSat' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('views')}
                  >
                    <div className="flex items-center gap-1">
                      Views
                      {sortBy === 'views' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('replies')}
                  >
                    <div className="flex items-center gap-1">
                      Replies
                      {sortBy === 'replies' && (
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
                    <td colSpan={13} className="px-3 py-8 text-center">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-neutral-600 dark:text-neutral-400">Loading listings...</p>
                    </td>
                  </tr>
                ) : paginatedListings.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      No listings found
                    </td>
                  </tr>
                ) : (
                  paginatedListings.map((listing) => (
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
              
              {/* Right Column - Description and Stats */}
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Description</h4>
                <p className="text-neutral-700 dark:text-neutral-300 mb-4 whitespace-pre-wrap">
                  {selectedListing.description || 'No description provided'}
                </p>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Price:</span>
                    <span className="font-bold text-green-600">{formatPrice(selectedListing.priceSat)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Views:</span>
                    <span className="text-neutral-900 dark:text-white">{selectedListing.views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Replies:</span>
                    <span className="text-neutral-900 dark:text-white">{selectedListing.replies.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Posted by:</span>
                    <span className="text-neutral-900 dark:text-white">{selectedListing.username || selectedListing.postedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Created:</span>
                    <span className="text-neutral-900 dark:text-white">{formatDate(selectedListing.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Updated:</span>
                    <span className="text-neutral-900 dark:text-white">{formatDate(selectedListing.updatedAt)}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Chats</h4>
                  <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-3">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      This listing has <strong>{selectedListing.replies}</strong> chat{selectedListing.replies !== 1 ? 's' : ''}.
                    </p>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        router.push('/admin/chats');
                      }}
                      className="mt-2 px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                    >
                      View All Chats
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded p-4 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">
              {selectedListing ? 'Delete Listing' : `Delete ${selectedListings.size} Listing${selectedListings.size !== 1 ? 's' : ''}`}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4 text-sm">
              {selectedListing 
                ? `Delete "${selectedListing.title}"? This cannot be undone.`
                : `Are you sure you want to delete ${selectedListings.size} listing${selectedListings.size !== 1 ? 's' : ''}? This action cannot be undone.`
              }
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-3 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedListing) {
                    deleteListing(selectedListing.id);
                  } else {
                    bulkDeleteListings();
                  }
                }}
                disabled={isDeleting || isBulkDeleting}
                className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm disabled:opacity-50"
              >
                {isDeleting || isBulkDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
