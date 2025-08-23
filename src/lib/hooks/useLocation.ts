import { useState, useEffect, useCallback } from 'react';
import { dataService, CONFIG } from '@/lib/dataService';
import type { Place } from '@/lib/types';

export function useLocation() {
    const [center, setCenter] = useState<Place>(CONFIG.DEFAULT_CENTER);
    const [radiusKm, setRadiusKm] = useState<number>(CONFIG.DEFAULT_RADIUS_KM);

    // Load saved user location on mount
    useEffect(() => {
        const loadUserLocation = async () => {
            try {
                console.log('useLocation: Loading saved location...');
                const savedLocation = await dataService.getUserLocation();
                if (savedLocation) {
                    console.log('useLocation: Found saved location:', savedLocation);
                    setCenter(savedLocation);
                } else {
                    console.log('useLocation: No saved location found, using default:', CONFIG.DEFAULT_CENTER);
                }
                const savedRadius = await dataService.getUserRadius();
                console.log('useLocation: Loaded radius:', savedRadius);
                setRadiusKm(savedRadius);
            } catch (error) {
                console.warn('useLocation: Failed to load user location:', error);
            }
        };

        loadUserLocation();
    }, []);

    const updateLocation = useCallback(async (place: Place, radius: number) => {
        console.log('useLocation: Updating location to:', place, 'radius:', radius);
        setCenter(place);
        setRadiusKm(radius);
        try {
            await dataService.saveUserLocation(place, radius);
            console.log('useLocation: Location saved successfully');
        } catch (error) {
            console.warn('useLocation: Failed to save location:', error);
        }
    }, []);

    return {
        center,
        radiusKm,
        updateLocation,
    };
}
