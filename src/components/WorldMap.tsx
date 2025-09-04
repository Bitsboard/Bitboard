'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

interface MapData {
  location: string;
  userCount: number;
  listingCount: number;
  lat: number;
  lng: number;
}

interface WorldMapProps {
  viewType: 'users' | 'listings';
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onViewTypeChange?: (type: 'users' | 'listings') => void;
}

interface TooltipContent {
  country: string;
  count: number;
  x: number;
  y: number;
}

// Simple country mapping - just the essential ones we actually have data for
const COUNTRY_MAPPING: Record<string, string> = {
  // US States/Regions -> United States
  'United States': 'United States of America',
  'USA': 'United States of America',
  'US': 'United States of America',
  'California': 'United States of America',
  'Texas': 'United States of America',
  'New York': 'United States of America',
  'Florida': 'United States of America',
  'Illinois': 'United States of America',
  'Pennsylvania': 'United States of America',
  'Ohio': 'United States of America',
  'Georgia': 'United States of America',
  'North Carolina': 'United States of America',
  'Michigan': 'United States of America',
  'New Jersey': 'United States of America',
  'Virginia': 'United States of America',
  'Washington': 'United States of America',
  'Arizona': 'United States of America',
  'Massachusetts': 'United States of America',
  'Tennessee': 'United States of America',
  'Indiana': 'United States of America',
  'Missouri': 'United States of America',
  'Maryland': 'United States of America',
  'Wisconsin': 'United States of America',
  'Colorado': 'United States of America',
  'Minnesota': 'United States of America',
  'South Carolina': 'United States of America',
  'Alabama': 'United States of America',
  'Louisiana': 'United States of America',
  'Kentucky': 'United States of America',
  'Oregon': 'United States of America',
  'Oklahoma': 'United States of America',
  'Connecticut': 'United States of America',
  'Utah': 'United States of America',
  'Iowa': 'United States of America',
  'Nevada': 'United States of America',
  'Arkansas': 'United States of America',
  'Mississippi': 'United States of America',
  'Kansas': 'United States of America',
  'New Mexico': 'United States of America',
  'Nebraska': 'United States of America',
  'West Virginia': 'United States of America',
  'Idaho': 'United States of America',
  'Hawaii': 'United States of America',
  'New Hampshire': 'United States of America',
  'Maine': 'United States of America',
  'Montana': 'United States of America',
  'Rhode Island': 'United States of America',
  'Delaware': 'United States of America',
  'South Dakota': 'United States of America',
  'North Dakota': 'United States of America',
  'Alaska': 'United States of America',
  'Vermont': 'United States of America',
  'Wyoming': 'United States of America',
  
  // Canadian Provinces -> Canada
  'Canada': 'Canada',
  'Ontario': 'Canada',
  'Quebec': 'Canada',
  'British Columbia': 'Canada',
  'Alberta': 'Canada',
  'Manitoba': 'Canada',
  'Saskatchewan': 'Canada',
  'Nova Scotia': 'Canada',
  'New Brunswick': 'Canada',
  'Newfoundland and Labrador': 'Canada',
  'Prince Edward Island': 'Canada',
  'Northwest Territories': 'Canada',
  'Yukon': 'Canada',
  'Nunavut': 'Canada',
  
  // European Countries
  'Austria': 'Austria',
  'Germany': 'Germany',
  'France': 'France',
  'United Kingdom': 'United Kingdom',
  'Italy': 'Italy',
  'Spain': 'Spain',
  'Netherlands': 'Netherlands',
  'Belgium': 'Belgium',
  'Switzerland': 'Switzerland',
  'Sweden': 'Sweden',
  'Norway': 'Norway',
  'Denmark': 'Denmark',
  'Finland': 'Finland',
  'Poland': 'Poland',
  'Czech Republic': 'Czech Republic',
  'Hungary': 'Hungary',
  'Portugal': 'Portugal',
  'Ireland': 'Ireland',
  'Greece': 'Greece',
  'Romania': 'Romania',
  'Bulgaria': 'Bulgaria',
  'Croatia': 'Croatia',
  'Slovakia': 'Slovakia',
  'Slovenia': 'Slovenia',
  'Estonia': 'Estonia',
  'Latvia': 'Latvia',
  'Lithuania': 'Lithuania',
  'Luxembourg': 'Luxembourg',
  'Malta': 'Malta',
  'Cyprus': 'Cyprus',
  
  // Other Major Countries
  'Australia': 'Australia',
  'New Zealand': 'New Zealand',
  'Japan': 'Japan',
  'South Korea': 'South Korea',
  'China': 'China',
  'India': 'India',
  'Brazil': 'Brazil',
  'Mexico': 'Mexico',
  'Argentina': 'Argentina',
  'Chile': 'Chile',
  'South Africa': 'South Africa',
  'Egypt': 'Egypt',
  'Nigeria': 'Nigeria',
  'Kenya': 'Kenya',
  'Morocco': 'Morocco',
  'Tunisia': 'Tunisia',
  'Israel': 'Israel',
  'Turkey': 'Turkey',
  'Russia': 'Russia',
  'Ukraine': 'Ukraine',
  'Belarus': 'Belarus',
  'Thailand': 'Thailand',
  'Vietnam': 'Vietnam',
  'Philippines': 'Philippines',
  'Indonesia': 'Indonesia',
  'Malaysia': 'Malaysia',
  'Singapore': 'Singapore',
  'Hong Kong': 'Hong Kong',
  'Taiwan': 'Taiwan',
};

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const canadaGeoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"; // We'll use a different approach
const usaGeoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"; // We'll use a different approach

// For now, we'll use a simplified approach with predefined province/state coordinates
// In a real implementation, you'd load proper GeoJSON files for provinces/states
const CANADA_PROVINCE_COORDINATES = {
  'Ontario': { lat: 51.2538, lng: -85.3232, zoom: 4 },
  'Quebec': { lat: 52.9399, lng: -73.5491, zoom: 4 },
  'British Columbia': { lat: 53.7267, lng: -127.6476, zoom: 4 },
  'Alberta': { lat: 53.9333, lng: -116.5765, zoom: 4 },
  'Manitoba': { lat: 53.7609, lng: -98.8139, zoom: 4 },
  'Saskatchewan': { lat: 52.9399, lng: -106.4509, zoom: 4 },
  'Nova Scotia': { lat: 44.6820, lng: -63.7443, zoom: 4 },
  'New Brunswick': { lat: 46.5653, lng: -66.4619, zoom: 4 },
  'Newfoundland and Labrador': { lat: 53.1355, lng: -57.6604, zoom: 4 },
  'Prince Edward Island': { lat: 46.5107, lng: -63.4168, zoom: 4 },
  'Northwest Territories': { lat: 64.8255, lng: -124.8457, zoom: 4 },
  'Yukon': { lat: 64.0685, lng: -139.0682, zoom: 4 },
  'Nunavut': { lat: 70.2998, lng: -83.1076, zoom: 4 }
};

const USA_STATE_COORDINATES = {
  'California': { lat: 36.7783, lng: -119.4179, zoom: 4 },
  'Texas': { lat: 31.9686, lng: -99.9018, zoom: 4 },
  'Florida': { lat: 27.7663, lng: -82.6404, zoom: 4 },
  'New York': { lat: 42.1657, lng: -74.9481, zoom: 4 },
  'Pennsylvania': { lat: 41.2033, lng: -77.1945, zoom: 4 },
  'Illinois': { lat: 40.3363, lng: -89.0022, zoom: 4 },
  'Ohio': { lat: 40.3888, lng: -82.7649, zoom: 4 },
  'Georgia': { lat: 33.0406, lng: -83.6431, zoom: 4 },
  'North Carolina': { lat: 35.6300, lng: -79.8064, zoom: 4 },
  'Michigan': { lat: 43.3266, lng: -84.5361, zoom: 4 }
  // Add more states as needed
};

// For now, we'll use a simplified approach with predefined province/state data
const CANADIAN_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan', 'Yukon'
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'District of Columbia'
];

export default function WorldMap({ viewType, timeRange, onTimeRangeChange, onViewTypeChange }: WorldMapProps) {
  const [mapData, setMapData] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipContent | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [drillDownLevel, setDrillDownLevel] = useState<'world' | 'country'>('world');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [filteredMapData, setFilteredMapData] = useState<MapData[]>([]);

  // Fetch map data
  useEffect(() => {
    const fetchMapData = async () => {
      setLoading(true);
      console.log(`🗺️ Fetching map data for viewType: ${viewType}, timeRange: ${timeRange}`);
      
      try {
        const url = `/api/admin/analytics/locations?type=${viewType}&timeRange=${timeRange}`;
        console.log(`📡 API URL: ${url}`);
        
        const response = await fetch(url);
        console.log(`📡 Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json() as { data: MapData[] };
          console.log(`📊 Raw API response:`, data);
          console.log(`📊 Data array length:`, data.data?.length || 0);
          console.log(`📊 First few items:`, data.data?.slice(0, 3));
          
          setMapData(data.data || []);
        } else {
          console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('❌ Error fetching map data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [viewType, timeRange]);

  // Filter map data by selected country when in drill-down mode
  useEffect(() => {
    if (drillDownLevel === 'country' && selectedCountry) {
      const filtered = mapData.filter(item => {
        // Extract country from location (e.g., "Toronto, Canada" -> "Canada")
        let country = item.location;
        if (item.location.includes(',')) {
          const parts = item.location.split(',').map(part => part.trim());
          country = parts[parts.length - 1];
        }
        
        // Handle US states
        const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
        if (usStates.includes(country)) {
          country = 'United States of America';
        }
        
        // Apply country mapping
        country = COUNTRY_MAPPING[country] || country;
        
        return country === selectedCountry;
      });
      
      setFilteredMapData(filtered);
      console.log(`🗺️ Filtered data for ${selectedCountry}:`, filtered);
    } else {
      setFilteredMapData(mapData);
    }
  }, [mapData, drillDownLevel, selectedCountry]);

  // Process data by country/province/state - aggregate city data
  const currentData = drillDownLevel === 'country' ? filteredMapData : mapData;
  const countryData = currentData.reduce((acc, item) => {
    let region = item.location;
    
    if (drillDownLevel === 'country' && selectedCountry) {
      // In drill-down mode, process by province/state
      if (item.location.includes(',')) {
        const parts = item.location.split(',').map(part => part.trim());
        if (parts.length >= 2) {
          // For "City, Province, Country" format, take the middle part (province/state)
          region = parts[parts.length - 2];
        } else {
          // For "City, Country" format, use the city as region
          region = parts[0];
        }
      }
    } else {
      // In world mode, process by country
      if (item.location.includes(',')) {
        const parts = item.location.split(',').map(part => part.trim());
        region = parts[parts.length - 1]; // Take the last part (country)
      }
      
      // Special handling for US states - aggregate them into "United States of America"
      const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
      if (usStates.includes(region)) {
        region = 'United States of America';
      }
      
      // Apply country mapping for consistency
      region = COUNTRY_MAPPING[region] || region;
    }
    
    if (!acc[region]) {
      acc[region] = { users: 0, listings: 0 };
    }
    acc[region].users += item.userCount || 0;
    acc[region].listings += item.listingCount || 0;
    return acc;
  }, {} as Record<string, { users: number; listings: number }>);

  // Create reverse mapping from map country names to our data
  const mapToDataMapping: Record<string, string> = {
    'Canada': 'Canada',
    'United States of America': 'United States of America', 
    'United States': 'United States of America',
    'Austria': 'Austria',
    'Germany': 'Germany',
    'France': 'France',
    'United Kingdom': 'United Kingdom',
    'Italy': 'Italy',
    'Spain': 'Spain',
    'Netherlands': 'Netherlands',
    'Belgium': 'Belgium',
    'Switzerland': 'Switzerland',
    'Sweden': 'Sweden',
    'Norway': 'Norway',
    'Denmark': 'Denmark',
    'Finland': 'Finland',
    'Poland': 'Poland',
    'Czech Republic': 'Czech Republic',
    'Hungary': 'Hungary',
    'Portugal': 'Portugal',
    'Ireland': 'Ireland',
    'Greece': 'Greece',
    'Romania': 'Romania',
    'Bulgaria': 'Bulgaria',
    'Croatia': 'Croatia',
    'Slovakia': 'Slovakia',
    'Slovenia': 'Slovenia',
    'Estonia': 'Estonia',
    'Latvia': 'Latvia',
    'Lithuania': 'Lithuania',
    'Luxembourg': 'Luxembourg',
    'Malta': 'Malta',
    'Cyprus': 'Cyprus',
    'Australia': 'Australia',
    'New Zealand': 'New Zealand',
    'Japan': 'Japan',
    'South Korea': 'South Korea',
    'China': 'China',
    'India': 'India',
    'Brazil': 'Brazil',
    'Mexico': 'Mexico',
    'Argentina': 'Argentina',
    'Chile': 'Chile',
    'South Africa': 'South Africa',
    'Egypt': 'Egypt',
    'Nigeria': 'Nigeria',
    'Kenya': 'Kenya',
    'Morocco': 'Morocco',
    'Tunisia': 'Tunisia',
    'Israel': 'Israel',
    'Turkey': 'Turkey',
    'Russia': 'Russia',
    'Ukraine': 'Ukraine',
    'Belarus': 'Belarus',
    'Thailand': 'Thailand',
    'Vietnam': 'Vietnam',
    'Philippines': 'Philippines',
    'Indonesia': 'Indonesia',
    'Malaysia': 'Malaysia',
    'Singapore': 'Singapore',
    'Hong Kong': 'Hong Kong',
    'Taiwan': 'Taiwan'
  };

  // Debug country data processing (only log once per data change)
  if (mapData.length > 0) {
    console.log(`🗺️ Map data length: ${mapData.length}`);
    console.log(`🗺️ Country data keys:`, Object.keys(countryData));
    console.log(`🗺️ View type: ${viewType}`);
  }

  // Get fill color based on data - memoized for performance
  const getFillColor = useCallback((countryName: string) => {
    // Handle undefined country names
    if (!countryName || countryName === 'undefined') {
      return '#E5E7EB';
    }
    
    // Map the country name from the map to our data key
    const dataKey = mapToDataMapping[countryName] || countryName;
    const data = countryData[dataKey];
    
    if (!data) {
      return '#E5E7EB'; // Light gray for no data
    }

    const count = viewType === 'users' ? data.users : data.listings;
    if (count === 0) {
      return '#E5E7EB';
    }

    // Color scale: light blue to dark blue
    const maxCount = Math.max(...Object.values(countryData).map(d => viewType === 'users' ? d.users : d.listings));
    const intensity = Math.min(count / maxCount, 1);
    
    // Create color gradient from light blue to dark blue
    const hue = 210; // Blue hue
    const saturation = 60 + (intensity * 40); // 60-100% saturation
    const lightness = 85 - (intensity * 40); // 85-45% lightness
    
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    return color;
  }, [countryData, viewType, mapToDataMapping]);

  const handleMouseEnter = useCallback((geo: any, event: React.MouseEvent) => {
    // Try different possible property names for country name
    const countryName = geo.properties.name || geo.properties.NAME || geo.properties.NAME_EN || geo.properties.ADMIN || geo.properties.NAME_LONG || 'Unknown';
    
    // Map the country name from the map to our data key
    const dataKey = mapToDataMapping[countryName] || countryName;
    const data = countryData[dataKey];
    const count = data ? (viewType === 'users' ? data.users : data.listings) : 0;
    
    setTooltip({
      country: countryName,
      count,
      x: event.clientX,
      y: event.clientY - 10
    });
  }, [countryData, viewType, mapToDataMapping]);

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleCountryClick = useCallback((geo: any) => {
    // Try different possible property names for country name
    const countryName = geo.properties.name || geo.properties.NAME || geo.properties.NAME_EN || geo.properties.ADMIN || geo.properties.NAME_LONG || 'Unknown';
    
    // Map the country name from the map to our data key
    const dataKey = mapToDataMapping[countryName] || countryName;
    
    // Check if we have data for this country
    const data = countryData[dataKey];
    if (!data || (viewType === 'users' ? data.users : data.listings) === 0) {
      console.log(`No data for ${countryName}, skipping drill-down`);
      return;
    }
    
    // Set drill-down state
    setSelectedCountry(countryName);
    setDrillDownLevel('country');
    
    // Show drill-down message
    const count = viewType === 'users' ? data.users : data.listings;
    const type = viewType === 'users' ? 'users' : 'listings';
    console.log(`🗺️ Drilling down into ${countryName}: ${count} ${type} in the past ${timeRange}`);
    
    // Center the map on the selected country
    const { coordinates } = geo.geometry;
    
    const bounds = coordinates.reduce((acc: any, coord: any) => {
      const [x, y] = Array.isArray(coord[0]) ? coord[0] : coord;
      if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
        return {
          minX: Math.min(acc.minX, x),
          maxX: Math.max(acc.maxX, x),
          minY: Math.min(acc.minY, y),
          maxY: Math.max(acc.maxY, y)
        };
      }
      return acc;
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    // Validate coordinates before setting
    if (!isNaN(centerX) && !isNaN(centerY) && isFinite(centerX) && isFinite(centerY)) {
      setCenter([centerX, centerY]);
      setZoom(4);
    }
  }, [mapToDataMapping, countryData, viewType, timeRange]);

  const handleBackToWorld = () => {
    setCenter([0, 0]);
    setZoom(1);
    setDrillDownLevel('world');
    setSelectedCountry(null);
  };

  const maxCount = Math.max(...Object.values(countryData).map(d => viewType === 'users' ? d.users : d.listings));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {drillDownLevel === 'country' && selectedCountry 
              ? `${selectedCountry} - ${viewType === 'users' ? 'User' : 'Listing'} Locations`
              : `${viewType === 'users' ? 'User' : 'Listing'} Locations`
            }
          </h3>
          {drillDownLevel === 'country' && (
            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
              Drill-down Mode
            </span>
          )}
          {onViewTypeChange && (
            <div className="flex space-x-2">
              <button
                onClick={() => onViewTypeChange('users')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewType === 'users' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => onViewTypeChange('listings')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewType === 'listings' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Listings
              </button>
            </div>
          )}
          <div className="flex space-x-2">
            <button
              onClick={() => onTimeRangeChange('24h')}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === '24h' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              24h
            </button>
            <button
              onClick={() => onTimeRangeChange('7d')}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === '7d' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              7d
            </button>
            <button
              onClick={() => onTimeRangeChange('30d')}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === '30d' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              30d
            </button>
            <button
              onClick={() => onTimeRangeChange('90d')}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === '90d' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              90d
            </button>
            <button
              onClick={() => onTimeRangeChange('all')}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === 'all' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
        
        {(zoom > 1 || drillDownLevel === 'country') && (
          <button
            onClick={handleBackToWorld}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Back to World
          </button>
        )}
      </div>


      {/* Map Container */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-gray-500">Loading map...</div>
          </div>
        )}
        
        <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 100,
              center: center
            }}
            width={800}
            height={400}
          >
            <ZoomableGroup zoom={zoom} center={center}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryName = geo.properties.name || geo.properties.NAME || geo.properties.NAME_EN || geo.properties.ADMIN || geo.properties.NAME_LONG || 'Unknown';
                    
                    // In drill-down mode, only show the selected country
                    if (drillDownLevel === 'country' && selectedCountry) {
                      const dataKey = mapToDataMapping[countryName] || countryName;
                      if (dataKey !== selectedCountry) {
                        return null; // Don't render other countries
                      }
                    }
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getFillColor(countryName)}
                        stroke={drillDownLevel === 'country' ? "#1E40AF" : "#D1D5DB"}
                        strokeWidth={drillDownLevel === 'country' ? 2 : 0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: '#3B82F6' },
                          pressed: { outline: 'none' }
                        }}
                        onMouseEnter={(event) => handleMouseEnter(geo, event)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleCountryClick(geo)}
                      />
                    );
                  })
                }
              </Geographies>
              
              {/* Province/State Overlays in Drill-down Mode */}
              {drillDownLevel === 'country' && selectedCountry && (
                <g>
                  {Object.entries(countryData).map(([region, data]) => {
                    const coordinates = selectedCountry === 'Canada' 
                      ? CANADA_PROVINCE_COORDINATES[region as keyof typeof CANADA_PROVINCE_COORDINATES]
                      : USA_STATE_COORDINATES[region as keyof typeof USA_STATE_COORDINATES];
                    
                    if (!coordinates) return null;
                    
                    const count = viewType === 'users' ? data.users : data.listings;
                    const maxCount = Math.max(...Object.values(countryData).map(d => viewType === 'users' ? d.users : d.listings));
                    const intensity = maxCount > 0 ? count / maxCount : 0;
                    
                    // Convert lat/lng to map coordinates (simplified)
                    const x = (coordinates.lng + 180) * (800 / 360);
                    const y = (90 - coordinates.lat) * (400 / 180);
                    
                    return (
                      <g key={region}>
                        {/* Province/State Circle */}
                        <circle
                          cx={x}
                          cy={y}
                          r={Math.max(8, 8 + intensity * 12)}
                          fill={`hsl(210, ${60 + (intensity * 40)}%, ${85 - (intensity * 40)}%)`}
                          stroke="#1E40AF"
                          strokeWidth={2}
                          opacity={0.8}
                        />
                        {/* Province/State Label */}
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#1E40AF"
                          fontWeight="bold"
                        >
                          {region}
                        </text>
                        {/* Count Label */}
                        <text
                          x={x}
                          y={y - 8}
                          textAnchor="middle"
                          fontSize="8"
                          fill="#1E40AF"
                          fontWeight="bold"
                        >
                          {count}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Low</span>
          <div className="flex space-x-1">
            {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
              <div
                key={intensity}
                className="w-4 h-4 rounded"
                style={{
                  backgroundColor: `hsl(210, ${60 + (intensity * 40)}%, ${85 - (intensity * 40)}%)`
                }}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">High</span>
        </div>
        
        <div className="text-sm text-gray-500">
          Max: {maxCount} {viewType}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-md text-sm pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-medium">{tooltip.country}</div>
          <div>{tooltip.count} {viewType}</div>
        </div>
      )}
    </div>
  );
}