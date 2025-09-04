'use client';

import React, { useState, useEffect } from 'react';
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

export default function WorldMap({ viewType, timeRange, onTimeRangeChange, onViewTypeChange }: WorldMapProps) {
  const [mapData, setMapData] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipContent | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);

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

  // Process data by country
  const countryData = mapData.reduce((acc, item) => {
    const country = COUNTRY_MAPPING[item.location] || item.location;
    if (!acc[country]) {
      acc[country] = { users: 0, listings: 0 };
    }
    acc[country].users += item.userCount;
    acc[country].listings += item.listingCount;
    return acc;
  }, {} as Record<string, { users: number; listings: number }>);

  // Debug country data processing
  console.log(`🗺️ Map data length: ${mapData.length}`);
  console.log(`🗺️ Country data keys:`, Object.keys(countryData));
  console.log(`🗺️ Country data:`, countryData);
  console.log(`🗺️ View type: ${viewType}`);

  // Get fill color based on data
  const getFillColor = (countryName: string) => {
    // Handle undefined country names
    if (!countryName || countryName === 'undefined') {
      console.log(`🎨 No country name provided, using gray`);
      return '#E5E7EB';
    }
    
    const data = countryData[countryName];
    if (!data) {
      console.log(`🎨 No data for ${countryName}, using gray`);
      return '#E5E7EB'; // Light gray for no data
    }

    const count = viewType === 'users' ? data.users : data.listings;
    if (count === 0) {
      console.log(`🎨 Zero count for ${countryName}, using gray`);
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
    console.log(`🎨 ${countryName}: ${count} ${viewType}, intensity: ${intensity}, color: ${color}`);
    
    return color;
  };

  const handleMouseEnter = (geo: any, event: React.MouseEvent) => {
    // Try different possible property names for country name
    const countryName = geo.properties.NAME || geo.properties.NAME_EN || geo.properties.ADMIN || geo.properties.NAME_LONG || 'Unknown';
    console.log(`🖱️ Mouse enter - geo.properties:`, geo.properties);
    console.log(`🖱️ Country name: ${countryName}`);
    
    const data = countryData[countryName];
    const count = data ? (viewType === 'users' ? data.users : data.listings) : 0;
    
    setTooltip({
      country: countryName,
      count,
      x: event.clientX,
      y: event.clientY - 10
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleCountryClick = (geo: any) => {
    // Try different possible property names for country name
    const countryName = geo.properties.NAME || geo.properties.NAME_EN || geo.properties.ADMIN || geo.properties.NAME_LONG || 'Unknown';
    console.log(`🖱️ Clicked on ${countryName}`);
    console.log(`🖱️ Country data for ${countryName}:`, countryData[countryName]);
    console.log(`🖱️ Current zoom: ${zoom}, center:`, center);
    
    // Zoom in on the country
    const { coordinates } = geo.geometry;
    console.log(`🖱️ Coordinates:`, coordinates);
    
    const bounds = coordinates.reduce((acc: any, coord: any) => {
      const [x, y] = Array.isArray(coord[0]) ? coord[0] : coord;
      return {
        minX: Math.min(acc.minX, x),
        maxX: Math.max(acc.maxX, x),
        minY: Math.min(acc.minY, y),
        maxY: Math.max(acc.maxY, y)
      };
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    console.log(`🖱️ New center: [${centerX}, ${centerY}], new zoom: 4`);
    
    setCenter([centerX, centerY]);
    setZoom(4);
  };

  const handleBackToWorld = () => {
    setCenter([0, 0]);
    setZoom(1);
  };

  const maxCount = Math.max(...Object.values(countryData).map(d => viewType === 'users' ? d.users : d.listings));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {viewType === 'users' ? 'User' : 'Listing'} Locations
          </h3>
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
        
        {zoom > 1 && (
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
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getFillColor(geo.properties.NAME || geo.properties.NAME_EN || geo.properties.ADMIN || geo.properties.NAME_LONG || 'Unknown')}
                      stroke="#D1D5DB"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', fill: '#3B82F6' },
                        pressed: { outline: 'none' }
                      }}
                      onMouseEnter={(event) => handleMouseEnter(geo, event)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleCountryClick(geo)}
                    />
                  ))
                }
              </Geographies>
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