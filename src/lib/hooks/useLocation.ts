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
                
                // Check if saved location is the old Toronto coordinates and reset to new Miami default
                if (savedLocation && 
                    Math.abs(savedLocation.lat - 43.653) < 0.1 && 
                    Math.abs(savedLocation.lng - (-79.383)) < 0.1) {
                    console.log('useLocation: Detected old Toronto coordinates, resetting to new Miami default');
                    resetToDefault();
                }
                
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
