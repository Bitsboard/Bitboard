// src/components/WorldMap.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import {
  loadAdmin0,
  loadAdmin1,
  admin0Name,
  admin0A3,
  filterAdmin1ByA3,
  admin1ISO2,
  admin1Name,
  isoFromLocation,
  a3FromISO2,
  canonCountryName,
} from "@/lib/geoDataManager";
import type { GeoFC, GeoFeature } from "@/lib/geoDataManager";
import { scaleLinear } from "d3-scale";

/** API row type */
type Row = {
  location: string;
  userCount: number;
  listingCount: number;
  lat: number | null;
  lng: number | null;
};

type ViewType = "users" | "listings";
type TimeRange = "24h" | "7d" | "30d" | "90d" | "all";

const MAP_WIDTH = 980;
const MAP_HEIGHT = 520;

interface WorldMapProps {
  viewType: 'users' | 'listings';
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onViewTypeChange?: (type: 'users' | 'listings') => void;
}

export default function WorldMap({ viewType, timeRange, onTimeRangeChange, onViewTypeChange }: WorldMapProps) {
  const [admin0, setAdmin0] = useState<GeoFC | null>(null);
  const [admin1, setAdmin1] = useState<GeoFC | null>(null);
  const [data, setData] = useState<Row[]>([]);
  const [view, setView] = useState<ViewType>(viewType);
  const [timeRangeState, setTimeRangeState] = useState<TimeRange>(timeRange as TimeRange);

  // Selected country drilldown (A3, e.g., 'USA' or 'CAN')
  const [selectedA3, setSelectedA3] = useState<string | null>(null);

  // Sync with props
  useEffect(() => {
    setView(viewType);
    setTimeRangeState(timeRange as TimeRange);
  }, [viewType, timeRange]);

  useEffect(() => {
    (async () => {
      try {
        const [a0, a1] = await Promise.all([loadAdmin0(), loadAdmin1()]);
        setAdmin0(a0);
        setAdmin1(a1);
      } catch (error) {
        console.error("Error loading geo data:", error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/analytics/locations?type=${view}&timeRange=${timeRangeState}`
        );
        const json = await res.json() as any;
        
        // Handle both direct array and wrapped response
        const data = Array.isArray(json) ? json : (json.data || []);
        setData(data);
      } catch (error) {
        console.error("Error fetching map data:", error);
        setData([]);
      }
    })();
  }, [view, timeRangeState]);

  // Aggregate counts at country level (Admin0 A3) and admin1 level (ISO_3166_2)
  const { countryCounts, admin1Counts } = useMemo(() => {
    const byCountryA3 = new Map<string, number>();
    const byISO = new Map<string, number>();

    for (const row of data) {
      const iso = isoFromLocation(row.location); // e.g. "US-TX" / "CA-ON" (if parseable)
      const a3 = a3FromISO2(iso);

      const count = view === "users" ? row.userCount : row.listingCount;

      // Admin1 (US/CA) shading
      if (iso) {
        byISO.set(iso, (byISO.get(iso) || 0) + count);
      }

      // Country shading
      if (a3) {
        byCountryA3.set(a3, (byCountryA3.get(a3) || 0) + count);
        continue;
      }

      // Fallback: try to detect country by trailing token (e.g., "London, United Kingdom")
      const tokens = row.location.split(",").map((t) => t.trim());
      if (tokens.length >= 2) {
        const maybeCountry = canonCountryName(tokens[tokens.length - 1]);
        // We'll map this during render where we have admin0 features
        byCountryA3.set(
          `NAME__${maybeCountry}`,
          (byCountryA3.get(`NAME__${maybeCountry}`) || 0) + count
        );
      }
    }

    return { countryCounts: byCountryA3, admin1Counts: byISO };
  }, [data, view]);

  // Color scales
  const worldMax = useMemo(
    () => Math.max(1, ...Array.from(countryCounts.values())),
    [countryCounts]
  );
  const admin1Max = useMemo(
    () => Math.max(1, ...Array.from(admin1Counts.values())),
    [admin1Counts]
  );

  const worldScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, worldMax])
        .range(["#f2f2f2", "#0a84ff"]),
    [worldMax]
  );

  const admin1Scale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, admin1Max])
        .range(["#f4f0ff", "#7c3aed"]),
    [admin1Max]
  );

  // Find country count given a feature
  function valueForCountry(f: GeoFeature): number {
    const props = f.properties || {};
    const a3 = (admin0A3(props) || "").toUpperCase();
    if (countryCounts.has(a3)) return countryCounts.get(a3)!;

    // try matching by name fallback
    const nm = canonCountryName(admin0Name(props));
    const key = `NAME__${nm}`;
    if (countryCounts.has(key)) return countryCounts.get(key)!;

    return 0;
  }

  // Drill target (Admin1) list for selected country
  const admin1Features: GeoFeature[] = useMemo(() => {
    if (!admin1 || !selectedA3) return [];
    return filterAdmin1ByA3(admin1, selectedA3);
  }, [admin1, selectedA3]);

  const isDrilled = !!selectedA3;

  // Zoom heuristics
  const zoom = isDrilled
    ? selectedA3 === "USA"
      ? 2.8
      : selectedA3 === "CAN"
      ? 2.6
      : 2.4
    : 1;

  // Rough centers
  const center: [number, number] = isDrilled
    ? selectedA3 === "USA"
      ? [-98, 39]
      : selectedA3 === "CAN"
      ? [-96, 61]
      : [0, 20]
    : [0, 20];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isDrilled 
              ? `${selectedA3 === 'USA' ? 'United States' : selectedA3 === 'CAN' ? 'Canada' : selectedA3} - ${view === 'users' ? 'Users' : 'Listings'}` 
              : 'World Map'
            }
          </h3>
          <p className="text-sm text-gray-600">
            {isDrilled 
              ? `Showing ${view} by ${selectedA3 === 'USA' ? 'state' : 'province'}`
              : `Showing ${view} by country`
            }
          </p>
        </div>
        
        {isDrilled && (
          <button
            onClick={() => setSelectedA3(null)}
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
              value={view}
              onChange={(e) => {
                const newView = e.target.value as ViewType;
                setView(newView);
                onViewTypeChange?.(newView);
              }}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="users">Users</option>
              <option value="listings">Listings</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Timeframe:</label>
            <select
              value={timeRangeState}
              onChange={(e) => {
                const newRange = e.target.value as TimeRange;
                setTimeRangeState(newRange);
                onTimeRangeChange(newRange);
              }}
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
        <ComposableMap width={MAP_WIDTH} height={MAP_HEIGHT} projection="geoEqualEarth">
          <ZoomableGroup center={center} zoom={zoom}>
            {/* WORLD LAYER (Admin-0) */}
            {!isDrilled && admin0 && (
              <Geographies geography={admin0 as unknown as any}>
                {({ geographies }) =>
                  geographies.map((geo: GeoFeature) => {
                    const props = geo.properties || {};
                    const a3 = (admin0A3(props) || "").toUpperCase();
                    const val = valueForCountry(geo);
                    const fill = worldScale(val);

                    const selectable = a3 === "USA" || a3 === "CAN";

                    return (
                      <Geography
                        key={geo.properties?.ADM0_A3 || geo.properties?.name || Math.random()}
                        geography={geo}
                        onClick={() => selectable && setSelectedA3(a3)}
                        style={{
                          default: {
                            fill,
                            outline: "none",
                            stroke: "#ccc",
                            strokeWidth: 0.5,
                            cursor: selectable ? "pointer" : "default",
                          },
                          hover: {
                            fill: "#1e90ff",
                            outline: "none",
                            cursor: selectable ? "pointer" : "default",
                          },
                          pressed: {
                            fill: "#1e90ff",
                            outline: "none",
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            )}

            {/* ADMIN-1 LAYER (US states / CA provinces) */}
            {isDrilled && admin1Features.length > 0 && (
              <Geographies geography={{ type: "FeatureCollection", features: admin1Features } as any}>
                {({ geographies }) =>
                  geographies.map((geo: GeoFeature) => {
                    const iso = admin1ISO2(geo.properties || {}) || "";
                    const val = admin1Counts.get(iso) || 0;
                    const fill = admin1Scale(val);

                    return (
                      <Geography
                        key={geo.properties?.ADM0_A3 || geo.properties?.name || Math.random()}
                        geography={geo}
                        style={{
                          default: {
                            fill,
                            outline: "none",
                            stroke: "#999",
                            strokeWidth: 0.6,
                            cursor: "default",
                          },
                          hover: {
                            fill: "#7c3aed",
                            outline: "none",
                          },
                          pressed: {
                            fill: "#7c3aed",
                            outline: "none",
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            )}
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
          Max: {isDrilled ? admin1Max : worldMax} {view}
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-2">
        Click <b>United States</b> or <b>Canada</b> to drill down. Colors are choropleth by{" "}
        <b>{view}</b> within the selected <b>{timeRangeState}</b>.
      </p>
    </div>
  );
}