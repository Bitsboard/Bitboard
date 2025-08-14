"use client";

import React, { useEffect, useState } from "react";

type Place = { name: string; lat: number; lng: number };

interface LocationAutocompleteProps {
  value: Place;
  onSelect: (p: Place) => void;
  inputBase: string;
  dark: boolean;
}

const places: Place[] = [
  { name: "Toronto (City Center)", lat: 43.653, lng: -79.383 },
  { name: "Downtown", lat: 43.6487, lng: -79.3817 },
  { name: "North York", lat: 43.7615, lng: -79.4111 },
  { name: "Etobicoke", lat: 43.6205, lng: -79.5132 },
  { name: "Scarborough", lat: 43.7731, lng: -79.2578 },
  { name: "Markham", lat: 43.8561, lng: -79.337 },
  { name: "Mississauga", lat: 43.589, lng: -79.644 },
  { name: "Vaughan", lat: 43.837, lng: -79.508 },
];

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function LocationAutocomplete({ value, onSelect, inputBase, dark }: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value?.name || "");
  const [filtered, setFiltered] = useState<Place[]>(places);
  
  useEffect(() => {
    setText(value?.name || "");
  }, [value]);
  
  function onChange(v: string) {
    setText(v);
    const f = places.filter((p) => p.name.toLowerCase().includes(v.toLowerCase()));
    setFiltered(f);
    setOpen(true);
  }
  
  function choose(p: Place) {
    onSelect(p);
    setOpen(false);
  }
  
  return (
    <div className="relative">
      <input
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search area (e.g., North York)"
        className={cn("w-full rounded-2xl px-4 py-4", inputBase)}
      />
      {open && (
        <div className={cn("absolute z-20 mt-2 w-full overflow-hidden rounded-xl border", dark ? "border-neutral-800 bg-neutral-900" : "border-neutral-300 bg-white")}>
          {filtered.length === 0 && (
            <div className={cn("px-3 py-2 text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
              No matches. Try: Toronto, Downtown, North York…
            </div>
          )}
          {filtered.map((p) => (
            <button key={p.name} onClick={() => choose(p)} className={cn("block w-full px-3 py-2 text-left text-sm", dark ? "hover:bg-neutral-800" : "hover:bg-neutral-100")}>
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
