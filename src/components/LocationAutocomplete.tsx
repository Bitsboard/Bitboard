"use client";

import React, { useEffect, useState, useRef } from "react";

type Place = { name: string; lat: number; lng: number };

interface LocationAutocompleteProps {
  value: Place;
  onSelect: (p: Place) => void;
  inputBase: string;
  dark: boolean;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const COUNTRY_EXPAND: Record<string, string> = {
  CA: "Canada", CAN: "Canada",
  US: "United States", USA: "United States",
  UK: "United Kingdom", GB: "United Kingdom", GBR: "United Kingdom",
  DE: "Germany", DEU: "Germany",
  FR: "France", FRA: "France",
  ES: "Spain", ESP: "Spain",
  MX: "Mexico", MEX: "Mexico",
  IT: "Italy", ITA: "Italy",
  BR: "Brazil", BRA: "Brazil",
  AU: "Australia", AUS: "Australia",
  JP: "Japan", JPN: "Japan",
};

function expandCountryToken(token: string): string {
  return COUNTRY_EXPAND[token as keyof typeof COUNTRY_EXPAND] || token;
}

export function LocationAutocomplete({ value, onSelect, inputBase, dark }: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value?.name || "");
  const [filtered, setFiltered] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(value?.name || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function onChange(v: string) {
    setText(v);
    setOpen(true);
  }

  function choose(p: Place) {
    onSelect(p);
    setOpen(false);
  }

  function pretty(s: string): string {
    // Expand single/token country codes like CAN, USA when typed alone
    const trimmed = s.trim();
    if (!trimmed) return s;
    if (!trimmed.includes(",") && trimmed.length <= 3) {
      return expandCountryToken(trimmed.toUpperCase());
    }
    // For comma separated values, only expand the last token if it matches a code
    const parts = trimmed.split(',');
    const last = parts[parts.length - 1].trim().toUpperCase();
    if (COUNTRY_EXPAND[last]) {
      parts[parts.length - 1] = COUNTRY_EXPAND[last];
      return parts.join(', ');
    }
    return s;
  }

  // Remote suggestions via Edge endpoint (global Nominatim-backed search)
  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) { setFiltered([]); return; }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const r = await fetch(`/api/places?q=${encodeURIComponent(q)}&limit=20`, { signal: ctl.signal, headers: { 'Accept': 'application/json' } });
        const js = (await r.json()) as { results?: Array<{ name: string; lat: number; lng: number }> };
        const xs = (js.results || []).map(p => ({ name: p.name, lat: p.lat, lng: p.lng }));
        setFiltered(xs);
      } catch {
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [text]);

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        value={pretty(text)}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search city, region, or country"
        className={cn(
          "w-full bg-transparent px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-lg transition-all duration-300 focus:outline-none focus-visible:outline-none focus:ring-0",
          dark ? "text-neutral-100 placeholder-neutral-400" : "text-neutral-900 placeholder-neutral-500"
        )}
      />
      {open && (
        <div className={cn("absolute z-50 mt-3 w-full max-h-60 overflow-y-auto rounded-2xl border shadow-2xl", dark ? "border-neutral-700/50 bg-neutral-900" : "border-neutral-300/50 bg-white")}> 
          {text.trim().length < 2 && (
            <div className={cn("px-4 py-3 text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>
              Start typing to search globally (e.g., "Paris", "NYC", "Canada")
            </div>
          )}
          {loading && (
            <div className={cn("px-4 py-3 text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>Searching…</div>
          )}
          {!loading && text.trim().length >= 2 && filtered.length === 0 && (
            <div className={cn("px-4 py-3 text-sm", dark ? "text-neutral-400" : "text-neutral-600")}>No matches found</div>
          )}
          {filtered.map((p) => (
            <button key={p.name} onClick={() => choose(p)} className={cn("block w-full px-4 py-3 text-left text-sm transition-colors", dark ? "hover:bg-neutral-800/50" : "hover:bg-neutral-100/50")}> 
              {pretty(p.name)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
