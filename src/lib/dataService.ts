import type { Listing, Place, RateResponse, ListingsResponse } from './types';

// Configuration constants
export const CONFIG = {
    PAGE_SIZE: 50,
    DEFAULT_RADIUS_KM: 25,
    DEFAULT_CENTER: { name: "Toronto (City Center)", lat: 43.653, lng: -79.383 },
    BTC_RATE_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
} as const;

// Cache for BTC rate
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

    // BTC Rate Management
    async getBtcRate(): Promise<number | null> {
        // Check cache first
        if (btcRateCache && Date.now() - btcRateCache.timestamp < CONFIG.BTC_RATE_CACHE_DURATION) {
            return btcRateCache.rate;
        }

        try {
            const response = await fetch("/api/rate");
            if (!response.ok) throw new Error('Failed to fetch BTC rate');

            const data: RateResponse = await response.json();

            // Update cache
            btcRateCache = {
                rate: data.cad,
                timestamp: Date.now()
            };

            return data.cad;
        } catch (error) {
            console.warn('Failed to fetch BTC rate:', error);
            return null;
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
        const searchParams = new URLSearchParams();

        if (params.limit) searchParams.set('limit', String(params.limit));
        if (params.offset) searchParams.set('offset', String(params.offset));
        if (params.lat) searchParams.set('lat', String(params.lat));
        if (params.lng) searchParams.set('lng', String(params.lng));
        if (params.radiusKm) searchParams.set('radiusKm', String(params.radiusKm));
        if (params.query) searchParams.set('q', params.query);
        if (params.category) searchParams.set('category', params.category);
        if (params.adType && params.adType !== 'all') searchParams.set('adType', params.adType);
        if (params.minPrice) searchParams.set('minPrice', String(params.minPrice));
        if (params.maxPrice) searchParams.set('maxPrice', String(params.maxPrice));
        if (params.sortBy) searchParams.set('sortBy', params.sortBy);
        if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

        try {
            const response = await fetch(`/api/listings?${searchParams.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch listings');

            const responseData = await response.json() as any;
            const data = responseData.data || responseData; // Handle both nested and direct formats
            return {
                listings: this.mapApiRowsToListings(data.listings || []),
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
        try {
            const raw = localStorage.getItem("userLocation");
            console.log('dataService: getUserLocation raw:', raw);
            if (!raw) return null;

            const place = JSON.parse(raw) as Place;
            if (place && typeof place.lat === 'number' && typeof place.lng === 'number' && place.name) {
                console.log('dataService: getUserLocation parsed:', place);
                return place;
            }
            console.log('dataService: getUserLocation invalid data:', place);
            return null;
        } catch (error) {
            console.warn('dataService: getUserLocation error:', error);
            return null;
        }
    }

    async getUserRadius(): Promise<number> {
        try {
            const radius = localStorage.getItem('userRadiusKm');
            console.log('dataService: getUserRadius raw:', radius);
            if (radius) {
                const num = Number(radius);
                if (Number.isFinite(num) && num > 0) {
                    console.log('dataService: getUserRadius parsed:', num);
                    return num;
                }
            }
            console.log('dataService: getUserRadius using default:', CONFIG.DEFAULT_RADIUS_KM);
            return CONFIG.DEFAULT_RADIUS_KM;
        } catch (error) {
            console.warn('dataService: getUserRadius error:', error);
            return CONFIG.DEFAULT_RADIUS_KM;
        }
    }

    async saveUserLocation(place: Place, radiusKm: number): Promise<void> {
        try {
            console.log('dataService: saveUserLocation saving:', place, radiusKm);
            localStorage.setItem('userLocation', JSON.stringify(place));
            localStorage.setItem('userRadiusKm', String(radiusKm));
            console.log('dataService: saveUserLocation saved successfully');
        } catch (error) {
            console.warn('dataService: saveUserLocation error:', error);
        }
    }

    // Data Transformation
    private mapApiRowsToListings(rows: Array<{
        id: number;
        title: string;
        description?: string;
        category?: string;
        adType?: string;
        location?: string;
        lat?: number;
        lng?: number;
        imageUrl?: string | string[];
        priceSat: number;
        boostedUntil?: number | null;
        createdAt: number;
        postedBy?: string;
    }>): Listing[] {
        return rows.map((row) => ({
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
    }

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
        const base = Number(row.id) % 100;
        const score = 5 + (base % 80);
        const deals = base % 40;
        const verified = score >= 50;

        return {
            name,
            score,
            deals,
            rating: 4 + ((base % 10) / 10),
            verifications: {
                email: true,
                phone: verified,
                lnurl: verified
            },
            onTimeRelease: verified ? 0.97 : 0.9,
        };
    }
}

// Export singleton instance
export const dataService = DataService.getInstance();
