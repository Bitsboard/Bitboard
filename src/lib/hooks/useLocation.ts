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
                const savedLocation = await dataService.getUserLocation();
                if (savedLocation) {
                    setCenter(savedLocation);
                }
                const savedRadius = await dataService.getUserRadius();
                setRadiusKm(savedRadius);
            } catch (error) {
                console.warn('Failed to load user location:', error);
            }
        };

        loadUserLocation();
    }, []);

    const updateLocation = useCallback(async (place: Place, radius: number) => {
        setCenter(place);
        setRadiusKm(radius);
        try {
            await dataService.saveUserLocation(place, radius);
        } catch (error) {
            console.warn('Failed to save location:', error);
        }
    }, []);

    return {
        center,
        radiusKm,
        updateLocation,
    };
}
