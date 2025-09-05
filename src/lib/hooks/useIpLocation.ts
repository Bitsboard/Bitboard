import { useState, useEffect } from 'react';
import type { Place } from '@/lib/types';

interface IpLocationResponse {
  city?: string;
  region?: string;
  country_name?: string;
  latitude?: number;
  longitude?: number;
  ip?: string;
}

export function useIpLocation() {
  const [location, setLocation] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIpLocation() {
      try {
        setLoading(true);
        setError(null);

        // Skip IP location on admin pages to avoid CORS issues
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          console.log('Skipping IP location on admin page to avoid CORS issues');
          setLoading(false);
          return;
        }

        // Try multiple free IP geolocation services for reliability
        const services = [
          'https://ipapi.co/json/',
          'https://ipapi.com/ip_api.php?ip=',
          'https://api.ipify.org?format=json'
        ];

        let ipLocation: IpLocationResponse | null = null;

        // First, get the user's IP address
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          if (ipResponse.ok) {
            const ipData = await ipResponse.json() as { ip: string };
            const { ip } = ipData;
            
            // Then get location data for that IP
            for (const service of services.slice(0, 2)) { // Skip ipify since we already have the IP
              try {
                const response = await fetch(service + (service.includes('ip=') ? ip : ''));
                if (response.ok) {
                  const locationData = await response.json() as IpLocationResponse;
                  ipLocation = locationData;
                  if (ipLocation.city && ipLocation.latitude && ipLocation.longitude) {
                    break; // We got valid data, stop trying other services
                  }
                }
              } catch (e) {
                console.warn(`IP geolocation service failed: ${service}`, e);
                continue; // Try next service
              }
            }
          }
        } catch (ipError) {
          console.warn('Failed to get IP address:', ipError);
        }

        if (ipLocation?.city && ipLocation.latitude && ipLocation.longitude) {
          const place: Place = {
            name: [ipLocation.city, ipLocation.region, ipLocation.country_name]
              .filter(Boolean)
              .join(', '),
            lat: ipLocation.latitude,
            lng: ipLocation.longitude,
          };
          setLocation(place);
        } else {
          console.warn('Could not determine location from IP, using fallback');
        }
      } catch (err) {
        console.warn('IP geolocation failed, using fallback:', err);
        setError(err instanceof Error ? err.message : 'Failed to get location');
        // Don't set error state for fallback - just use default location
      } finally {
        setLoading(false);
      }
    }

    fetchIpLocation();
  }, []);

  return { location, loading, error };
}
