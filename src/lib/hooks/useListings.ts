import { useState, useEffect, useCallback } from 'react';
import { dataService, CONFIG } from '@/lib/dataService';
import type { Listing, Place } from '@/lib/types';

export function useListings(center: Place, radiusKm: number, isDeployed: boolean) {
    const [listings, setListings] = useState<Listing[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

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
                const response = await dataService.getListings({
                    limit: CONFIG.PAGE_SIZE,
                    offset: 0,
                    lat: center.lat,
                    lng: center.lng,
                    radiusKm,
                });

                setListings(response.listings);
                setTotal(response.total);
                setHasMore(response.listings.length < response.total);
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
            const response = await dataService.getListings({
                limit: CONFIG.PAGE_SIZE,
                offset: listings.length,
                lat: center.lat,
                lng: center.lng,
                radiusKm,
            });

            setListings((prev) => [...prev, ...response.listings]);
            setTotal(response.total);
            setHasMore(response.listings.length < response.total);
        } catch (error) {
            console.error('Failed to load more listings:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isDeployed, isLoading, isLoadingMore, hasMore, listings.length, center.lat, center.lng, radiusKm]);

    return {
        listings,
        total,
        isLoading,
        hasMore,
        isLoadingMore,
        loadMore,
    };
}
