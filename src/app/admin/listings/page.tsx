"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Listing {
  id: number;
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
  imageUrl?: string;
  location?: string;
  views: number;
  favorites: number;
  replies: number;
}

export default function AdminListingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  
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
      setError(null);
      
      const offset = (currentPage - 1) * itemsPerPage;
      console.log('🔍 Loading listings - Page:', currentPage, 'Items per page:', itemsPerPage, 'Offset:', offset);
      
      const response = await fetch(`/api/admin/listings/list?limit=${itemsPerPage}&offset=${offset}`);
      
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

  const formatPrice = (priceSat: number) => `${priceSat.toLocaleString()} sats`;
  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString();
  const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleTimeString();

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
                className="px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-xs flex-1"
              />
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

        {/* Listings Table */}
        <div className="bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-700">
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">ID</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Date</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">User</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Type</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Title</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Category</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Location</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Price</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Views</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Replies</th>
                  <th className="px-1.5 py-1 text-left text-xs font-medium text-neutral-700 dark:text-neutral-300">Status</th>
                </tr>
              </thead>
              <tbody className="space-y-0 font-mono text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-1.5 py-0.5 text-center text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Loading listings...
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={11} className="px-1.5 py-0.5 text-center text-neutral-500 dark:text-neutral-400">
                      <div className="text-center">
                        <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-600 dark:text-red-400 font-medium text-xs">Failed to load listings</p>
                        <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">{error}</p>
                        <button
                          onClick={loadListings}
                          className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          Try Again
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : listings.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-1.5 py-0.5 text-center text-neutral-500 dark:text-neutral-400">
                      <div className="text-center">
                        <svg className="w-8 h-8 text-neutral-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-neutral-600 dark:text-neutral-400 font-medium text-xs">No listings found</p>
                        <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">Try refreshing or check your connection</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {listings.map((listing) => (
                      <tr 
                        key={listing.id} 
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded px-1.5 -mx-1.5 transition-colors cursor-pointer"
                      >
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                            {listing.id.toString().slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            {formatDate(listing.createdAt)}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {formatTime(listing.createdAt)}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs font-medium text-neutral-900 dark:text-white">
                            {listing.username || listing.postedBy}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            listing.adType === 'want' 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                            {listing.adType === 'want' ? 'Want' : 'Sell'}
                          </span>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="max-w-xs">
                            <div className="font-medium text-neutral-900 dark:text-white text-xs">{listing.title}</div>
                            <div className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">{listing.description}</div>
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <span className="text-xs text-neutral-500 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded">
                            {listing.category}
                          </span>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs text-neutral-900 dark:text-white">
                            {listing.location || 'N/A'}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs font-bold text-green-600">
                            {formatPrice(listing.priceSat)}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs text-neutral-900 dark:text-white">
                            {listing.views.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <div className="text-xs text-neutral-900 dark:text-white">
                            {listing.replies.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-1.5 py-0.5">
                          <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            listing.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : listing.status === 'sold'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {listing.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Fill remaining rows to maintain 20 row height */}
                    {Array.from({ length: Math.max(0, 20 - listings.length) }).map((_, index) => (
                      <tr key={`empty-${index}`} className="h-6">
                        <td colSpan={11} className="px-1.5 py-0.5">
                          <div className="h-6"></div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center py-2 px-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
            <div className="text-xs text-neutral-600">
              {listings.length} listings • Page {currentPage} of {totalPages}
            </div>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-1.5 py-0.5 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-1.5 py-0.5 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-1.5 py-0.5 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-1.5 py-0.5 rounded text-xs text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
