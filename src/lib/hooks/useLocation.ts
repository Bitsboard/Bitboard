import { useState, useEffect, useCallback } from 'react';
import { locationService, LOCATION_CONFIG } from '@/lib/locationService';
import type { Place } from '@/lib/types';

export function useLocation() {
    const [center, setCenter] = useState<Place>(LOCATION_CONFIG.DEFAULT_CENTER);
    const [radiusKm, setRadiusKm] = useState<number>(LOCATION_CONFIG.DEFAULT_RADIUS_KM);

    // Define resetToDefault function first
    const resetToDefault = useCallback(() => {
        console.log('useLocation: Resetting to new default location');
        
        // Reset to new default in location service
        locationService.resetToNewDefault();
        
        // Update state to new default
        setCenter(LOCATION_CONFIG.DEFAULT_CENTER);
        setRadiusKm(LOCATION_CONFIG.DEFAULT_RADIUS_KM);
        
        console.log('useLocation: Reset to new default:', LOCATION_CONFIG.DEFAULT_CENTER);
    }, []);

            // Load saved user location on mount
        useEffect(() => {
            const loadUserLocation = () => {
                try {
                    console.log('useLocation: Starting loadUserLocation...');
                    
                    // First, check if we have the old Miami location and clear it
                    console.log('useLocation: Calling clearMiamiLocation...');
                    locationService.clearMiamiLocation();
                    console.log('useLocation: clearMiamiLocation completed');
                    
                    // Load from unified location service
                    const savedLocation = locationService.getUserLocation();
                    const savedRadius = locationService.getUserRadius();
                    
                    console.log('useLocation: After clearing Miami, savedLocation:', savedLocation);
                    console.log('useLocation: After clearing Miami, savedRadius:', savedRadius);
                    
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
        console.log('useLocation: Updating location to:', place, 'radius:', radius);
        
        // Update state immediately
        setCenter(place);
        setRadiusKm(radius);
        
        // Save to unified location service
        locationService.saveUserLocation(place, radius);
        console.log('useLocation: Location saved to unified service');
    }, []);

    return {
        center,
        radiusKm,
        updateLocation,
        resetToDefault,
    };
}
