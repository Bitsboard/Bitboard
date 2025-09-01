"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon } from "@/components/ExternalLinkIcon";
import { Toast } from "@/components/Toast";

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
  images?: string[]; // Added for multiple images
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
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [listingChats, setListingChats] = useState<any[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'priceSat' | 'views' | 'replies' | 'username' | 'adType' | 'title' | 'location'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [listingImages, setListingImages] = useState<string[]>([]);
  const [isSearchingForListing, setIsSearchingForListing] = useState(false);
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Helper function to format price display
  const formatPrice = (priceSat: number) => {
    if (priceSat === -1) {
      return "Make an offer";
    }
    return `${priceSat.toLocaleString()}`;
  };

  // Check if we need to search for a specific listing (e.g., from activity feed)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const listingTitle = urlParams.get('title');
    const listingId = urlParams.get('id');
    
    if (listingTitle || listingId) {
  
      searchAndSelectListing(listingTitle, listingId);
    }
  }, []);

  const searchAndSelectListing = async (title?: string | null, id?: string | null) => {
    if (!title && !id) return;
    
    setIsSearchingForListing(true);
    try {
      // Build search parameters
      const params = new URLSearchParams();
      params.append('limit', '1000');
      
      if (id) {
        // Search by ID for exact match
        params.append('id', id);
      } else if (title) {
        // Search by title
        params.append('q', title);
      }
      
      const response = await fetch(`/api/admin/listings/list?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json() as { 
          success: boolean; 
          listings?: any[]; 
          total?: number;
        };
        
        if (data.success && data.listings && data.listings.length > 0) {
          // Find the exact match
          let targetListing = null;
          
          if (id) {
            // Search by ID first - should be exact match
            targetListing = data.listings.find((l: any) => l.id === id);
          }
          
          if (!targetListing && title) {
            // Search by title if ID not found
            targetListing = data.listings.find((l: any) => 
              l.title.toLowerCase().includes(title.toLowerCase())
            );
          }
          
          if (targetListing) {
            // Select the listing
            handleListingClick(targetListing);
            setIsSearchingForListing(false);
            return;
          }
        }
        
        // If we get here, no listing was found
        setIsSearchingForListing(false);
      } else {
        console.error('Failed to search for listing:', response.status);
        setIsSearchingForListing(false);
      }
    } catch (error) {
      console.error('Error searching for listing:', error);
      setIsSearchingForListing(false);
    }
  };

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

  const loadListings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const offset = (currentPage - 1) * itemsPerPage;
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      
      const response = await fetch(`/api/admin/listings/list?limit=${itemsPerPage}&offset=${offset}&sortBy=${sortBy}&sortOrder=${sortOrder}${searchParam}`);
      
      if (response.ok) {
        const data: any = await response.json();
        
        if (data.success && data.listings) {
          setListings(data.listings);
          setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
        } else {
          console.error('API returned success but no listings:', data);
          setError('No listings data received');
          setListings([]);
        }
      } else {
        console.error('API request failed:', response.status, response.statusText);
        setError(`Failed to load listings: ${response.status}`);
        setListings([]);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      setError('Failed to load listings');
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString();
  const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleTimeString();
  
  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - (timestamp * 1000);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else {
        return 'just now';
      }
    }
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

  const loadListingChats = async (listingId: string) => {
    try {
      setIsLoadingChats(true);
      setListingChats([]);
      
      // Fetch real chat data for this listing
      const response = await fetch(`/api/admin/listings/${listingId}/chats`);
      
      if (response.ok) {
        const data: any = await response.json();
        
        // Add comprehensive validation of the response structure
        if (data && typeof data === 'object' && data.success === true && Array.isArray(data.chats)) {
  
          setListingChats(data.chats);
        } else if (data && Array.isArray(data)) {
          // Handle case where API returns array directly
          
          setListingChats(data);
        } else if (data && data.chats && Array.isArray(data.chats)) {
          // Handle case where success field might be missing
          
          setListingChats(data.chats);
        } else {
  
          setListingChats([]);
        }
      } else {
        console.error('Failed to load listing chats:', response.status, response.statusText);
        setListingChats([]);
      }
    } catch (error) {
      console.error('Error loading listing chats:', error);
      setListingChats([]);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const handleListingClick = async (listing: any) => {

    setSelectedListing(listing);
    setSelectedImage(null);
    
    // Load images for the selected listing
    await loadListingImages(listing.id);
    
    // Load chats for the selected listing
    if (listing.id) {
      await loadListingChats(listing.id);
    }
  };

  const loadListingImages = async (listingId: string) => {
    try {
      const response = await fetch(`/api/admin/listings/${listingId}/images`);
      if (response.ok) {
        const data = await response.json() as { success: boolean; images?: string[]; error?: string };
        if (data.success) {
          setListingImages(data.images || []);
        } else {
          console.error('Failed to load images:', data.error);
          setListingImages([]);
        }
      } else {
        console.error('Failed to load images:', response.status);
        setListingImages([]);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      setListingImages([]);
    }
  };

  const handleSelectListing = (listingId: string, checked: boolean) => {
    const newSelected = new Set(selectedListings);
    if (checked) {
      newSelected.add(listingId);
    } else {
      newSelected.delete(listingId);
    }
    setSelectedListings(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedListings(new Set(listings.map(l => l.id)));
      setSelectAll(true);
    } else {
      setSelectedListings(new Set());
      setSelectAll(false);
    }
  };

  const handleBulkBoost = async () => {
    if (selectedListings.size === 0) return;
    
    try {
      const response = await fetch('/api/admin/listings/bulk-boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingIds: Array.from(selectedListings) })
      });
      
      const data = await response.json() as { success: boolean; error?: string; message?: string };
      
      if (data.success) {
        // Clear selection and reload listings
        setSelectedListings(new Set());
        setSelectAll(false);
        loadListings();
        setToast({ message: 'Listings boosted successfully!', type: 'success' });
      } else {
        console.error('Failed to boost listings:', data.error);
        setToast({ message: data.error || 'Failed to boost listings', type: 'error' });
      }
    } catch (error) {
      console.error('Error boosting listings:', error);
      setToast({ message: 'Error boosting listings', type: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedListings.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedListings.size} listings? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/admin/listings/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingIds: Array.from(selectedListings) })
      });
      
      const data = await response.json() as { success: boolean; error?: string; message?: string };
      
      if (data.success) {
        // Clear selection and reload listings
        setSelectedListings(new Set());
        setSelectAll(false);
        loadListings();
        setToast({ message: 'Listings deleted successfully!', type: 'success' });
      } else {
        console.error('Failed to delete listings:', data.error);
        setToast({ message: data.error || 'Failed to delete listings', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting listings:', error);
      setToast({ message: 'Error deleting listings', type: 'error' });
    }
  };

  const clearSelectedListing = () => {
    setSelectedListing(null);
    setListingChats([]);
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
              
              {/* Bulk Action Buttons */}
              {selectedListings.size > 0 && (
                <>
                  <button
                    onClick={handleBulkBoost}
                    disabled={isLoading}
                    className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Boost ({selectedListings.size})
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isLoading}
                    className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete ({selectedListings.size})
                  </button>
                </>
              )}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Listing Details (2/3 width) */}
              <div className="lg:col-span-2">
                {/* Condensed Info Layout */}
                <div className="space-y-3">
                  {/* Row 1: Type, Title, ID */}
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      selectedListing.adType === 'want' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {selectedListing.adType === 'want' ? 'Want' : 'Sell'}
                    </span>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex-1">
                      {selectedListing.title}
                    </h3>
                    <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-600">
                      {selectedListing.id}
                    </span>
                  </div>
                  
                  {/* Row 2: Posted by, Username, Timestamp */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Posted by:</span>
                    <a 
                      href={`/admin/users?search=${selectedListing.username || selectedListing.postedBy}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors border border-blue-300 dark:border-blue-600"
                    >
                      {selectedListing.username || selectedListing.postedBy}
                      <ExternalLinkIcon size="sm" />
                    </a>
                    <span className="text-neutral-500 dark:text-neutral-400">on</span>
                    <span className="text-neutral-900 dark:text-white">{formatDate(selectedListing.createdAt)}</span>
                  </div>
                  
                  {/* Row 3: Location and Price */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 dark:text-neutral-400">Location:</span>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600">
                        {selectedListing.location || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 dark:text-neutral-400">Price:</span>
                      <span className="font-bold text-green-600">{formatPrice(selectedListing.priceSat)}</span>
                    </div>
                  </div>
                  
                  {/* Row 4: Views and Category */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 dark:text-neutral-400">Views:</span>
                      <span className="text-neutral-900 dark:text-white font-medium">{selectedListing.views?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 dark:text-neutral-400">Category:</span>
                      <span className="text-neutral-900 dark:text-white">{selectedListing.category}</span>
                    </div>
                  </div>
                  
                  {/* Images Section */}
                  {listingImages && listingImages.length > 0 && (
                    <div>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {listingImages.map((imageUrl: string, index: number) => (
                          <img 
                            key={index}
                            src={imageUrl} 
                            alt={`${selectedListing.title} - Image ${index + 1}`}
                            className="w-20 h-20 object-cover rounded border border-neutral-200 dark:border-neutral-600 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(imageUrl)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Column - Active Conversations (1/3 width) */}
              <div className="lg:col-span-1">
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600 p-3 h-full">
                  <h3 className="text-md font-semibold text-neutral-900 dark:text-white mb-3">
                    Active Conversations ({listingChats?.length || 0})
                  </h3>
                  
                  <div className="h-[calc(100%-3rem)] overflow-y-auto space-y-2">
                    {isLoadingChats ? (
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Loading chats...</div>
                    ) : listingChats && listingChats.length > 0 ? (
                      listingChats
                        .filter(chat => chat && typeof chat === 'object' && chat.id)
                        .map((chat: any) => (
                        <div 
                          key={chat.id} 
                          className="bg-purple-200 dark:bg-purple-800 rounded p-2 border border-purple-300 dark:border-purple-600 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors cursor-pointer relative"
                          onClick={() => window.location.href = `/admin/chats?chatId=${encodeURIComponent(chat.id)}&search=${encodeURIComponent(selectedListing.title || '')}`}
                        >
                          {/* External Link Icon - Top Right */}
                          <ExternalLinkIcon 
                            size="sm" 
                            className="absolute top-1.5 right-1.5 text-purple-600 dark:text-purple-400" 
                          />
                          
                          {/* User Box - Top Left */}
                          <div className="mb-2">
                            <a 
                              href={`/admin/users?search=${chat.buyerUsername || chat.buyerId}`}
                              className="inline-flex items-center gap-1 px-1 py-0.5 rounded text-xs font-medium bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors border border-blue-300 dark:border-blue-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {chat.buyerUsername || chat.buyerId}
                              <ExternalLinkIcon size="xs" />
                            </a>
                          </div>
                          
                          {/* Bottom Row - Messages & Last Activity */}
                          <div className="flex items-center justify-between text-xs text-purple-800 dark:text-purple-200">
                            <span>{chat.messageCount || chat.messages?.length || 0} total messages</span>
                            <span>last activity: {getTimeAgo(chat.lastMessageAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                        No active conversations yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Placeholder (2/3 width) */}
              <div className="lg:col-span-2 text-center py-8">
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
              
              {/* Right Column - Placeholder (1/3 width) */}
              <div className="lg:col-span-1">
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600 p-3 h-full">
                  <h3 className="text-md font-semibold text-neutral-900 dark:text-white mb-3">
                    No Conversations
                  </h3>
                  <div className="h-[calc(100%-3rem)] flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-neutral-400 dark:text-neutral-500 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-neutral-600 dark:text-neutral-400 mb-1">No Conversations</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-500">
                        Conversations will appear here when a listing is selected
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full space-y-0 font-mono text-xs">
              <thead className="bg-neutral-100 dark:bg-neutral-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
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
                    <td colSpan={10} className="px-3 py-8 text-center">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-neutral-600 dark:text-neutral-400">Loading listings...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      {error}
                    </td>
                  </tr>
                ) : listings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-8 text-center text-neutral-500 dark:text-neutral-400">
                      No listings found
                    </td>
                  </tr>
                ) : (
                  <>
                    {listings.map((listing) => (
                      <tr 
                        key={listing.id} 
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer border-b border-neutral-200 dark:border-neutral-600"
                        onClick={() => handleListingClick(listing)}
                      >
                        <td className="px-1.5 py-0.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedListings.has(listing.id)}
                            onChange={(e) => handleSelectListing(listing.id, e.target.checked)}
                            className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
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
                            <ExternalLinkIcon size="sm" />
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
                          <div className="text-neutral-900 dark:text-white font-medium">
                            {formatPrice(listing.priceSat)}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-900 dark:text-white">
                            {listing.views?.toLocaleString() || 0}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-neutral-900 dark:text-white">
                            {listing.replies || 0}
                          </div>
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

      {/* Image Popup */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-auto h-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button positioned on the image */}
            <button 
              onClick={() => setSelectedImage(null)} 
              className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full flex items-center justify-center transition-all duration-200 z-10 hover:scale-110" 
              aria-label="Close"
            >
              ×
            </button>
            <img 
              src={selectedImage} 
              alt="Listing Image" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
            />
          </div>
        </div>
      )}
      
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}