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

// Geographic data URLs
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const usaStatesUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const canadaProvincesUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

// Country mapping for data lookup
const COUNTRY_MAPPING: Record<string, string> = {
  'United States': 'United States of America',
  'USA': 'United States of America',
  'US': 'United States of America',
  'Canada': 'Canada',
  'United Kingdom': 'United Kingdom',
  'UK': 'United Kingdom',
  'Germany': 'Germany',
  'France': 'France',
  'Italy': 'Italy',
  'Spain': 'Spain',
  'Netherlands': 'Netherlands',
  'Sweden': 'Sweden',
  'Norway': 'Norway',
  'Denmark': 'Denmark',
  'Finland': 'Finland',
  'Austria': 'Austria',
  'Switzerland': 'Switzerland',
  'Belgium': 'Belgium',
  'Ireland': 'Ireland',
  'Poland': 'Poland',
  'Czech Republic': 'Czech Republic',
  'Hungary': 'Hungary',
  'Portugal': 'Portugal',
  'Greece': 'Greece',
  'Australia': 'Australia',
  'Japan': 'Japan',
  'South Korea': 'South Korea',
  'Singapore': 'Singapore',
  'Hong Kong': 'Hong Kong',
  'Taiwan': 'Taiwan',
};

// US State mapping
const US_STATE_MAPPING: Record<string, string> = {
  'California': 'California',
  'Texas': 'Texas',
  'Florida': 'Florida',
  'New York': 'New York',
  'Pennsylvania': 'Pennsylvania',
  'Illinois': 'Illinois',
  'Ohio': 'Ohio',
  'Georgia': 'Georgia',
  'North Carolina': 'North Carolina',
  'Michigan': 'Michigan',
  'New Jersey': 'New Jersey',
  'Virginia': 'Virginia',
  'Washington': 'Washington',
  'Arizona': 'Arizona',
  'Massachusetts': 'Massachusetts',
  'Tennessee': 'Tennessee',
  'Indiana': 'Indiana',
  'Missouri': 'Missouri',
  'Maryland': 'Maryland',
  'Wisconsin': 'Wisconsin',
  'Colorado': 'Colorado',
  'Minnesota': 'Minnesota',
  'South Carolina': 'South Carolina',
  'Alabama': 'Alabama',
  'Louisiana': 'Louisiana',
  'Kentucky': 'Kentucky',
  'Oregon': 'Oregon',
  'Oklahoma': 'Oklahoma',
  'Connecticut': 'Connecticut',
  'Utah': 'Utah',
  'Iowa': 'Iowa',
  'Nevada': 'Nevada',
  'Arkansas': 'Arkansas',
  'Mississippi': 'Mississippi',
  'Kansas': 'Kansas',
  'New Mexico': 'New Mexico',
  'Nebraska': 'Nebraska',
  'West Virginia': 'West Virginia',
  'Idaho': 'Idaho',
  'Hawaii': 'Hawaii',
  'New Hampshire': 'New Hampshire',
  'Maine': 'Maine',
  'Montana': 'Montana',
  'Rhode Island': 'Rhode Island',
  'Delaware': 'Delaware',
  'South Dakota': 'South Dakota',
  'North Dakota': 'North Dakota',
  'Alaska': 'Alaska',
  'Vermont': 'Vermont',
  'Wyoming': 'Wyoming',
  'District of Columbia': 'District of Columbia',
};

// Canadian Province mapping
const CANADA_PROVINCE_MAPPING: Record<string, string> = {
  'Ontario': 'Ontario',
  'Quebec': 'Quebec',
  'British Columbia': 'British Columbia',
  'Alberta': 'Alberta',
  'Manitoba': 'Manitoba',
  'Saskatchewan': 'Saskatchewan',
  'Nova Scotia': 'Nova Scotia',
  'New Brunswick': 'New Brunswick',
  'Newfoundland and Labrador': 'Newfoundland and Labrador',
  'Prince Edward Island': 'Prince Edward Island',
  'Northwest Territories': 'Northwest Territories',
  'Yukon': 'Yukon',
  'Nunavut': 'Nunavut',
};

export default function WorldMap({ viewType, timeRange, onTimeRangeChange, onViewTypeChange }: WorldMapProps) {
  const [mapData, setMapData] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipContent | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [drillDownLevel, setDrillDownLevel] = useState<'world' | 'country'>('world');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [currentGeoUrl, setCurrentGeoUrl] = useState(geoUrl);

  // Fetch map data based on timeframe and view type
  useEffect(() => {
    const fetchMapData = async () => {
      setLoading(true);
      console.log(`🗺️ Fetching map data for viewType: ${viewType}, timeRange: ${timeRange}`);
      
      try {
        const url = `/api/admin/analytics/locations?type=${viewType}&timeRange=${timeRange}`;
        const response = await fetch(url);
        const data = await response.json() as { data: MapData[] };
        
        if (data.data) {
          setMapData(data.data);
          console.log(`📊 Loaded ${data.data.length} locations`);
        }
      } catch (error) {
        console.error('Error fetching map data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [viewType, timeRange]);

  // Load appropriate geographic data
  useEffect(() => {
    const loadGeoData = async () => {
      let url = geoUrl;
      
      if (drillDownLevel === 'country' && selectedCountry === 'United States of America') {
        url = usaStatesUrl;
      } else if (drillDownLevel === 'country' && selectedCountry === 'Canada') {
        // For now, we'll use the world map for Canada since we don't have province data
        url = geoUrl;
      }
      
      if (url !== currentGeoUrl) {
        setCurrentGeoUrl(url);
      }
    };

    loadGeoData();
  }, [drillDownLevel, selectedCountry, currentGeoUrl]);

  // Process data for current view
  const processedData = useCallback(() => {
    if (!mapData || mapData.length === 0) return {};

    const dataMap: Record<string, { users: number; listings: number }> = {};

    mapData.forEach(item => {
      let key = item.location;
      
      if (drillDownLevel === 'world') {
        // For world view, extract country from location
        const parts = item.location.split(', ');
        if (parts.length > 1) {
          key = parts[parts.length - 1]; // Last part is usually country
        }
        key = COUNTRY_MAPPING[key] || key;
      } else if (drillDownLevel === 'country' && selectedCountry === 'United States of America') {
        // For US states, extract state from location
        const parts = item.location.split(', ');
        if (parts.length >= 2) {
          const state = parts[parts.length - 2]; // Second to last part is usually state
          key = US_STATE_MAPPING[state] || state;
        }
      } else if (drillDownLevel === 'country' && selectedCountry === 'Canada') {
        // For Canadian provinces, extract province from location
        const parts = item.location.split(', ');
        if (parts.length >= 2) {
          const province = parts[parts.length - 2]; // Second to last part is usually province
          key = CANADA_PROVINCE_MAPPING[province] || province;
        }
      }

      if (!dataMap[key]) {
        dataMap[key] = { users: 0, listings: 0 };
      }
      
      dataMap[key].users += item.userCount || 0;
      dataMap[key].listings += item.listingCount || 0;
    });

    return dataMap;
  }, [mapData, drillDownLevel, selectedCountry]);

  const countryData = processedData();

  // Get fill color based on data
  const getFillColor = useCallback((regionName: string) => {
    if (!regionName || regionName === 'undefined') {
      return '#E5E7EB';
    }

    const data = countryData[regionName];
    if (!data) {
      return '#E5E7EB';
    }

    const count = viewType === 'users' ? data.users : data.listings;
    if (count === 0) {
      return '#E5E7EB';
    }

    const maxCount = Math.max(...Object.values(countryData).map(d => viewType === 'users' ? d.users : d.listings));
    const intensity = Math.min(count / maxCount, 1);
    
    const hue = 210; // Blue hue
    const saturation = 60 + (intensity * 40);
    const lightness = 85 - (intensity * 40);
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }, [countryData, viewType]);

  // Handle mouse enter
  const handleMouseEnter = useCallback((geo: any, event: React.MouseEvent) => {
    const regionName = geo.properties.name || geo.properties.NAME || 'Unknown';
    const data = countryData[regionName];
    
    if (data) {
      const count = viewType === 'users' ? data.users : data.listings;
      setTooltip({
        country: regionName,
        count,
        x: event.clientX,
        y: event.clientY
      });
    }
  }, [countryData, viewType]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  // Handle country/region click
  const handleRegionClick = useCallback((geo: any) => {
    const regionName = geo.properties.name || geo.properties.NAME || 'Unknown';
    
    if (drillDownLevel === 'world') {
      // Only allow drill-down for US and Canada
      if (regionName === 'United States of America' || regionName === 'Canada') {
        setSelectedCountry(regionName);
        setDrillDownLevel('country');
        
        // Center on the country
        if (regionName === 'United States of America') {
          setCenter([-95.7129, 37.0902]);
          setZoom(3);
        } else if (regionName === 'Canada') {
          setCenter([-106.3468, 56.1304]);
          setZoom(3);
        }
      }
    }
  }, [drillDownLevel]);

  // Handle back to world
  const handleBackToWorld = useCallback(() => {
    setCenter([0, 0]);
    setZoom(1);
    setDrillDownLevel('world');
    setSelectedCountry(null);
    setCurrentGeoUrl(geoUrl);
  }, []);

  // Get max count for legend
  const maxCount = Math.max(...Object.values(countryData).map(d => viewType === 'users' ? d.users : d.listings));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {drillDownLevel === 'country' ? `${selectedCountry} - ${viewType === 'users' ? 'Users' : 'Listings'}` : 'World Map'}
          </h3>
          <p className="text-sm text-gray-600">
            {drillDownLevel === 'country' 
              ? `Showing ${viewType} by ${selectedCountry === 'United States of America' ? 'state' : 'province'}`
              : `Showing ${viewType} by country`
            }
          </p>
        </div>
        
        {drillDownLevel === 'country' && (
          <button
            onClick={handleBackToWorld}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Back to World
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">View:</label>
            <select
              value={viewType}
              onChange={(e) => onViewTypeChange?.(e.target.value as 'users' | 'listings')}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="users">Users</option>
              <option value="listings">Listings</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Timeframe:</label>
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">24h</option>
            <option value="7d">7d</option>
            <option value="30d">30d</option>
            <option value="90d">90d</option>
            <option value="all">All time</option>
          </select>
        </div>
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
              <Geographies geography={currentGeoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const regionName = geo.properties.name || geo.properties.NAME || 'Unknown';
                    
                    // Filter regions based on drill-down level
                    if (drillDownLevel === 'country' && selectedCountry === 'United States of America') {
                      // Only show US states
                      if (!US_STATE_MAPPING[regionName]) {
                        return null;
                      }
                    } else if (drillDownLevel === 'country' && selectedCountry === 'Canada') {
                      // For Canada, we'll show the country but highlight provinces
                      if (regionName !== 'Canada') {
                        return null;
                      }
                    } else if (drillDownLevel === 'world') {
                      // For world view, only show countries
                      if (US_STATE_MAPPING[regionName] || CANADA_PROVINCE_MAPPING[regionName]) {
                        return null;
                      }
                    }
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getFillColor(regionName)}
                        stroke={drillDownLevel === 'country' ? "#1E40AF" : "#D1D5DB"}
                        strokeWidth={drillDownLevel === 'country' ? 0.5 : 0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: '#3B82F6' },
                          pressed: { outline: 'none' }
                        }}
                        onMouseEnter={(event) => handleMouseEnter(geo, event)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleRegionClick(geo)}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          {tooltip.country}: {tooltip.count} {viewType}
        </div>
      )}

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
        
        <div className="text-sm text-gray-600">
          Max: {maxCount} {viewType}
        </div>
      </div>
    </div>
  );
}