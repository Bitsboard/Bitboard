"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { cn } from "@/lib/utils";

interface WorldMapProps {
  data: Array<{
    location: string;
    userCount: number;
    lat: number;
    lng: number;
  }>;
  className?: string;
  viewType?: 'users' | 'listings';
  onViewTypeChange?: (type: 'users' | 'listings') => void;
  timeRange?: '24h' | '7d' | '30d' | '90d' | 'all';
  onTimeRangeChange?: (range: '24h' | '7d' | '30d' | '90d' | 'all') => void;
}

// World map topology data
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Simple country mapping
const countryMapping: Record<string, string> = {
  "United States": "United States of America",
  "USA": "United States of America",
  "US": "United States of America",
  "United Kingdom": "United Kingdom",
  "UK": "United Kingdom",
  "Canada": "Canada",
  "Australia": "Australia",
  "Austria": "Austria",
  "Germany": "Germany",
  "France": "France",
  "Italy": "Italy",
  "Spain": "Spain",
  "Netherlands": "Netherlands",
  "Belgium": "Belgium",
  "Switzerland": "Switzerland",
  "Sweden": "Sweden",
  "Norway": "Norway",
  "Denmark": "Denmark",
  "Finland": "Finland",
  "Poland": "Poland",
  "Czech Republic": "Czech Republic",
  "Hungary": "Hungary",
  "Romania": "Romania",
  "Bulgaria": "Bulgaria",
  "Greece": "Greece",
  "Portugal": "Portugal",
  "Ireland": "Ireland",
  "Iceland": "Iceland",
  "Luxembourg": "Luxembourg",
  "Malta": "Malta",
  "Cyprus": "Cyprus",
  "Estonia": "Estonia",
  "Latvia": "Latvia",
  "Lithuania": "Lithuania",
  "Slovenia": "Slovenia",
  "Slovakia": "Slovakia",
  "Croatia": "Croatia",
  "Serbia": "Serbia",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "Montenegro": "Montenegro",
  "North Macedonia": "North Macedonia",
  "Albania": "Albania",
  "Moldova": "Moldova",
  "Ukraine": "Ukraine",
  "Belarus": "Belarus",
  "Russia": "Russia",
  "Turkey": "Turkey",
  "Israel": "Israel",
  "Palestine": "Palestine",
  "Jordan": "Jordan",
  "Lebanon": "Lebanon",
  "Syria": "Syria",
  "Iraq": "Iraq",
  "Iran": "Iran",
  "Saudi Arabia": "Saudi Arabia",
  "United Arab Emirates": "United Arab Emirates",
  "Qatar": "Qatar",
  "Kuwait": "Kuwait",
  "Bahrain": "Bahrain",
  "Oman": "Oman",
  "Yemen": "Yemen",
  "Egypt": "Egypt",
  "Libya": "Libya",
  "Tunisia": "Tunisia",
  "Algeria": "Algeria",
  "Morocco": "Morocco",
  "Sudan": "Sudan",
  "Ethiopia": "Ethiopia",
  "Kenya": "Kenya",
  "Uganda": "Uganda",
  "Tanzania": "Tanzania",
  "South Africa": "South Africa",
  "Nigeria": "Nigeria",
  "Ghana": "Ghana",
  "Senegal": "Senegal",
  "Mali": "Mali",
  "Burkina Faso": "Burkina Faso",
  "Niger": "Niger",
  "Chad": "Chad",
  "Cameroon": "Cameroon",
  "Central African Republic": "Central African Republic",
  "Democratic Republic of the Congo": "Democratic Republic of the Congo",
  "Republic of the Congo": "Republic of the Congo",
  "Gabon": "Gabon",
  "Equatorial Guinea": "Equatorial Guinea",
  "São Tomé and Príncipe": "São Tomé and Príncipe",
  "Angola": "Angola",
  "Zambia": "Zambia",
  "Zimbabwe": "Zimbabwe",
  "Botswana": "Botswana",
  "Namibia": "Namibia",
  "Lesotho": "Lesotho",
  "Swaziland": "Swaziland",
  "Madagascar": "Madagascar",
  "Mauritius": "Mauritius",
  "Seychelles": "Seychelles",
  "Comoros": "Comoros",
  "Djibouti": "Djibouti",
  "Somalia": "Somalia",
  "Eritrea": "Eritrea",
  "Rwanda": "Rwanda",
  "Burundi": "Burundi",
  "Malawi": "Malawi",
  "Mozambique": "Mozambique",
  "Zambia": "Zambia",
  "Zimbabwe": "Zimbabwe",
  "Botswana": "Botswana",
  "Namibia": "Namibia",
  "South Africa": "South Africa",
  "Lesotho": "Lesotho",
  "Swaziland": "Swaziland",
  "Madagascar": "Madagascar",
  "Mauritius": "Mauritius",
  "Seychelles": "Seychelles",
  "Comoros": "Comoros",
  "Djibouti": "Djibouti",
  "Somalia": "Somalia",
  "Eritrea": "Eritrea",
  "Rwanda": "Rwanda",
  "Burundi": "Burundi",
  "Malawi": "Malawi",
  "Mozambique": "Mozambique",
  "China": "China",
  "Japan": "Japan",
  "South Korea": "South Korea",
  "North Korea": "North Korea",
  "Mongolia": "Mongolia",
  "Taiwan": "Taiwan",
  "Hong Kong": "Hong Kong",
  "Macau": "Macau",
  "Vietnam": "Vietnam",
  "Laos": "Laos",
  "Cambodia": "Cambodia",
  "Thailand": "Thailand",
  "Myanmar": "Myanmar",
  "Malaysia": "Malaysia",
  "Singapore": "Singapore",
  "Indonesia": "Indonesia",
  "Philippines": "Philippines",
  "Brunei": "Brunei",
  "East Timor": "East Timor",
  "Papua New Guinea": "Papua New Guinea",
  "Solomon Islands": "Solomon Islands",
  "Vanuatu": "Vanuatu",
  "New Caledonia": "New Caledonia",
  "Fiji": "Fiji",
  "Tonga": "Tonga",
  "Samoa": "Samoa",
  "American Samoa": "American Samoa",
  "Cook Islands": "Cook Islands",
  "French Polynesia": "French Polynesia",
  "New Zealand": "New Zealand",
  "India": "India",
  "Pakistan": "Pakistan",
  "Bangladesh": "Bangladesh",
  "Sri Lanka": "Sri Lanka",
  "Maldives": "Maldives",
  "Nepal": "Nepal",
  "Bhutan": "Bhutan",
  "Afghanistan": "Afghanistan",
  "Kazakhstan": "Kazakhstan",
  "Uzbekistan": "Uzbekistan",
  "Turkmenistan": "Turkmenistan",
  "Tajikistan": "Tajikistan",
  "Kyrgyzstan": "Kyrgyzstan",
  "Azerbaijan": "Azerbaijan",
  "Armenia": "Armenia",
  "Georgia": "Georgia",
  "Brazil": "Brazil",
  "Argentina": "Argentina",
  "Chile": "Chile",
  "Peru": "Peru",
  "Colombia": "Colombia",
  "Venezuela": "Venezuela",
  "Ecuador": "Ecuador",
  "Bolivia": "Bolivia",
  "Paraguay": "Paraguay",
  "Uruguay": "Uruguay",
  "Guyana": "Guyana",
  "Suriname": "Suriname",
  "French Guiana": "French Guiana",
  "Mexico": "Mexico",
  "Guatemala": "Guatemala",
  "Belize": "Belize",
  "El Salvador": "El Salvador",
  "Honduras": "Honduras",
  "Nicaragua": "Nicaragua",
  "Costa Rica": "Costa Rica",
  "Panama": "Panama",
  "Cuba": "Cuba",
  "Jamaica": "Jamaica",
  "Haiti": "Haiti",
  "Dominican Republic": "Dominican Republic",
  "Puerto Rico": "Puerto Rico",
  "Trinidad and Tobago": "Trinidad and Tobago",
  "Barbados": "Barbados",
  "Saint Lucia": "Saint Lucia",
  "Saint Vincent and the Grenadines": "Saint Vincent and the Grenadines",
  "Grenada": "Grenada",
  "Antigua and Barbuda": "Antigua and Barbuda",
  "Saint Kitts and Nevis": "Saint Kitts and Nevis",
  "Dominica": "Dominica",
  "Bahamas": "Bahamas",
  "Greenland": "Greenland",
  "Iceland": "Iceland",
  "Faroe Islands": "Faroe Islands",
  "Svalbard and Jan Mayen": "Svalbard and Jan Mayen",
  "Bouvet Island": "Bouvet Island",
  "South Georgia and the South Sandwich Islands": "South Georgia and the South Sandwich Islands",
  "Falkland Islands": "Falkland Islands",
  "Antarctica": "Antarctica"
};

export function WorldMap({ 
  data, 
  className, 
  viewType = 'users', 
  onViewTypeChange,
  timeRange = '7d',
  onTimeRangeChange 
}: WorldMapProps) {
  const [tooltipContent, setTooltipContent] = useState<{
    country: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);
  
  const [mapData, setMapData] = useState(data);
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Fetch data when view type or time range changes
  useEffect(() => {
    const fetchMapData = async () => {
      if (!onViewTypeChange || !onTimeRangeChange) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/analytics/locations?type=${viewType}&timeRange=${timeRange}`);
        const result = await response.json() as { 
          success: boolean; 
          data?: Array<{location: string, userCount: number, lat: number, lng: number}>; 
          error?: string 
        };
        
        if (result.success && result.data) {
          setMapData(result.data);
        }
      } catch (err) {
        console.error('Map data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [viewType, timeRange, onViewTypeChange, onTimeRangeChange]);

  // Process data to map locations to countries
  const countryData = mapData.reduce((acc, item) => {
    let countryName = countryMapping[item.location];
    
    // If no direct mapping, try to extract country from location string
    if (!countryName) {
      const location = item.location.toLowerCase();
      
      // US cities and states
      if (location.includes('houston') || location.includes('tx') || 
          location.includes('san francisco') || location.includes('ca') ||
          location.includes('portland') || location.includes('or') ||
          location.includes('el paso') || location.includes('new york') ||
          location.includes('ny') || location.includes('usa') ||
          location.includes('united states')) {
        countryName = 'United States of America';
      }
      // Canada
      else if (location.includes('toronto') || location.includes('on') || 
               location.includes('canada')) {
        countryName = 'Canada';
      }
      // UK
      else if (location.includes('london') || location.includes('uk') ||
               location.includes('united kingdom')) {
        countryName = 'United Kingdom';
      }
      // Australia
      else if (location.includes('sydney') || location.includes('melbourne') ||
               location.includes('australia')) {
        countryName = 'Australia';
      }
      // Austria
      else if (location.includes('vienna') || location.includes('austria')) {
        countryName = 'Austria';
      }
      // Default fallback
      else {
        countryName = item.location;
      }
    }
    
    acc[countryName] = (acc[countryName] || 0) + item.userCount;
    return acc;
  }, {} as Record<string, number>);

  // Get the maximum count for color scaling
  const maxCount = Math.max(...Object.values(countryData), 1);

  // Color scale function
  const getFillColor = (countryName: string) => {
    const count = countryData[countryName] || 0;
    if (count === 0) return "#F3F4F6"; // Light gray for no data
    
    const intensity = Math.min(count / maxCount, 1);
    const hue = viewType === 'users' ? 200 : 120; // Blue for users, green for listings
    const saturation = Math.max(60, intensity * 90); // Higher saturation for visibility
    const lightness = Math.max(75, 100 - intensity * 25); // Less dramatic lightness change
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const handleMouseEnter = useCallback((geo: any, event: React.MouseEvent) => {
    const countryName = geo.properties.NAME || geo.properties.NAME_EN || geo.properties.ADMIN;
    const count = countryData[countryName] || 0;
    
    setTooltipContent({
      country: countryName,
      count: count,
      x: event.clientX,
      y: event.clientY
    });
  }, [countryData]);

  const handleMouseLeave = useCallback(() => {
    setTooltipContent(null);
  }, []);

  const handleCountryClick = useCallback((geo: any) => {
    const countryName = geo.properties.NAME || geo.properties.NAME_EN || geo.properties.ADMIN;
    const count = countryData[countryName] || 0;
    
    console.log(`Clicked ${countryName} with ${count} ${viewType}`);
    setSelectedCountry(countryName);
  }, [countryData, viewType]);

  const handleBackToWorld = useCallback(() => {
    setSelectedCountry(null);
  }, []);

  return (
    <div className={cn("bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6", className)}>
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {selectedCountry && (
            <button
              onClick={handleBackToWorld}
              className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
            >
              ← Back to World
            </button>
          )}
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {selectedCountry 
              ? `${selectedCountry} - ${viewType === 'users' ? 'Users' : 'Listings'}`
              : `Global ${viewType === 'users' ? 'User' : 'Listing'} Distribution`
            }
          </h3>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View type toggle */}
          {onViewTypeChange && (
            <div className="flex bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1">
              <button
                onClick={() => onViewTypeChange('users')}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                  viewType === 'users'
                    ? "bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                )}
              >
                Users
              </button>
              <button
                onClick={() => onViewTypeChange('listings')}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                  viewType === 'listings'
                    ? "bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                )}
              >
                Listings
              </button>
            </div>
          )}
          
          {/* Time range selector */}
          {onTimeRangeChange && (
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value as any)}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              <option value="24h">24h</option>
              <option value="7d">7d</option>
              <option value="30d">30d</option>
              <option value="90d">90d</option>
              <option value="all">All time</option>
            </select>
          )}
        </div>
      </div>

      {/* Map container */}
      <div className="relative bg-neutral-50 dark:bg-neutral-900 rounded-lg overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-neutral-800/80 flex items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <ComposableMap
          projection="geoNaturalEarth1"
          width={800}
          height={500}
          className="w-full h-auto"
        >
          <ZoomableGroup
            center={selectedCountry ? [0, 0] : [0, 0]}
            zoom={selectedCountry ? 3 : 1}
            minZoom={0.5}
            maxZoom={8}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.NAME || geo.properties.NAME_EN || geo.properties.ADMIN;
                  const count = countryData[countryName] || 0;
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getFillColor(countryName)}
                      stroke="#E5E7EB"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          fill: getFillColor(countryName),
                          stroke: "#E5E7EB",
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: viewType === 'users' ? "#3B82F6" : "#10B981",
                          stroke: viewType === 'users' ? "#1D4ED8" : "#059669",
                          strokeWidth: 1.5,
                          outline: "none",
                        },
                        pressed: {
                          fill: viewType === 'users' ? "#1E40AF" : "#065F46",
                          stroke: viewType === 'users' ? "#1E40AF" : "#065F46",
                          strokeWidth: 1.5,
                          outline: "none",
                        },
                      }}
                      onMouseEnter={(event) => handleMouseEnter(geo, event)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleCountryClick(geo)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        
        {/* Instructions */}
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-neutral-800/90 rounded-lg p-3 shadow-lg border border-neutral-200 dark:border-neutral-700">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            <div className="font-medium mb-1">Map Controls:</div>
            <div>• Scroll to zoom</div>
            <div>• Drag to pan</div>
            <div>• Hover for details</div>
            <div>• Click countries to zoom</div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-neutral-800/90 rounded-lg p-3 shadow-lg border border-neutral-200 dark:border-neutral-700">
          <div className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
            {viewType === 'users' ? 'User Count' : 'Listing Count'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#F3F4F6" }}></div>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">No data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getFillColor("United States") }}></div>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${viewType === 'users' ? 200 : 120}, 75%, 80%)` }}></div>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${viewType === 'users' ? 200 : 120}, 90%, 70%)` }}></div>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">High</span>
            </div>
          </div>
        </div>
        
        {/* Tooltip */}
        {tooltipContent && (
          <div
            className="fixed bg-neutral-900 text-white text-xs rounded px-2 py-1 pointer-events-none z-50 shadow-lg"
            style={{
              left: tooltipContent.x + 10,
              top: tooltipContent.y - 40,
            }}
          >
            <div className="font-medium">{tooltipContent.country}</div>
            <div className="text-neutral-300">
              {tooltipContent.count} {viewType}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}