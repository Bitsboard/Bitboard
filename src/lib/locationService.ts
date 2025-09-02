import type { Place } from './types';

// Configuration constants
export const LOCATION_CONFIG = {
    DEFAULT_RADIUS_KM: 500,
    MAX_RADIUS_KM: 1000,
    MIN_RADIUS_KM: 1,
    DEFAULT_CENTER: { name: "North America", lat: 40.0, lng: -100.0 },
    STORAGE_KEYS: {
        LOCATION: 'bitsbarter_userLocation',
        RADIUS: 'bitsbarter_userRadius',
        LAST_UPDATED: 'bitsbarter_locationLastUpdated'
    }
} as const;

export class LocationService {
    private static instance: LocationService;

    private constructor() { }

    static getInstance(): LocationService {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }

    // Get user's saved location from localStorage
    getUserLocation(): Place | null {
        try {
            const raw = localStorage.getItem(LOCATION_CONFIG.STORAGE_KEYS.LOCATION);

            
            if (!raw) {
                return null;
            }

            const place = JSON.parse(raw) as Place;
            
            if (this.isValidPlace(place)) {
                return place;
            }
            
            console.warn('LocationService: Invalid location data in localStorage, clearing');
            this.clearUserLocation();
            return null;
        } catch (error) {
            console.warn('LocationService: Error loading location from localStorage:', error);
            this.clearUserLocation();
            return null;
        }
    }

    // Get user's saved radius from localStorage
    getUserRadius(): number {
        try {
            const raw = localStorage.getItem(LOCATION_CONFIG.STORAGE_KEYS.RADIUS);
            if (!raw) return LOCATION_CONFIG.DEFAULT_RADIUS_KM;

            const radius = Number(raw);
            if (Number.isFinite(radius) && radius > 0 && radius <= 1000) {
                return radius;
            }
            
            console.warn('LocationService: Invalid radius in localStorage, using default');
            return LOCATION_CONFIG.DEFAULT_RADIUS_KM;
        } catch (error) {
            console.warn('LocationService: Error loading radius from localStorage:', error);
            return LOCATION_CONFIG.DEFAULT_RADIUS_KM;
        }
    }

    // Save user's location and radius to localStorage
    saveUserLocation(place: Place, radiusKm: number): void {
        try {
            if (!this.isValidPlace(place)) {
                console.warn('LocationService: Invalid place data provided:', place);
                return;
            }

            if (!this.isValidRadius(radiusKm)) {
                console.warn('LocationService: Invalid radius provided:', radiusKm);
                return;
            }

            localStorage.setItem(LOCATION_CONFIG.STORAGE_KEYS.LOCATION, JSON.stringify(place));
            localStorage.setItem(LOCATION_CONFIG.STORAGE_KEYS.RADIUS, radiusKm.toString());
            localStorage.setItem(LOCATION_CONFIG.STORAGE_KEYS.LAST_UPDATED, Date.now().toString());
            

        } catch (error) {
            console.warn('LocationService: Error saving location to localStorage:', error);
        }
    }

    // Clear all location data
    clearUserLocation(): void {
        try {
            localStorage.removeItem(LOCATION_CONFIG.STORAGE_KEYS.LOCATION);
            localStorage.removeItem(LOCATION_CONFIG.STORAGE_KEYS.RADIUS);
            localStorage.removeItem(LOCATION_CONFIG.STORAGE_KEYS.LAST_UPDATED);

        } catch (error) {
            console.warn('LocationService: Error clearing location data:', error);
        }
    }

    // Reset location to new default and clear old saved location
    resetToNewDefault(): void {
        try {
            // Clear old saved location completely
            this.clearUserLocation();
            

        } catch (error) {
            console.warn('LocationService: Error clearing old location data:', error);
        }
    }

    // Force clear Miami location if it exists
    clearMiamiLocation(): void {
        try {
            const currentLocation = this.getUserLocation();

            
            if (currentLocation && 
                Math.abs(currentLocation.lat - 25.77427) < 0.1 && 
                Math.abs(currentLocation.lng - (-80.19366)) < 0.1) {
                this.clearUserLocation();
            }
        } catch (error) {
            console.warn('LocationService: Error checking Miami location:', error);
        }
    }

    // Check if location data is stale (older than 30 days)
    isLocationStale(): boolean {
        try {
            const lastUpdated = localStorage.getItem(LOCATION_CONFIG.STORAGE_KEYS.LAST_UPDATED);
            if (!lastUpdated) return true;

            const lastUpdatedTime = Number(lastUpdated);
            if (!Number.isFinite(lastUpdatedTime)) return true;

            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            return lastUpdatedTime < thirtyDaysAgo;
        } catch (error) {
            console.warn('LocationService: Error checking if location is stale:', error);
            return true;
        }
    }

    // Get default location (used as fallback)
    getDefaultLocation(): Place {
        return LOCATION_CONFIG.DEFAULT_CENTER;
    }

    // Get default radius
    getDefaultRadius(): number {
        return LOCATION_CONFIG.DEFAULT_RADIUS_KM;
    }

    // Validate place data
    private isValidPlace(place: any): place is Place {
        return (
            place &&
            typeof place === 'object' &&
            typeof place.name === 'string' &&
            place.name.trim().length > 0 &&
            typeof place.lat === 'number' &&
            Number.isFinite(place.lat) &&
            place.lat >= -90 &&
            place.lat <= 90 &&
            typeof place.lng === 'number' &&
            Number.isFinite(place.lng) &&
            place.lng >= -180 &&
            place.lng <= 180
        );
    }

    // Validate radius
    private isValidRadius(radius: any): boolean {
        return (
            typeof radius === 'number' &&
            Number.isFinite(radius) &&
            radius >= 0 &&
            radius <= 1000
        );
    }
}

// Export singleton instance
export const locationService = LocationService.getInstance();
