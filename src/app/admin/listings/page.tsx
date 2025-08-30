"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Listing {
  id: string; // Now 10 alphanumeric characters
  title: string;
  description: string;
  priceSat: number;
  adType: string;
  category: string;
  postedBy: string;
  username: string;
  createdAt: number;
  updatedAt: number;
  status: string;
  imageUrl: string;
  location: string;
  views: number;
  favorites: number;
  replies: number;
}

interface Chat {
  id: string; // Now 10 alphanumeric characters
  listingId: string; // Now 10 alphanumeric characters
  buyerId: string; // Now 8 alphanumeric characters
  sellerId: string; // Now 8 alphanumeric characters
  messages: Message[];
  lastMessageAt: number;
}

interface Message {
  id: string; // Now 10 alphanumeric characters
  text: string;
  fromId: string; // Now 8 alphanumeric characters
  createdAt: number;
}

export default function AdminListingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [listingChats, setListingChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'priceSat' | 'views' | 'replies' | 'username' | 'adType' | 'title' | 'location'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
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
  }, [currentPage, isAuthenticated, sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage(1); // Reset to first page when sorting changes
      loadListings();
    }
  }, [sortBy, sortOrder]);

  // Handle navigation from other admin pages
  useEffect(() => {
    if (isAuthenticated && listings.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const listingId = urlParams.get('listing');
      const listingTitle = urlParams.get('title');
      
      if (listingId || listingTitle) {
        const foundListing = listings.find(listing => 
          listing.id === listingId || listing.title === listingTitle
        );
        
        if (foundListing && foundListing !== selectedListing) {
          setSelectedListing(foundListing);
          loadListingChats(foundListing.id);
        }
      }
      
      // Set search query if title parameter is present
      if (listingTitle) {
        setSearchQuery(listingTitle);
      }
    }
  }, [isAuthenticated, listings, selectedListing]);

  const loadListings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const offset = (currentPage - 1) * itemsPerPage;
      console.log('🔍 Loading listings - Page:', currentPage, 'Items per page:', itemsPerPage, 'Offset:', offset);
      
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`/api/admin/listings/list?limit=${itemsPerPage}&offset=${offset}&sortBy=${sortBy}&sortOrder=${sortOrder}${searchParam}`);
      
      if (response.ok) {
        const data: any = await response.json();
        console.log('🔍 Listings loaded successfully:', data);
        
        if (data.success && data.listings) {
          setListings(data.listings);
          setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
          console.log('✅ Set listings:', data.listings.length, 'Total pages:', Math.ceil((data.total || 0) / itemsPerPage));
        } else {
          console.error('❌ API returned success but no listings:', data);
          setError('No listings data received');
          setListings([]);
        }
      } else {
        console.error('❌ API request failed:', response.status, response.statusText);
        setError(`Failed to load listings: ${response.status}`);
        setListings([]);
      }
    } catch (error) {
      console.error('❌ Error loading listings:', error);
      setError('Failed to load listings');
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString();
  const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleTimeString();

  const loadListingChats = async (listingId: string) => {
    try {
      setIsLoadingChats(true);
      setListingChats([]);
      
      // For now, we'll create mock chat data since the API structure has changed
      // In a real implementation, you'd fetch from /api/admin/listings/[listingId]/chats
      const mockChats: Chat[] = [
        {
          id: 'chat1234567',
          listingId: listingId,
          buyerId: 'buyer123',
          sellerId: 'seller456',
          messages: [
            {
              id: 'msg1234567',
              text: 'Is this still available?',
              fromId: 'buyer123',
              createdAt: Date.now() / 1000 - 3600
            },
            {
              id: 'msg2345678',
              text: 'Yes, it is! When would you like to meet?',
              fromId: 'seller456',
              createdAt: Date.now() / 1000 - 1800
            }
          ],
          lastMessageAt: Date.now() / 1000 - 1800
        }
      ];
      
      setListingChats(mockChats);
    } catch (error) {
      console.error('Error loading listing chats:', error);
      setListingChats([]);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const handleListingClick = (listing: Listing) => {
    setSelectedListing(listing);
    loadListingChats(listing.id);
  };

  const handleSort = (column: 'createdAt' | 'priceSat' | 'views' | 'replies' | 'username' | 'adType' | 'title' | 'location') => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column with default desc order
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleSearch = async () => {
    setCurrentPage(1); // Reset to first page when searching
    loadListings();
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
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-xs flex-1"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
              >
                Search
              </button>
              <select className="px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-xs">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="expired">Expired</option>
              </select>
              <select className="px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-xs">
                <option value="all">All Types</option>
                <option value="sell">Sell</option>
                <option value="want">Want</option>
              </select>
              <button
                onClick={loadListings}
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

        {/* Selected Listing Details Section */}
        <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 p-4 mb-3">
          {selectedListing ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Selected Listing: {selectedListing.title}
                </h2>
                <button
                  onClick={() => {
                    setSelectedListing(null);
                    setListingChats([]);
                  }}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Listing ID</label>
                  <div className="text-sm text-neutral-900 dark:text-white font-mono">{selectedListing.id}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Posted By</label>
                  <div className="text-sm text-neutral-900 dark:text-white">{selectedListing.username || selectedListing.postedBy}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Type</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    selectedListing.adType === 'want' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {selectedListing.adType === 'want' ? 'Want' : 'Sell'}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Category</label>
                  <div className="text-sm text-neutral-900 dark:text-white">{selectedListing.category}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Price</label>
                  <div className="text-sm font-bold text-green-600">{selectedListing.priceSat.toLocaleString()} sats</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Location</label>
                  <div className="text-sm text-neutral-900 dark:text-white">{selectedListing.location || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Views</label>
                  <div className="text-sm text-neutral-900 dark:text-white">{selectedListing.views.toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Chats</label>
                  <div className="text-sm text-neutral-900 dark:text-white">{selectedListing.replies.toLocaleString()}</div>
                </div>
              </div>
              
              {/* Description */}
              <div className="mb-4">
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Description</label>
                <div className="text-sm text-neutral-900 dark:text-white mt-1">{selectedListing.description || 'No description provided'}</div>
              </div>
              
              {/* Listing Chats */}
              <div>
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Recent Chats ({listingChats.length})</label>
                <div className="mt-2 space-y-2">
                  {isLoadingChats ? (
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">Loading chats...</div>
                  ) : listingChats.length > 0 ? (
                    listingChats.map((chat) => (
                      <div key={chat.id} className="bg-neutral-50 dark:bg-neutral-700 rounded p-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-900 dark:text-white">
                            Chat with {chat.buyerId === selectedListing.postedBy ? 'buyer' : 'seller'}
                          </span>
                          <span className="text-neutral-500 dark:text-neutral-400">
                            {chat.messages.length} messages
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">No chats yet</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-neutral-400 dark:text-neutral-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-600 dark:text-neutral-400 mb-1">No Listing Selected</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">
                Click on any listing row below to view its details here
              </p>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full space-y-0 font-mono text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr className="h-6">
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
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
                  <th className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">ID</th>
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
                    onClick={() => handleSort('adType')}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      {sortBy === 'adType' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-1">
                      Title
                      {sortBy === 'title' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center gap-1">
                      Location
                      {sortBy === 'location' && (
                        <span className="text-orange-500">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
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
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
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
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                    onClick={() => handleSort('replies')}
                  >
                    <div className="flex items-center gap-1">
                      Chats
                      {sortBy === 'replies' && (
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
                      <p className="text-neutral-600 dark:text-neutral-400">Loading listings...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      {error}
                    </td>
                  </tr>
                ) : listings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      No listings found
                    </td>
                  </tr>
                ) : (
                  <>
                    {listings.map((listing) => (
                      <tr 
                        key={listing.id} 
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded px-1.5 -mx-1.5 transition-colors cursor-pointer"
                        onClick={() => handleListingClick(listing)}
                      >
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-600 dark:text-neutral-400">
                            {formatDate(listing.createdAt)}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="font-mono text-xs text-neutral-900 dark:text-white">
                            {listing.id}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/users?search=${listing.username || listing.postedBy}`);
                            }}
                            className="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            {listing.username || listing.postedBy}
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            listing.adType === 'want' 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                            {listing.adType === 'want' ? 'Want' : 'Sell'}
                          </span>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="max-w-xs truncate">
                            <div className="font-medium text-neutral-900 dark:text-white text-xs truncate" title={listing.title}>
                              {listing.title}
                            </div>
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-900 dark:text-white">
                            {listing.location || 'N/A'}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-900 dark:text-white font-bold text-green-600">
                            {listing.priceSat.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-900 dark:text-white">
                            {listing.views.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-900 dark:text-white">
                            {listing.replies.toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Fill remaining rows to maintain 20 row height */}
                    {Array.from({ length: Math.max(0, 20 - listings.length) }).map((_, index) => (
                      <tr key={`empty-${index}`} className="h-6">
                        <td colSpan={9} className="px-1.5 py-0.5">
                          <div className="h-6"></div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center py-2 px-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            {listings.length} listings • Page {currentPage} of {totalPages}
          </div>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-1.5 py-0.5 rounded text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-1.5 py-0.5 rounded text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-1.5 py-0.5 rounded text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-1.5 py-0.5 rounded text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
