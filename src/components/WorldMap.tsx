'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { geoDataManager, GeoData, GeoFeature } from '@/lib/geoDataManager';

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
  region: string;
  count: number;
  x: number;
  y: number;
}

type MapLevel = 'world' | 'admin1';

export default function WorldMap({ viewType, timeRange, onTimeRangeChange, onViewTypeChange }: WorldMapProps) {
  // Core state
  const [mapData, setMapData] = useState<MapData[]>([]);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Map interaction state
  const [tooltip, setTooltip] = useState<TooltipContent | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  
  // Drill-down state
  const [currentLevel, setCurrentLevel] = useState<MapLevel>('world');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Fetch map data from API
  const fetchMapData = useCallback(async () => {
    try {
      const url = `/api/admin/analytics/locations?type=${viewType}&timeRange=${timeRange}`;
      const response = await fetch(url);
      const data = await response.json() as { data: MapData[] };
      
      if (data.data) {
        setMapData(data.data);
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
    }
  }, [viewType, timeRange]);

  // Load geographic data based on current level and selected country
  const loadGeoData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data: GeoData;
      
      if (currentLevel === 'world') {
        data = await geoDataManager.getWorldData();
      } else {
        const countryInfo = geoDataManager.getCountryInfo(selectedCountry!);
        if (!countryInfo) {
          throw new Error(`Country ${selectedCountry} not supported for drill-down`);
        }
        data = await geoDataManager.getAdmin1Data(countryInfo.code);
      }

      setGeoData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load map data';
      setError(errorMessage);
      console.error('Error loading geo data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentLevel, selectedCountry]);

  // Process map data for current view
  const processedData = useCallback(() => {
    if (!mapData || mapData.length === 0) {
      return {};
    }
    
    console.log('🗺️ Processing map data:', mapData);
    console.log('🗺️ Current level:', currentLevel, 'Selected country:', selectedCountry);
    
    const dataMap: Record<string, { users: number; listings: number }> = {};

    mapData.forEach(item => {
      let key = item.location;
      
      if (currentLevel === 'world') {
        // For world view, extract country from location
        const parts = item.location.split(', ');
        let country = parts[parts.length - 1].trim();
        
        // Map to standard country names
        const countryInfo = geoDataManager.getCountryInfo(country);
        if (countryInfo) {
          country = countryInfo.name;
        }
        
        key = country;
      } else if (currentLevel === 'admin1' && selectedCountry) {
        // For admin1 view, extract state/province from location
        const parts = item.location.split(', ');
        if (parts.length >= 2) {
          const stateProvince = parts[parts.length - 2].trim();
          
          // Map state abbreviations to full names for better matching
          const stateMapping: Record<string, string> = {
            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
            'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
            'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
            'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
            'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
            'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
            'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
            'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
            'DC': 'District of Columbia',
            // Canadian provinces
            'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba', 'NB': 'New Brunswick',
            'NL': 'Newfoundland and Labrador', 'NS': 'Nova Scotia', 'ON': 'Ontario', 'PE': 'Prince Edward Island',
            'QC': 'Quebec', 'SK': 'Saskatchewan', 'NT': 'Northwest Territories', 'NU': 'Nunavut', 'YT': 'Yukon'
          };
          
          // Try to map abbreviation to full name, otherwise use the original
          key = stateMapping[stateProvince] || stateProvince;
        }
      }

      if (!dataMap[key]) {
        dataMap[key] = { users: 0, listings: 0 };
      }
      
      dataMap[key].users += item.userCount || 0;
      dataMap[key].listings += item.listingCount || 0;
    });

    console.log('🗺️ Processed data map:', dataMap);
    return dataMap;
  }, [mapData, currentLevel, selectedCountry]);

  // Get fill color for a region
  const getFillColor = useCallback((feature: GeoFeature) => {
    const regionName = geoDataManager.extractRegionName(feature);
    const processedDataMap = processedData();
    const data = processedDataMap[regionName];
    
    if (!data) {
      return '#E5E7EB';
    }

    const count = viewType === 'users' ? data.users : data.listings;
    if (count === 0) {
      return '#E5E7EB';
    }

    const maxCount = Math.max(...Object.values(processedDataMap).map(d => 
      viewType === 'users' ? d.users : d.listings
    ));
    
    if (maxCount === 0) return '#E5E7EB';
    
    const intensity = Math.min(count / maxCount, 1);
    const hue = 210; // Blue hue
    const saturation = 60 + (intensity * 40);
    const lightness = 85 - (intensity * 40);
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }, [processedData, viewType]);

  // Handle mouse enter
  const handleMouseEnter = useCallback((feature: GeoFeature, event: React.MouseEvent) => {
    const regionName = geoDataManager.extractRegionName(feature);
    const processedDataMap = processedData();
    const data = processedDataMap[regionName];
    
    if (data) {
      const count = viewType === 'users' ? data.users : data.listings;
      setTooltip({
        region: regionName,
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

  // Handle region click
  const handleRegionClick = useCallback((feature: GeoFeature) => {
    const regionName = geoDataManager.extractRegionName(feature);
    
    console.log('🗺️ Region clicked:', {
      regionName,
      currentLevel,
      supportsDrillDown: geoDataManager.supportsDrillDown(regionName),
      countryInfo: geoDataManager.getCountryInfo(regionName)
    });
    
    if (currentLevel === 'world') {
      // Check if this country supports drill-down
      if (geoDataManager.supportsDrillDown(regionName)) {
        const countryInfo = geoDataManager.getCountryInfo(regionName);
        if (countryInfo) {
          console.log('🗺️ Drilling down to:', regionName, 'with info:', countryInfo);
          setSelectedCountry(regionName);
          setCurrentLevel('admin1');
          setCenter(countryInfo.center);
          setZoom(countryInfo.zoom);
        }
      } else {
        console.log('🗺️ Country does not support drill-down:', regionName);
      }
    }
  }, [currentLevel]);

  // Handle back to world
  const handleBackToWorld = useCallback(() => {
    setCenter([0, 0]);
    setZoom(1);
    setCurrentLevel('world');
    setSelectedCountry(null);
  }, []);

  // Effects
  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  useEffect(() => {
    loadGeoData();
  }, [loadGeoData]);

  // Get max count for legend
  const processedDataMap = processedData();
  const maxCount = Math.max(...Object.values(processedDataMap).map(d => 
    viewType === 'users' ? d.users : d.listings
  ));

  // Render error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadGeoData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {currentLevel === 'admin1' 
              ? `${selectedCountry} - ${viewType === 'users' ? 'Users' : 'Listings'}` 
              : 'World Map'
            }
          </h3>
          <p className="text-sm text-gray-600">
            {currentLevel === 'admin1' 
              ? `Showing ${viewType} by ${selectedCountry === 'United States of America' ? 'state' : 'province'}`
              : `Showing ${viewType} by country`
            }
          </p>
        </div>
        
        {currentLevel === 'admin1' && (
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
        
        {geoData && (
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
              <Geographies geography={geoData}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getFillColor(geo)}
                      stroke="#FFFFFF"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          fill: getFillColor(geo),
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
        )}
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
          {tooltip.region}: {tooltip.count} {viewType}
        </div>
      )}
    </div>
  );
}