import { useState, useEffect, useCallback } from 'react';
import { locationService, LOCATION_CONFIG } from '@/lib/locationService';
import type { Place } from '@/lib/types';

export function useLocation() {
    const [center, setCenter] = useState<Place>(LOCATION_CONFIG.DEFAULT_CENTER);
    const [radiusKm, setRadiusKm] = useState<number>(LOCATION_CONFIG.DEFAULT_RADIUS_KM);

    // Define resetToDefault function first
    const resetToDefault = useCallback(() => {
        
        // Reset to new default in location service
        locationService.resetToNewDefault();
        
        // Update state to new default
        setCenter(LOCATION_CONFIG.DEFAULT_CENTER);
        setRadiusKm(LOCATION_CONFIG.DEFAULT_RADIUS_KM);
        
    }, []);

            // Load saved user location on mount
        useEffect(() => {
            const loadUserLocation = () => {
                try {
                    
                    // First, check if we have the old Miami location and clear it
                    locationService.clearMiamiLocation();
                    
                    // Load from unified location service
                    const savedLocation = locationService.getUserLocation();
                    const savedRadius = locationService.getUserRadius();
                    
                    
                    if (savedLocation) {
                        setCenter(savedLocation);
                    }
                    
                    if (savedRadius !== LOCATION_CONFIG.DEFAULT_RADIUS_KM) {
                        setRadiusKm(savedRadius);
                    }
                    
                    // Check if location data is stale and clear if needed
                    if (locationService.isLocationStale()) {
                        locationService.clearUserLocation();
                        setCenter(LOCATION_CONFIG.DEFAULT_CENTER);
                        setRadiusKm(LOCATION_CONFIG.DEFAULT_RADIUS_KM);
                    }
                    
                    // Keep user's actual location - don't auto-reset to default
                    
                } catch (error) {
                    console.warn('useLocation: Failed to load user location:', error);
                    // Fall back to defaults
                    setCenter(LOCATION_CONFIG.DEFAULT_CENTER);
                    setRadiusKm(LOCATION_CONFIG.DEFAULT_RADIUS_KM);
                }
            };

        loadUserLocation();
    }, [resetToDefault]);

    const updateLocation = useCallback(async (place: Place, radius: number) => {
        
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
        resetToDefault,
    };
}
