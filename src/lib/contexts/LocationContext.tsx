"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { locationService, LOCATION_CONFIG } from '@/lib/locationService';
import type { Place } from '@/lib/types';
import { useIpLocation } from '@/lib/hooks/useIpLocation';

interface LocationContextType {
  center: Place;
  radiusKm: number;
  isLoading: boolean;
  updateLocation: (place: Place, radius: number) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { location: ipLocation } = useIpLocation();
  const [center, setCenter] = useState<Place>(LOCATION_CONFIG.DEFAULT_CENTER);
  const [radiusKm, setRadiusKm] = useState<number>(LOCATION_CONFIG.DEFAULT_RADIUS_KM);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize location from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadSavedLocation = () => {
        try {
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
            // Don't clear manual location settings - keep them even if stale
            // Only use IP location if no manual location was set
            if (!savedLocation && ipLocation?.lat && ipLocation?.lng) {
              setCenter(ipLocation);
            } else if (!savedLocation) {
              setCenter(LOCATION_CONFIG.DEFAULT_CENTER);
            }
            setRadiusKm(LOCATION_CONFIG.DEFAULT_RADIUS_KM);
          }
          
        } catch (error) {
          console.warn('LocationContext: Failed to load user location:', error);
          // Try to get saved location even if there was an error
          const fallbackLocation = locationService.getUserLocation();
          if (fallbackLocation) {
            setCenter(fallbackLocation);
          } else if (ipLocation?.lat && ipLocation?.lng) {
            setCenter(ipLocation);
          } else {
            setCenter(LOCATION_CONFIG.DEFAULT_CENTER);
          }
          setRadiusKm(LOCATION_CONFIG.DEFAULT_RADIUS_KM);
        }
        
        // Mark loading as complete
        setIsLoading(false);
      };

      loadSavedLocation();
    }
  }, []);

  // Update center when IP location becomes available (if no saved location exists)
  useEffect(() => {
    const savedLocation = locationService.getUserLocation();
    
    if (!savedLocation && ipLocation?.lat && ipLocation?.lng) {
      setCenter(ipLocation);
    }
  }, [ipLocation]);

  // Update location and save to localStorage
  const updateLocation = (place: Place, radius: number) => {

    
    // Update state immediately
    setCenter(place);
    setRadiusKm(radius);
    
    // Save to unified location service (which handles localStorage)
    locationService.saveUserLocation(place, radius);
    
  };

  // Clear location and reset to defaults
  const clearLocation = () => {

    locationService.clearUserLocation();
    // Use IP-based location if available, otherwise fallback to Toronto
    if (ipLocation?.lat && ipLocation?.lng) {
      setCenter(ipLocation);
    } else {
      setCenter(LOCATION_CONFIG.DEFAULT_CENTER);
    }
    setRadiusKm(LOCATION_CONFIG.DEFAULT_RADIUS_KM);
  };

  const value: LocationContextType = {
    center,
    radiusKm,
    isLoading,
    updateLocation,
    clearLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextType {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
