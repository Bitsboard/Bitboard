import type { Listing, Place, RateResponse, ListingsResponse } from './types';
import { locationService, LOCATION_CONFIG } from './locationService';

// Configuration constants
export const CONFIG = {
    PAGE_SIZE: 24,
    DEFAULT_RADIUS_KM: LOCATION_CONFIG.DEFAULT_RADIUS_KM,
    DEFAULT_CENTER: LOCATION_CONFIG.DEFAULT_CENTER,
    BTC_RATE_CACHE_DURATION: 60 * 1000, // 60 seconds - matches server update interval
} as const;

// Cache for BTC rate - this will be populated by server-side updates
let btcRateCache: { rate: number | null; timestamp: number } | null = null;

export class DataService {
    private static instance: DataService;

    private constructor() { }

    static getInstance(): DataService {
        if (!DataService.instance) {
            DataService.instance = new DataService();
        }
        return DataService.instance;
    }

    // BTC Rate Management - now fetches from our server's cached rate
    async getBtcRate(): Promise<number | null> {
        // Check cache first
        if (btcRateCache && Date.now() - btcRateCache.timestamp < CONFIG.BTC_RATE_CACHE_DURATION) {
            return btcRateCache.rate;
        }

        try {
            // Fetch from our server's cached rate endpoint
            const response = await fetch("/api/btc-rate", { 
                cache: 'no-store', // Always get fresh rate from our server
                next: { revalidate: 0 } // Disable Next.js caching
            });
            
            if (!response.ok) throw new Error('Failed to fetch BTC rate from server');

            const data: RateResponse = await response.json();

            // Update cache
            btcRateCache = {
                rate: data.cad,
                timestamp: Date.now()
            };

            return data.cad;
        } catch (error) {
            console.warn('Failed to fetch BTC rate from server:', error);
            // Return cached rate if available, even if expired
            return btcRateCache?.rate || null;
        }
    }

    // Listings Management
    async getListings(params: {
        limit?: number;
        offset?: number;
        lat?: number;
        lng?: number;
        radiusKm?: number;
        query?: string;
        category?: string;
        adType?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<ListingsResponse> {
        try {
            console.log('DataService: Fetching listings with params:', params);
            
            const queryParams = new URLSearchParams();
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.offset) queryParams.append('offset', params.offset.toString());
            if (params.lat) queryParams.append('lat', params.lat.toString());
            if (params.lng) queryParams.append('lng', params.lng.toString());
            if (params.radiusKm) queryParams.append('radiusKm', params.radiusKm.toString());

            const url = `/api/listings?${queryParams.toString()}`;
            console.log('DataService: Fetching from URL:', url);
            
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as any;
            console.log('DataService: Raw API response:', data);
            
            const listings = data.listings.map((row: any) => ({
                id: String(row.id),
                title: row.title,
                description: row.description || "No description available",
                priceSats: Number(row.priceSat) || 0,
                category: (row.category as any) || "Electronics",
                location: this.cleanLocationLabel(row.location) || "Toronto, ON",
                lat: Number.isFinite(row.lat as any) ? (row.lat as number) : CONFIG.DEFAULT_CENTER.lat,
                lng: Number.isFinite(row.lng as any) ? (row.lng as number) : CONFIG.DEFAULT_CENTER.lng,
                type: (row.adType as any) === "want" ? "want" : "sell",
                images: this.processImageUrls(row.imageUrl),
                boostedUntil: row.boostedUntil ?? null,
                seller: this.createSellerFromRow(row),
                createdAt: Number(row.createdAt) * 1000,
                postedBy: row.postedBy,
            }));
            console.log('DataService: Transformed listings:', listings);
            console.log('DataService: First listing seller rating:', listings[0]?.seller?.rating);
            
            return {
                listings,
                total: data.total || 0,
                page: Math.floor((params.offset || 0) / (params.limit || CONFIG.PAGE_SIZE)),
                limit: params.limit || CONFIG.PAGE_SIZE,
            };
        } catch (error) {
            console.error('Failed to fetch listings:', error);
            return {
                listings: [],
                total: 0,
                page: 0,
                limit: params.limit || CONFIG.PAGE_SIZE,
            };
        }
    }

    // User Session Management
    async getCurrentUser(): Promise<any | null> {
        try {
            const response = await fetch('/api/auth/session', { cache: 'no-store' });
            if (!response.ok) return null;

            const data = await response.json() as { session?: any };
            return data?.session || null;
        } catch (error) {
            console.warn('Failed to fetch user session:', error);
            return null;
        }
    }

    // Location Management
    async getUserLocation(): Promise<Place | null> {
        return locationService.getUserLocation();
    }

    async getUserRadius(): Promise<number> {
        return locationService.getUserRadius();
    }

    async saveUserLocation(place: Place, radiusKm: number): Promise<void> {
        locationService.saveUserLocation(place, radiusKm);
    }

    // Data Transformation
    private cleanLocationLabel(raw?: string): string {
        if (!raw) return "";
        const s = raw.replace(/\s*[•|\-].*$/, "").replace(/\(.*?\)/g, "").trim();
        return s.replace(/\s{2,}/g, " ").replace(/,\s*,/g, ", ").replace(/\s+,\s+/g, ", ");
    }

    private processImageUrls(imageUrl?: string | string[]): string[] {
        const fallbackImages = [
            "https://images.unsplash.com/photo-1555617117-08d3a8fef16c?w=1200&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80&auto=format&fit=crop",
        ];

        if (Array.isArray(imageUrl) && imageUrl.length > 0) {
            return imageUrl as string[];
        }

        if (typeof imageUrl === 'string' && imageUrl.includes(',')) {
            return (imageUrl as string).split(',').map(s => s.trim()).filter(Boolean);
        }

        const base = typeof imageUrl === 'string' && imageUrl ? [imageUrl] : [];
        return [...base, ...fallbackImages].slice(0, 5);
    }

    private createSellerFromRow(row: any): any {
        // postedBy should always be present from the API JOIN
        if (!row.postedBy) {
            console.warn('dataService: Missing postedBy field for listing:', row.id);
            // Fallback to a generic seller name based on listing ID
            const fallbackName = `seller_${row.id}`;
            console.warn('dataService: Using fallback seller name:', fallbackName);
            row.postedBy = fallbackName;
        }
        
        const name = row.postedBy.replace(/^@/, "");
        
        // Use user data that's now fetched directly from the main listings API
        const userRating = row.userRating || 0;
        const userDeals = row.userDeals || 0;
        const userVerified = Boolean(row.userVerified);

        return {
            name,
            score: userRating, // Rating is already the thumbs up count
            deals: userDeals,
            rating: userRating,
            verifications: {
                email: true,
                phone: userVerified,
                lnurl: userVerified
            },
            onTimeRelease: userVerified ? 0.97 : 0.9,
        };
    }
}

// Export singleton instance
export const dataService = DataService.getInstance();
