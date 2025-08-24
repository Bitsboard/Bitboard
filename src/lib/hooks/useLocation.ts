import { useState, useEffect, useCallback } from 'react';
import { locationService, LOCATION_CONFIG } from '@/lib/locationService';
import type { Place } from '@/lib/types';

export function useLocation() {
    const [center, setCenter] = useState<Place>(LOCATION_CONFIG.DEFAULT_CENTER);
    const [radiusKm, setRadiusKm] = useState<number>(LOCATION_CONFIG.DEFAULT_RADIUS_KM);

    // Load saved user location on mount
    useEffect(() => {
        const loadUserLocation = () => {
            try {
                // Load from unified location service
                const savedLocation = locationService.getUserLocation();
                const savedRadius = locationService.getUserRadius();
                
                if (savedLocation) {
                    console.log('useLocation: Loaded saved location:', savedLocation);
                    setCenter(savedLocation);
                }
                
                if (savedRadius !== LOCATION_CONFIG.DEFAULT_RADIUS_KM) {
                    console.log('useLocation: Loaded saved radius:', savedRadius);
                    setRadiusKm(savedRadius);
                }
                
                // Check if location data is stale and clear if needed
                if (locationService.isLocationStale()) {
                    console.log('useLocation: Location data is stale, clearing');
                    locationService.clearUserLocation();
                    setCenter(LOCATION_CONFIG.DEFAULT_CENTER);
                    setRadiusKm(LOCATION_CONFIG.DEFAULT_RADIUS_KM);
                }
                
            } catch (error) {
                console.warn('useLocation: Failed to load user location:', error);
                // Fall back to defaults
                setCenter(LOCATION_CONFIG.DEFAULT_CENTER);
                setRadiusKm(LOCATION_CONFIG.DEFAULT_RADIUS_KM);
            }
        };

        loadUserLocation();
    }, []);

    const updateLocation = useCallback(async (place: Place, radius: number) => {
        console.log('useLocation: Updating location to:', place, 'radius:', radius);
        
        // Update state immediately
        setCenter(place);
        setRadiusKm(radius);
        
        // Save to unified location service
        locationService.saveUserLocation(place, radius);
    }, []);

    return {
        center,
        radiusKm,
        updateLocation,
    };
}
