"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import {
  loadAdmin0,
  admin0Name,
  admin0A3,
  canonCountryName,
} from "@/lib/geoDataManager";
import type { GeoFC, GeoFeature } from "@/lib/geoDataManager";
import { scaleLinear } from "d3-scale";

const MAP_WIDTH = 800;
const MAP_HEIGHT = 400;

export default function WorldMap() {
  const [admin0, setAdmin0] = useState<GeoFC | null>(null);
  const [data, setData] = useState<any[]>([]);
  
  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    region: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const a0 = await loadAdmin0();
        setAdmin0(a0);
      } catch (error) {
        console.error("Error loading geo data:", error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/analytics/locations?type=listings&timeRange=all');
        const json = await res.json() as any;
        const data = Array.isArray(json) ? json : (json.data || []);
        setData(data);
      } catch (error) {
        console.error("Error fetching map data:", error);
        setData([]);
      }
    })();
  }, []);

  // Aggregate counts by country
  const countryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    console.log('🗺️ Raw data:', data.slice(0, 5));

    for (const row of data) {
      const count = row.listingCount || 0;
      console.log(`🗺️ Processing: ${row.location} -> ${count} listings`);

      // Parse country from location string
      const tokens = row.location?.split(",").map((t: string) => t.trim()) || [];
      if (tokens.length >= 2) {
        const country = canonCountryName(tokens[tokens.length - 1]);
        const key = `NAME__${country}`;
        counts.set(key, (counts.get(key) || 0) + count);
        console.log(`🗺️ Added to ${country}: ${count} (total: ${counts.get(key)})`);
      }
    }

    console.log('🗺️ Final country counts:', Object.fromEntries(counts));
    return counts;
  }, [data]);

  // Color scale
  const maxCount = useMemo(
    () => Math.max(1, ...Array.from(countryCounts.values())),
    [countryCounts]
  );

  const colorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, maxCount])
        .range(["#f2f2f2", "#ff6b35"]),
    [maxCount]
  );

  function getCountryValue(f: GeoFeature): number {
    const props = f.properties || {};
    const a3 = (admin0A3(props) || "").toUpperCase();
    if (countryCounts.has(a3)) return countryCounts.get(a3)!;

    const nm = canonCountryName(admin0Name(props));
    const key = `NAME__${nm}`;
    if (countryCounts.has(key)) return countryCounts.get(key)!;

    return 0;
  }

  // Handle mouse enter for tooltips
  const handleMouseEnter = (feature: GeoFeature, event: React.MouseEvent) => {
    const props = feature.properties || {};
    const regionName = admin0Name(props) || "Unknown";
    const count = getCountryValue(feature);

    setTooltip({
      region: regionName,
      count,
      x: event.clientX,
      y: event.clientY
    });
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800">Active Listings Heatmap</h3>
        <p className="text-sm text-gray-600">All-time active listings by country</p>
      </div>

      <div className="relative">
        <ComposableMap width={MAP_WIDTH} height={MAP_HEIGHT} projection="geoMercator">
          <Geographies geography={admin0 as unknown as any}>
            {({ geographies }) =>
              geographies.map((geo: GeoFeature) => {
                const val = getCountryValue(geo);
                const fill = colorScale(val);

                return (
                  <Geography
                    key={geo.properties?.ADM0_A3 || geo.properties?.name || Math.random()}
                    geography={geo}
                    onMouseEnter={(event) => handleMouseEnter(geo, event)}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      default: {
                        fill,
                        outline: "none",
                        stroke: "#ddd",
                        strokeWidth: 0.5,
                        cursor: "pointer",
                      },
                      hover: {
                        fill: "#ff6b35",
                        outline: "none",
                        stroke: "#333",
                        strokeWidth: 1,
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6">
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
        <div className="text-sm text-gray-600">
          Max: {maxCount} listings
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
          {tooltip.region}: {tooltip.count} listings
        </div>
      )}
    </div>
  );
}