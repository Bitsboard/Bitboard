"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { locationService, LOCATION_CONFIG } from '@/lib/locationService';
import type { Place } from '@/lib/types';
import { useIpLocation } from '@/lib/hooks/useIpLocation';

interface LocationContextType {
  center: Place;
  radiusKm: number;
  updateLocation: (place: Place, radius: number) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { location: ipLocation } = useIpLocation();
  const [center, setCenter] = useState<Place>(LOCATION_CONFIG.DEFAULT_CENTER);
  const [radiusKm, setRadiusKm] = useState<number>(LOCATION_CONFIG.DEFAULT_RADIUS_KM);

  // Initialize location from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadSavedLocation = () => {
        try {
          const savedLocation = locationService.getUserLocation();
          const savedRadius = locationService.getUserRadius();
          
          if (savedLocation) {
            console.log('LocationContext: Loaded saved location:', savedLocation);
            setCenter(savedLocation);
          }
          
          if (savedRadius !== LOCATION_CONFIG.DEFAULT_RADIUS_KM) {
            console.log('LocationContext: Loaded saved radius:', savedRadius);
            setRadiusKm(savedRadius);
          }
          
          // Check if location data is stale and clear if needed
          if (locationService.isLocationStale()) {
            console.log('LocationContext: Location data is stale, clearing');
            locationService.clearUserLocation();
            // Use IP-based location if available, otherwise fallback to Toronto
            if (ipLocation?.lat && ipLocation?.lng) {
              setCenter(ipLocation);
            } else {
              setCenter(LOCATION_CONFIG.DEFAULT_CENTER);
            }
            setRadiusKm(LOCATION_CONFIG.DEFAULT_RADIUS_KM);
          }
          
        } catch (error) {
          console.warn('LocationContext: Failed to load user location:', error);
          // Fall back to IP-based location if available, otherwise use Toronto
          if (ipLocation?.lat && ipLocation?.lng) {
            setCenter(ipLocation);
          } else {
            setCenter(LOCATION_CONFIG.DEFAULT_CENTER);
          }
          setRadiusKm(LOCATION_CONFIG.DEFAULT_RADIUS_KM);
        }
      };

      loadSavedLocation();
    }
  }, []);

  // Update center when IP location becomes available (if no saved location exists)
  useEffect(() => {
    if (!locationService.getUserLocation() && ipLocation?.lat && ipLocation?.lng) {
      console.log('LocationContext: Using IP-based location as default:', ipLocation);
      setCenter(ipLocation);
    }
  }, [ipLocation]);

  // Update location and save to localStorage
  const updateLocation = (place: Place, radius: number) => {
    console.log('LocationContext: Updating location to:', place, 'radius:', radius);
    
    // Update state immediately
    setCenter(place);
    setRadiusKm(radius);
    
    // Save to unified location service (which handles localStorage)
    locationService.saveUserLocation(place, radius);
    console.log('LocationContext: Location saved to unified service');
  };

  // Clear location and reset to defaults
  const clearLocation = () => {
    console.log('LocationContext: Clearing location');
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
