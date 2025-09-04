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

  // Calculate max count for color scaling
  const maxCount = Math.max(1, ...validData.map(row => row.listingCount));

  // Create a heatmap grid for smooth blending
  const createHeatmapData = () => {
    const gridSize = 20; // Grid resolution
    const heatmapData: Array<{x: number, y: number, intensity: number, count: number}> = [];
    
    // Create a grid of heat points
    for (let x = 0; x < MAP_WIDTH; x += gridSize) {
      for (let y = 0; y < MAP_HEIGHT; y += gridSize) {
        let totalIntensity = 0;
        let totalCount = 0;
        
        // Calculate heat intensity at this grid point
        validData.forEach(row => {
          const dataX = (row.lng! + 180) * (MAP_WIDTH / 360);
          const dataY = (90 - row.lat!) * (MAP_HEIGHT / 180);
          
          // Calculate distance from this grid point to the data point
          const distance = Math.sqrt((x - dataX) ** 2 + (y - dataY) ** 2);
          const influenceRadius = 80; // How far each data point influences
          
          if (distance < influenceRadius) {
            const influence = (1 - distance / influenceRadius) * row.listingCount;
            totalIntensity += influence;
            totalCount += row.listingCount;
          }
        });
        
        if (totalIntensity > 0) {
          heatmapData.push({
            x: x + gridSize / 2,
            y: y + gridSize / 2,
            intensity: totalIntensity,
            count: totalCount
          });
        }
      }
    }
    
    return heatmapData;
  };

  const heatmapData = createHeatmapData();

  // Color scale for thermographic heatmap
  const getHeatColor = (intensity: number) => {
    const normalizedIntensity = intensity / maxCount;
    if (normalizedIntensity === 0) return "rgba(0, 0, 255, 0)"; // Transparent blue
    if (normalizedIntensity < 0.1) return "rgba(0, 0, 255, 0.2)"; // Blue
    if (normalizedIntensity < 0.2) return "rgba(0, 100, 255, 0.3)"; // Light blue
    if (normalizedIntensity < 0.3) return "rgba(0, 200, 255, 0.4)"; // Cyan
    if (normalizedIntensity < 0.4) return "rgba(0, 255, 200, 0.5)"; // Light green
    if (normalizedIntensity < 0.5) return "rgba(100, 255, 100, 0.6)"; // Green
    if (normalizedIntensity < 0.6) return "rgba(200, 255, 0, 0.7)"; // Yellow-green
    if (normalizedIntensity < 0.7) return "rgba(255, 255, 0, 0.8)"; // Yellow
    if (normalizedIntensity < 0.8) return "rgba(255, 200, 0, 0.9)"; // Orange
    if (normalizedIntensity < 0.9) return "rgba(255, 100, 0, 0.9)"; // Red-orange
    return "rgba(255, 0, 0, 0.9)"; // Red
  };

  // Handle mouse enter for tooltips
  const handleMouseEnter = (point: any, event: React.MouseEvent) => {
    setTooltip({
      location: `Heat Zone (${point.count} listings)`,
      count: point.count,
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

            {/* Smooth thermographic heatmap */}
            {heatmapData.map((point, index) => {
              const color = getHeatColor(point.intensity);
              const size = Math.max(8, Math.min(25, point.intensity * 0.5));
              
              return (
                <circle
                  key={`heat-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={size}
                  fill={color}
                  onMouseEnter={(event) => handleMouseEnter(point, event)}
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
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(0, 0, 255, 0.3)" }}></div>
            <span className="text-sm text-gray-600">Low</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(100, 255, 100, 0.7)" }}></div>
            <span className="text-sm text-gray-600">Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(255, 255, 0, 0.9)" }}></div>
            <span className="text-sm text-gray-600">High</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(255, 0, 0, 0.9)" }}></div>
            <span className="text-sm text-gray-600">Very High</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          {validData.length} locations • Max: {maxCount} listings
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-2">
        Thermographic heatmap showing listing density worldwide.
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