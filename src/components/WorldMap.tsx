"use client";

import React, { useEffect, useState } from "react";
import ThermoWorldHeatmap from "./ThermoWorldHeatmap";

type Row = {
  location: string;
  userCount: number;
  listingCount: number;
  lat: number | null;
  lng: number | null;
};

type HeatPoint = {
  lat: number;
  lng: number;
  intensity: number;
  label?: string;
};

export default function WorldMap() {
  const [data, setData] = useState<Row[]>([]);
  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/analytics/locations?type=listings&timeRange=all`
        );
        const json = (await res.json()) as any;
        const fetchedData = Array.isArray(json) ? json : json.data || [];
        setData(fetchedData);
        
        // Convert to heat points for the thermographic heatmap
        const points: HeatPoint[] = fetchedData
          .filter(
            (row: Row) =>
              row.lat !== null &&
              row.lng !== null &&
              !isNaN(row.lat) &&
              !isNaN(row.lng) &&
              row.listingCount > 0
          )
          .map((row: Row) => ({
            lat: row.lat!,
            lng: row.lng!,
            intensity: row.listingCount,
            label: row.location
          }));
        
        setHeatPoints(points);
        console.log(`🗺️ Converted ${points.length} data points to heat points`);
      } catch (error) {
        console.error("Error fetching map data:", error);
        setData([]);
        setHeatPoints([]);
      }
    })();
  }, []);

  const maxCount = Math.max(1, ...data.map(row => row.listingCount || 0));

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800">Global Listings Heatmap</h3>
        <p className="text-sm text-gray-600">Thermographic heatmap showing listing density worldwide.</p>
      </div>

      <div className="relative rounded-lg overflow-hidden shadow-inner" style={{ height: '300px' }}>
        <ThermoWorldHeatmap
          data={heatPoints}
          width={600}
          height={300}
          radius={60}
          innerBlur={40}
          formatIntensity={(x) => `${Math.round(x * maxCount)} listings`}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgb(0, 32, 255)" }}></div>
            <span className="text-sm text-gray-600">Low</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgb(0, 190, 100)" }}></div>
            <span className="text-sm text-gray-600">Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgb(255, 230, 0)" }}></div>
            <span className="text-sm text-gray-600">High</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgb(255, 0, 0)" }}></div>
            <span className="text-sm text-gray-600">Very High</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          Max: {maxCount} listings
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-2">
        Thermographic heatmap with smooth blending showing listing density worldwide.
      </p>
    </div>
  );
}