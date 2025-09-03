import { useState, useEffect, useCallback } from 'react';
import { dataService, CONFIG } from '@/lib/dataService';
import type { Listing, Place } from '@/lib/types';

export function useListings(center: Place, radiusKm: number, isDeployed: boolean) {
    const [listings, setListings] = useState<Listing[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [allListings, setAllListings] = useState<Listing[]>([]); // Store all loaded listings for sorting

    // Initial page load
    useEffect(() => {
        
        if (!isDeployed) {
            // Use mock data for development
            return;
        }

        // API logic for production
        const loadFromAPI = async () => {
            try {
                setIsLoading(true);
                setCurrentPage(0);
                const response = await dataService.getListings({
                    limit: CONFIG.PAGE_SIZE,
                    offset: 0,
                    lat: center.lat,
                    lng: center.lng,
                    radiusKm,
                });

                
                // Handle new API response structure
                const listingsData = response.data.listings;
                const totalCount = response.pagination.total;
                
                
                setListings(listingsData);
                setAllListings(listingsData);
                setTotal(totalCount);
                setHasMore(listingsData.length < totalCount);
            } catch (error) {
                console.error('Failed to load initial listings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadFromAPI();
    }, [isDeployed, center.lat, center.lng, radiusKm]);

    const loadMore = useCallback(async () => {
        if (!isDeployed || isLoading || isLoadingMore || !hasMore) return;

        try {
            setIsLoadingMore(true);
            const nextPage = currentPage + 1;
            const response = await dataService.getListings({
                limit: CONFIG.PAGE_SIZE,
                offset: nextPage * CONFIG.PAGE_SIZE,
                lat: center.lat,
                lng: center.lng,
                radiusKm,
            });

            // Handle new API response structure
            const newListingsData = response.data.listings;
            const newTotalCount = response.pagination.total;

            const newListings = [...allListings, ...newListingsData];
            
            
            setAllListings(newListings);
            setListings(newListings);
            setCurrentPage(nextPage);
            setTotal(newTotalCount);
            
            // Ensure hasMore is true if we received a full page of results
            const hasMoreResults = newListingsData.length === CONFIG.PAGE_SIZE || newListings.length < newTotalCount;
            setHasMore(hasMoreResults);
        } catch (error) {
            console.error('Failed to load more listings:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isDeployed, isLoading, isLoadingMore, hasMore, currentPage, center.lat, center.lng, radiusKm, allListings.length]);

    // Function to update displayed listings (for sorting)
    const updateDisplayedListings = useCallback((newListings: Listing[]) => {
        setListings(newListings);
    }, []);

    return {
        listings,
        total,
        isLoading,
        hasMore,
        isLoadingMore,
        loadMore,
        currentPage,
        allListings,
        updateDisplayedListings,
    };
}
