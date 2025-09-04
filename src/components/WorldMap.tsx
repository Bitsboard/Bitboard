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
const canadaProvincesUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/canada.geojson";

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
  'Poland': 'Poland',
  'Czech Republic': 'Czech Republic',
  'Hungary': 'Hungary',
  'Ireland': 'Ireland',
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
      
      try {
        const url = `/api/admin/analytics/locations?type=${viewType}&timeRange=${timeRange}`;
        const response = await fetch(url);
        const data = await response.json() as { data: MapData[] };
        
        if (data.data) {
          setMapData(data.data);
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
        url = canadaProvincesUrl;
      }
      
      if (url !== currentGeoUrl) {
        setCurrentGeoUrl(url);
      }
    };

    loadGeoData();
  }, [drillDownLevel, selectedCountry, currentGeoUrl]);

  // Process data for current view
  const processedData = useCallback(() => {
    if (!mapData || mapData.length === 0) {
      return {};
    }
    
    const dataMap: Record<string, { users: number; listings: number }> = {};

    mapData.forEach(item => {
      let key = item.location;
      
      if (drillDownLevel === 'world') {
        // For world view, extract country from location and aggregate
        const parts = item.location.split(', ');
        let country = parts[parts.length - 1].trim(); // Last part is usually country
        
        // Map to standard country names
        country = COUNTRY_MAPPING[country] || country;
        
        // Special handling for US cities - aggregate all under "United States of America"
        if (parts.length >= 2) {
          const state = parts[parts.length - 2].trim();
          if (US_STATE_MAPPING[state]) {
            country = 'United States of America';
          }
        }
        
        // Special handling for Canadian cities - aggregate all under "Canada"
        if (parts.length >= 2) {
          const province = parts[parts.length - 2].trim();
          if (CANADA_PROVINCE_MAPPING[province]) {
            country = 'Canada';
          }
        }
        
        key = country;
      } else if (drillDownLevel === 'country' && selectedCountry === 'United States of America') {
        // For US states, extract state from location
        const parts = item.location.split(', ');
        if (parts.length >= 2) {
          const state = parts[parts.length - 2].trim();
          key = US_STATE_MAPPING[state] || state;
        }
      } else if (drillDownLevel === 'country' && selectedCountry === 'Canada') {
        // For Canadian provinces, extract province from location
        const parts = item.location.split(', ');
        if (parts.length >= 2) {
          const province = parts[parts.length - 2].trim();
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
    
    // Use the processed data directly
    const processedDataMap = processedData();
    const data = processedDataMap[regionName];
    
    if (!data) {
      return '#E5E7EB';
    }

    const count = viewType === 'users' ? data.users : data.listings;
    if (count === 0) {
      return '#E5E7EB';
    }

    const maxCount = Math.max(...Object.values(processedDataMap).map(d => viewType === 'users' ? d.users : d.listings));
    const intensity = Math.min(count / maxCount, 1);
    
    const hue = 210; // Blue hue
    const saturation = 60 + (intensity * 40);
    const lightness = 85 - (intensity * 40);
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }, [processedData, viewType]);

  // Handle mouse enter
  const handleMouseEnter = useCallback((geo: any, event: React.MouseEvent) => {
    const regionName = geo.properties.name || geo.properties.NAME || 'Unknown';
    
    // Use the processed data directly
    const processedDataMap = processedData();
    const data = processedDataMap[regionName];
    
    if (data) {
      const count = viewType === 'users' ? data.users : data.listings;
      setTooltip({
        country: regionName,
        count,
        x: event.clientX,
        y: event.clientY
      });
    }
  }, [processedData, viewType]);

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
      </div>

      {/* Map */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="text-gray-600">Loading map data...</div>
          </div>
        )}
        
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 147,
            center: center,
          }}
          width={800}
          height={400}
        >
          <ZoomableGroup zoom={zoom} center={center}>
            <Geographies geography={currentGeoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getFillColor(geo.properties.name || geo.properties.NAME || 'Unknown')}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        fill: getFillColor(geo.properties.name || geo.properties.NAME || 'Unknown'),
                        outline: 'none',
                      },
                      hover: {
                        fill: '#3B82F6',
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: {
                        fill: '#1D4ED8',
                        outline: 'none',
                      },
                    }}
                    onMouseEnter={(event) => handleMouseEnter(geo, event)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleRegionClick(geo)}
                  />
                ))
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span className="text-sm text-gray-600">0</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-200 rounded"></div>
            <span className="text-sm text-gray-600">Low</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span className="text-sm text-gray-600">Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span className="text-sm text-gray-600">High</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          Max: {maxCount} {viewType}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm pointer-events-none z-20"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
          }}
        >
          {tooltip.country}: {tooltip.count} {viewType}
        </div>
      )}
    </div>
  );
}
