import { useState, useEffect, useCallback } from 'react';
import { dataService, CONFIG } from '@/lib/dataService';
import type { Place } from '@/lib/types';

export function useLocation() {
    const [center, setCenter] = useState<Place>(CONFIG.DEFAULT_CENTER);
    const [radiusKm, setRadiusKm] = useState<number>(CONFIG.DEFAULT_RADIUS_KM);

    // Load saved user location on mount
    useEffect(() => {
        const loadUserLocation = () => {
            try {
                // First try to load from localStorage for immediate persistence
                const savedLocationStr = localStorage.getItem('userLocation');
                const savedRadiusStr = localStorage.getItem('userRadius');
                
                if (savedLocationStr) {
                    try {
                        const savedLocation = JSON.parse(savedLocationStr) as Place;
                        console.log('useLocation: Loaded from localStorage:', savedLocation);
                        setCenter(savedLocation);
                    } catch (e) {
                        console.warn('useLocation: Failed to parse saved location:', e);
                    }
                }
                
                if (savedRadiusStr) {
                    const savedRadius = parseInt(savedRadiusStr, 10);
                    if (!isNaN(savedRadius) && savedRadius > 0) {
                        console.log('useLocation: Loaded radius from localStorage:', savedRadius);
                        setRadiusKm(savedRadius);
                    }
                }
                
                // Then try to load from database for long-term persistence
                // Only if localStorage doesn't have values
                const loadFromDatabase = async () => {
                    try {
                        // Only load from database if we don't have localStorage values
                        if (!savedLocationStr) {
                            const savedLocation = await dataService.getUserLocation();
                            if (savedLocation) {
                                console.log('useLocation: Found saved location in database:', savedLocation);
                                setCenter(savedLocation);
                                // Update localStorage with database value
                                localStorage.setItem('userLocation', JSON.stringify(savedLocation));
                            }
                        }
                        
                        if (!savedRadiusStr) {
                            const savedRadius = await dataService.getUserRadius();
                            if (savedRadius && savedRadius > 0) {
                                console.log('useLocation: Loaded radius from database:', savedRadius);
                                setRadiusKm(savedRadius);
                                // Update localStorage with database value
                                localStorage.setItem('userRadius', savedRadius.toString());
                            }
                        }
                    } catch (error) {
                        console.warn('useLocation: Failed to load from database:', error);
                    }
                };
                
                loadFromDatabase();
                
            } catch (error) {
                console.warn('useLocation: Failed to load user location:', error);
            }
        };

        loadUserLocation();
    }, []);

    const updateLocation = useCallback(async (place: Place, radius: number) => {
        console.log('useLocation: Updating location to:', place, 'radius:', radius);
        
        // Update state immediately
        setCenter(place);
        setRadiusKm(radius);
        
        // Save to localStorage for immediate persistence
        try {
            localStorage.setItem('userLocation', JSON.stringify(place));
            localStorage.setItem('userRadius', radius.toString());
            console.log('useLocation: Location saved to localStorage');
        } catch (error) {
            console.warn('useLocation: Failed to save to localStorage:', error);
        }
        
        // Save to database for long-term persistence
        try {
            await dataService.saveUserLocation(place, radius);
            console.log('useLocation: Location saved to database');
        } catch (error) {
            console.warn('useLocation: Failed to save to database:', error);
        }
    }, []);

    return {
        center,
        radiusKm,
        updateLocation,
    };
}
