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

// World map topology data (simplified)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country mapping for common locations
const countryMapping: Record<string, string> = {
  "United States": "United States of America",
  "USA": "United States of America",
  "UK": "United Kingdom",
  "United Kingdom": "United Kingdom",
  "Canada": "Canada",
  "Australia": "Australia",
  "Germany": "Germany",
  "France": "France",
  "Japan": "Japan",
  "China": "China",
  "India": "India",
  "Brazil": "Brazil",
  "Mexico": "Mexico",
  "Spain": "Spain",
  "Italy": "Italy",
  "Netherlands": "Netherlands",
  "Sweden": "Sweden",
  "Norway": "Norway",
  "Denmark": "Denmark",
  "Finland": "Finland",
  "Poland": "Poland",
  "Russia": "Russia",
  "South Korea": "South Korea",
  "Singapore": "Singapore",
  "Thailand": "Thailand",
  "Indonesia": "Indonesia",
  "Philippines": "Philippines",
  "Vietnam": "Vietnam",
  "Malaysia": "Malaysia",
  "New Zealand": "New Zealand",
  "South Africa": "South Africa",
  "Nigeria": "Nigeria",
  "Kenya": "Kenya",
  "Egypt": "Egypt",
  "Morocco": "Morocco",
  "Turkey": "Turkey",
  "Israel": "Israel",
  "Saudi Arabia": "Saudi Arabia",
  "UAE": "United Arab Emirates",
  "United Arab Emirates": "United Arab Emirates",
  "Argentina": "Argentina",
  "Chile": "Chile",
  "Colombia": "Colombia",
  "Peru": "Peru",
  "Venezuela": "Venezuela",
  "Ukraine": "Ukraine",
  "Romania": "Romania",
  "Czech Republic": "Czech Republic",
  "Hungary": "Hungary",
  "Greece": "Greece",
  "Portugal": "Portugal",
  "Belgium": "Belgium",
  "Austria": "Austria",
  "Switzerland": "Switzerland",
  "Ireland": "Ireland",
  "Iceland": "Iceland",
  "Luxembourg": "Luxembourg",
  "Estonia": "Estonia",
  "Latvia": "Latvia",
  "Lithuania": "Lithuania",
  "Slovakia": "Slovakia",
  "Slovenia": "Slovenia",
  "Croatia": "Croatia",
  "Serbia": "Serbia",
  "Bulgaria": "Bulgaria",
  "Albania": "Albania",
  "Macedonia": "North Macedonia",
  "North Macedonia": "North Macedonia",
  "Montenegro": "Montenegro",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "Kosovo": "Kosovo",
  "Moldova": "Moldova",
  "Belarus": "Belarus",
  "Georgia": "Georgia",
  "Armenia": "Armenia",
  "Azerbaijan": "Azerbaijan",
  "Kazakhstan": "Kazakhstan",
  "Uzbekistan": "Uzbekistan",
  "Kyrgyzstan": "Kyrgyzstan",
  "Tajikistan": "Tajikistan",
  "Turkmenistan": "Turkmenistan",
  "Afghanistan": "Afghanistan",
  "Pakistan": "Pakistan",
  "Bangladesh": "Bangladesh",
  "Sri Lanka": "Sri Lanka",
  "Nepal": "Nepal",
  "Bhutan": "Bhutan",
  "Myanmar": "Myanmar",
  "Laos": "Laos",
  "Cambodia": "Cambodia",
  "Brunei": "Brunei",
  "Mongolia": "Mongolia",
  "North Korea": "North Korea",
  "Taiwan": "Taiwan",
  "Hong Kong": "Hong Kong",
  "Macau": "Macau",
  "Maldives": "Maldives",
  "Fiji": "Fiji",
  "Papua New Guinea": "Papua New Guinea",
  "Solomon Islands": "Solomon Islands",
  "Vanuatu": "Vanuatu",
  "Samoa": "Samoa",
  "Tonga": "Tonga",
  "Kiribati": "Kiribati",
  "Tuvalu": "Tuvalu",
  "Nauru": "Nauru",
  "Palau": "Palau",
  "Marshall Islands": "Marshall Islands",
  "Micronesia": "Micronesia",
  "Cook Islands": "Cook Islands",
  "Niue": "Niue",
  "Tokelau": "Tokelau",
  "American Samoa": "American Samoa",
  "Guam": "Guam",
  "Northern Mariana Islands": "Northern Mariana Islands",
  "Puerto Rico": "Puerto Rico",
  "Virgin Islands": "Virgin Islands",
  "Cayman Islands": "Cayman Islands",
  "Bermuda": "Bermuda",
  "Greenland": "Greenland",
  "Faroe Islands": "Faroe Islands",
  "Svalbard": "Svalbard",
  "Jan Mayen": "Jan Mayen",
  "Bouvet Island": "Bouvet Island",
  "South Georgia": "South Georgia",
  "South Sandwich Islands": "South Sandwich Islands",
  "British Antarctic Territory": "British Antarctic Territory",
  "French Southern Territories": "French Southern Territories",
  "Heard Island": "Heard Island",
  "McDonald Islands": "McDonald Islands",
  "Australian Antarctic Territory": "Australian Antarctic Territory",
  "Ross Dependency": "Ross Dependency",
  "Peter I Island": "Peter I Island",
  "Queen Maud Land": "Queen Maud Land",
  "Adélie Land": "Adélie Land",
  "Wilkes Land": "Wilkes Land",
  "Victoria Land": "Victoria Land",
  "Marie Byrd Land": "Marie Byrd Land",
  "Ellsworth Land": "Ellsworth Land",
  "Palmer Land": "Palmer Land",
  "Graham Land": "Graham Land",
  "South Shetland Islands": "South Shetland Islands",
  "South Orkney Islands": "South Orkney Islands",
  "Antarctic Peninsula": "Antarctic Peninsula",
  "Weddell Sea": "Weddell Sea",
  "Ross Sea": "Ross Sea",
  "Amundsen Sea": "Amundsen Sea",
  "Bellingshausen Sea": "Bellingshausen Sea",
  "Scotia Sea": "Scotia Sea",
  "Lazarev Sea": "Lazarev Sea",
  "Riiser-Larsen Sea": "Riiser-Larsen Sea",
  "Cosmonauts Sea": "Cosmonauts Sea",
  "Cooperation Sea": "Cooperation Sea",
  "Davis Sea": "Davis Sea",
  "Mawson Sea": "Mawson Sea",
  "D'Urville Sea": "D'Urville Sea",
  "Somov Sea": "Somov Sea",
  "Ross Ice Shelf": "Ross Ice Shelf",
  "Filchner-Ronne Ice Shelf": "Filchner-Ronne Ice Shelf",
  "Amery Ice Shelf": "Amery Ice Shelf",
  "Larsen Ice Shelf": "Larsen Ice Shelf",
  "George VI Ice Shelf": "George VI Ice Shelf",
  "West Ice Shelf": "West Ice Shelf",
  "Shackleton Ice Shelf": "Shackleton Ice Shelf",
  "Brunt Ice Shelf": "Brunt Ice Shelf",
  "Riiser-Larsen Ice Shelf": "Riiser-Larsen Ice Shelf",
  "Fimbul Ice Shelf": "Fimbul Ice Shelf",
  "Lazarev Ice Shelf": "Lazarev Ice Shelf",
  "Nivl Ice Shelf": "Nivl Ice Shelf",
  "Conger Ice Shelf": "Conger Ice Shelf",
  "Glenzer Ice Shelf": "Glenzer Ice Shelf",
  "Tucker Ice Shelf": "Tucker Ice Shelf",
  "Holmes Ice Shelf": "Holmes Ice Shelf",
  "Rennick Ice Shelf": "Rennick Ice Shelf",
  "Nansen Ice Shelf": "Nansen Ice Shelf",
  "Drygalski Ice Tongue": "Drygalski Ice Tongue",
  "Mertz Ice Tongue": "Mertz Ice Tongue",
  "Erebus Ice Tongue": "Erebus Ice Tongue",
  "Mackay Ice Tongue": "Mackay Ice Tongue",
  "Borchgrevink Ice Tongue": "Borchgrevink Ice Tongue",
  "Terra Nova Ice Tongue": "Terra Nova Ice Tongue"
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

  // Fetch data when view type or time range changes
  useEffect(() => {
    const fetchMapData = async () => {
      if (!onViewTypeChange || !onTimeRangeChange) return; // Use static data if no controls
      
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/analytics/locations?type=${viewType}&timeRange=${timeRange}`);
        const result = await response.json() as { success: boolean; data?: Array<{location: string, userCount: number, lat: number, lng: number}>; error?: string };
        
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

  // Create a map of country names to user counts
  const countryData = mapData.reduce((acc, item) => {
    const countryName = countryMapping[item.location] || item.location;
    acc[countryName] = (acc[countryName] || 0) + item.userCount;
    return acc;
  }, {} as Record<string, number>);

  // Get the maximum count for color scaling
  const maxCount = Math.max(...Object.values(countryData), 1);

  // Color scale function
  const getFillColor = (countryName: string) => {
    const count = countryData[countryName] || 0;
    if (count === 0) return "#F3F4F6"; // Light gray for no data
    
    // Create a color scale from light blue to dark blue
    const intensity = count / maxCount;
    const hue = viewType === 'users' ? 200 : 120; // Blue for users, green for listings
    const saturation = Math.max(30, intensity * 70);
    const lightness = Math.max(80, 100 - intensity * 50);
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const handleMouseEnter = useCallback((geo: any, event: React.MouseEvent) => {
    const countryName = geo.properties.NAME || geo.properties.NAME_EN || geo.properties.ADMIN;
    const count = countryData[countryName] || 0;
    
    setTooltipContent({
      country: countryName,
      count,
      x: event.clientX,
      y: event.clientY,
    });
  }, [countryData]);

  const handleMouseLeave = useCallback(() => {
    setTooltipContent(null);
  }, []);

  return (
    <div className={cn("bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6", className)}>
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Global {viewType === 'users' ? 'User' : 'Listing'} Distribution
        </h3>
        
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
            center={[0, 0]}
            zoom={1}
            minZoom={0.5}
            maxZoom={8}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.NAME || geo.properties.NAME_EN || geo.properties.ADMIN;
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
                          fill: viewType === 'users' ? "#1D4ED8" : "#047857",
                          stroke: viewType === 'users' ? "#1E40AF" : "#065F46",
                          strokeWidth: 1.5,
                          outline: "none",
                        },
                      }}
                      onMouseEnter={(event) => handleMouseEnter(geo, event)}
                      onMouseLeave={handleMouseLeave}
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
              <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${viewType === 'users' ? 200 : 120}, 50%, 60%)` }}></div>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${viewType === 'users' ? 200 : 120}, 70%, 40%)` }}></div>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="fixed z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 shadow-lg pointer-events-none"
          style={{
            left: tooltipContent.x + 10,
            top: tooltipContent.y - 10,
          }}
        >
          <div className="text-sm font-medium text-neutral-900 dark:text-white">
            {tooltipContent.country}
          </div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            {tooltipContent.count} {viewType}
          </div>
        </div>
      )}
    </div>
  );
}
