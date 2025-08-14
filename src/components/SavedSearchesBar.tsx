"use client";

import React from "react";

type Category =
  | "Featured"
  | "Electronics"
  | "Mining Gear"
  | "Home & Garden"
  | "Sports & Bikes"
  | "Tools"
  | "Games & Hobbies"
  | "Furniture"
  | "Services";

type AdType = "all" | "sell" | "want";

type Place = { name: string; lat: number; lng: number };

type SavedSearch = {
  id: string;
  name: string;
  notify: boolean;
  lastOpenedAt: number;
  newCount: number;
  query: string;
  category: Category;
  center: Place;
  radiusKm: number;
  adType: AdType;
};

interface SavedSearchesBarProps {
  saved: SavedSearch[];
  onRun: (s: SavedSearch) => void;
  onToggleBell: (id: string) => void;
  onDelete: (id: string) => void;
  dark: boolean;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function SavedSearchesBar({ saved, onRun, onToggleBell, onDelete, dark }: SavedSearchesBarProps) {
  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto rounded-2xl p-3", dark ? "border border-neutral-800 bg-neutral-900" : "border border-neutral-300 bg-white")}>
      {saved.length === 0 ? (
        <span className={cn("text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
          No saved searches yet. Set filters and click "Save search".
        </span>
      ) : (
        saved.map((s) => (
          <div key={s.id} className={cn("flex items-center gap-2 rounded-xl px-3 py-2", dark ? "border border-neutral-800 bg-neutral-950" : "border border-neutral-300 bg-white")}>
            <button onClick={() => onRun(s)} className="text-sm font-semibold hover:underline">
              {s.name}
            </button>
            {s.newCount > 0 && (
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-neutral-950">{s.newCount}</span>
            )}
            <button onClick={() => onToggleBell(s.id)} title="Toggle alerts" className={cn("text-sm", s.notify ? "text-orange-500" : "text-neutral-500")}>
              🔔
            </button>
            <button onClick={() => onDelete(s.id)} title="Remove" className={cn("text-sm", dark ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-500 hover:text-neutral-700")}>
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  );
}
