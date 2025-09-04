"use client";

import React, { useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

/** API row type */
type Row = {
  location: string;
  userCount: number;
  listingCount: number;
  lat: number | null;
  lng: number | null;
};

const MAP_WIDTH = 600;
const MAP_HEIGHT = 300;

// Simple world GeoJSON (just the outline)
const worldGeoUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

export default function WorldMap() {
  const [worldGeo, setWorldGeo] = useState<any>(null);
  const [data, setData] = useState<Row[]>([]);

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    location: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(worldGeoUrl);
        const geo = await response.json();
        setWorldGeo(geo);
      } catch (error) {
        console.error("Error loading world geo data:", error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Fetch all-time listings data
        const res = await fetch(
          `/api/admin/analytics/locations?type=listings&timeRange=all`
        );
        const json = await res.json() as any;
        
        const fetchedData = Array.isArray(json) ? json : (json.data || []);
        setData(fetchedData);
        console.log('🗺️ Fetched data:', fetchedData.slice(0, 5));
      } catch (error) {
        console.error("Error fetching map data:", error);
        setData([]);
      }
    })();
  }, []);

  // Filter data to only include entries with valid coordinates
  const validData = data.filter(row => 
    row.lat !== null && 
    row.lng !== null && 
    !isNaN(row.lat) && 
    !isNaN(row.lng) &&
    row.listingCount > 0
  );

  console.log('🗺️ Valid data points:', validData.length);
  console.log('🗺️ Sample coordinates:', validData.slice(0, 3).map(row => ({
    location: row.location,
    lat: row.lat,
    lng: row.lng,
    count: row.listingCount
  })));

  // Calculate max count for color scaling
  const maxCount = Math.max(1, ...validData.map(row => row.listingCount));

  // Color scale for heatmap
  const getHeatColor = (count: number) => {
    const intensity = count / maxCount;
    if (intensity === 0) return "rgba(255, 255, 255, 0)"; // Transparent
    if (intensity < 0.2) return "rgba(255, 140, 0, 0.3)"; // Light orange
    if (intensity < 0.4) return "rgba(255, 140, 0, 0.5)"; // Medium orange
    if (intensity < 0.6) return "rgba(255, 140, 0, 0.7)"; // Darker orange
    if (intensity < 0.8) return "rgba(255, 100, 0, 0.8)"; // Dark orange
    return "rgba(255, 60, 0, 0.9)"; // Red-orange
  };

  // Handle mouse enter for tooltips
  const handleMouseEnter = (row: Row, event: React.MouseEvent) => {
    setTooltip({
      location: row.location,
      count: row.listingCount,
      x: event.clientX,
      y: event.clientY
    });
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <ComposableMap 
          width={MAP_WIDTH} 
          height={MAP_HEIGHT} 
          projection="geoMercator"
          projectionConfig={{
            scale: 100,
            center: [0, 20]
          }}
        >
          <ZoomableGroup center={[0, 20]} zoom={1}>
            {/* World outline */}
            {worldGeo && (
              <Geographies geography={worldGeo}>
                {({ geographies }) =>
                  geographies.map((geo: any) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: {
                          fill: "#f8f9fa",
                          outline: "none",
                          stroke: "#e9ecef",
                          strokeWidth: 0.5,
                        },
                        hover: {
                          fill: "#f8f9fa",
                          outline: "none",
                        },
                        pressed: {
                          fill: "#f8f9fa",
                          outline: "none",
                        },
                      }}
                    />
                  ))
                }
              </Geographies>
            )}

            {/* Heatmap circles for each listing location */}
            {validData.map((row, index) => {
              const size = Math.max(3, Math.min(20, row.listingCount * 2));
              const color = getHeatColor(row.listingCount);
              
              // Convert lat/lng to map coordinates
              // For Mercator projection, we need to convert lat/lng to x/y coordinates
              const x = (row.lng! + 180) * (MAP_WIDTH / 360);
              const y = (90 - row.lat!) * (MAP_HEIGHT / 180);
              
              console.log(`🗺️ Plotting ${row.location}: lat=${row.lat}, lng=${row.lng} -> x=${x}, y=${y}`);
              
              return (
                <circle
                  key={`${row.lat}-${row.lng}-${index}`}
                  cx={x}
                  cy={y}
                  r={size}
                  fill={color}
                  stroke="rgba(255, 140, 0, 0.8)"
                  strokeWidth={1}
                  onMouseEnter={(event) => handleMouseEnter(row, event)}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: "pointer" }}
                />
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span className="text-sm text-gray-600">0</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-200 rounded"></div>
            <span className="text-sm text-gray-600">Low</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-400 rounded"></div>
            <span className="text-sm text-gray-600">Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-600 rounded"></div>
            <span className="text-sm text-gray-600">High</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          {validData.length} locations • Max: {maxCount} listings
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-2">
        Granular heatmap showing individual listing locations worldwide.
      </p>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm pointer-events-none z-20"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
          }}
        >
          {tooltip.location}: {tooltip.count} listings
        </div>
      )}
    </div>
  );
}