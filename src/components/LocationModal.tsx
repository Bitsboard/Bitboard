"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Place } from "@/lib/types";

type LocationModalProps = {
    open: boolean;
    onClose: () => void;
    initialCenter?: { lat: number; lng: number; name?: string };
    initialRadiusKm?: number;
    onApply: (place: Place, radiusKm: number) => void;
    dark?: boolean;
};

// Small local sample; enhanced with remote Nominatim results
const SAMPLE_PLACES: Array<Place & { postal?: string }> = [
    { name: "Toronto, ON", lat: 43.6532, lng: -79.3832, postal: "M5H" },
    { name: "Hamilton, ON", lat: 43.2557, lng: -79.8711, postal: "L8P" },
    { name: "Kitchener, ON", lat: 43.4516, lng: -80.4925, postal: "N2G" },
    { name: "Ottawa, ON", lat: 45.4215, lng: -75.6972, postal: "K1A" },
    { name: "Vancouver, BC", lat: 49.2827, lng: -123.1207, postal: "V5K" },
];

export function LocationModal({ open, onClose, initialCenter, initialRadiusKm = 25, onApply, dark }: LocationModalProps) {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const overlayRef = React.useRef<HTMLDivElement | null>(null);
    const mapRef = React.useRef<any>(null);
    const circleRef = React.useRef<any>(null);
    const markerRef = React.useRef<any>(null);
    const [query, setQuery] = React.useState<string>("");
    const [radiusKm, setRadiusKm] = React.useState<number>(initialRadiusKm);
    const [center, setCenter] = React.useState<Place>({
        name: initialCenter?.name || "",
        lat: initialCenter?.lat ?? 43.6532,
        lng: initialCenter?.lng ?? -79.3832,
    });
    const [remoteResults, setRemoteResults] = React.useState<Array<{ name: string; lat: number; lng: number; postal?: string }>>([]);

    // Ensure Leaflet CSS is present
    React.useEffect(() => {
        if (!open) return;
        const id = "leaflet-css";
        if (!document.getElementById(id)) {
            const link = document.createElement("link");
            link.id = id;
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }
    }, [open]);

    // Initialize Leaflet map lazily when modal opens
    React.useEffect(() => {
        let cleanup = () => { };
        (async () => {
            if (!open || !containerRef.current) return;
            const L = await import("leaflet");
            // Fix default icon paths
            // @ts-ignore
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });
            if (mapRef.current) {
                mapRef.current.remove();
            }
            const map = L.map(containerRef.current).setView([center.lat, center.lng], 10);
            mapRef.current = map;
            // Base tiles
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
            // Orange tint overlay via pane
            const pane = (map as any).createPane('orangeTint');
            (pane as any).style.mixBlendMode = 'multiply';
            (pane as any).style.background = 'linear-gradient(0deg, rgba(255,149,0,0.10), rgba(255,149,0,0.10))';
            (pane as any).style.pointerEvents = 'none';
            (L as any).tileLayer('', { pane: 'orangeTint' }).addTo(map);
            const marker = (L as any).marker([center.lat, center.lng], { draggable: false }).addTo(map);
            markerRef.current = marker;
            const circle = (L as any).circle([center.lat, center.lng], { radius: radiusKm * 1000, color: "#f97316" }).addTo(map);
            circleRef.current = circle;
            // Pin is fixed; users can change by searching/selecting
            cleanup = () => {
                map.remove();
                mapRef.current = null;
                circleRef.current = null;
                markerRef.current = null;
            };
        })();
        return () => cleanup();
    }, [open]);

    // Update circle when radius changes
    React.useEffect(() => {
        if (circleRef.current) {
            circleRef.current.setRadius(radiusKm * 1000);
        }
    }, [radiusKm]);

    // Update map center when center changes (from search select)
    React.useEffect(() => {
        if (mapRef.current && markerRef.current && circleRef.current) {
            mapRef.current.setView([center.lat, center.lng]);
            markerRef.current.setLatLng([center.lat, center.lng]);
            circleRef.current.setLatLng([center.lat, center.lng]);
        }
    }, [center.lat, center.lng]);

    // Remote suggestions via our Edge endpoint (Nominatim-backed)
    React.useEffect(() => {
        const q = query.trim();
        if (!open) return;
        if (q.length < 1) { setRemoteResults([]); return; }
        const ctl = new AbortController();
        const t = setTimeout(async () => {
            try {
                const u = `/api/places?q=${encodeURIComponent(q)}&limit=12`;
                const r = await fetch(u, { headers: { 'Accept': 'application/json' }, signal: ctl.signal });
                const js = (await r.json()) as { results: Array<{ name: string; lat: number; lng: number; postal?: string }> };
                setRemoteResults(js.results || []);
            } catch { /* ignore */ }
        }, 250);
        return () => { clearTimeout(t); ctl.abort(); };
    }, [open, query]);

    const suggestions = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        const local = q ? SAMPLE_PLACES.filter((p) => p.name.toLowerCase().includes(q) || (p.postal ? p.postal.toLowerCase().startsWith(q) : false)) : [];
        // Prioritize remote results; fallback to local
        const merged = [...remoteResults, ...local];
        // De-dup by name
        const seen = new Set<string>();
        const out: typeof merged = [];
        for (const s of merged) {
            const key = (s.name + (s.postal || '')).toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(s);
        }
        return out.slice(0, 20);
    }, [query, remoteResults]);

    if (!open) return null;

    return (
        <div ref={overlayRef} className={cn("fixed inset-0 z-[100] flex items-center justify-center p-4", dark ? "bg-black/60" : "bg-black/40")} role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}>
            <div className={cn("w-full max-w-2xl rounded-2xl shadow-2xl", dark ? "bg-neutral-900 text-neutral-100 border border-neutral-800" : "bg-white text-neutral-900 border border-neutral-200")}
                style={{ maxHeight: "90vh" }}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700/30">
                    <h2 className="text-xl font-bold">Change location</h2>
                    <button onClick={onClose} className={cn("rounded-lg px-3 py-1", dark ? "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800")}>Close</button>
                </div>
                <div className="px-6 py-4 space-y-3" style={{ maxHeight: "calc(90vh - 120px)", overflow: "auto" }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <label className={cn("text-xs mb-1 block", dark ? "text-neutral-400" : "text-neutral-500")}>Location</label>
                            <div className={cn("relative rounded-xl border", dark ? "border-neutral-700 bg-neutral-800" : "border-neutral-300 bg-white")}>
                                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter a city" className={cn("w-full rounded-xl px-4 py-3 text-sm bg-transparent", dark ? "text-neutral-100" : "text-neutral-900")} />
                                {suggestions.length > 0 && (
                                    <div className={cn("absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-xl border shadow", dark ? "border-neutral-700 bg-neutral-900" : "border-neutral-300 bg-white")}>
                                        {suggestions.map((s, idx) => (
                                            <button key={`${s.name}-${s.postal ?? ''}-${idx}`} onClick={() => { setCenter({ name: s.name, lat: s.lat, lng: s.lng }); setQuery(s.name); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-orange-500/10">
                                                {s.name}{s.postal ? ` • ${s.postal}` : ""}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className={cn("text-xs mb-1 block", dark ? "text-neutral-400" : "text-neutral-500")}>Radius</label>
                            <select
                                value={radiusKm}
                                onChange={(e) => setRadiusKm(Number(e.target.value))}
                                className={cn("w-full rounded-xl px-4 py-3 text-sm border appearance-none bg-no-repeat pr-10", dark ? "border-neutral-700 bg-neutral-800 text-neutral-100" : "border-neutral-300 bg-white text-neutral-900")}
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1.25rem center', backgroundSize: '1.25em 1.25em' }}
                            >
                                <option value={5}>5 km</option>
                                <option value={10}>10 km</option>
                                <option value={25}>25 km</option>
                                <option value={40}>40 km</option>
                                <option value={80}>80 km</option>
                            </select>
                        </div>
                    </div>

                    <div className="rounded-xl overflow-hidden" style={{ height: 280 }}>
                        <div ref={containerRef} className="w-full h-full" />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-700/30 sticky bottom-0 bg-inherit">
                    <button onClick={onClose} className={cn("rounded-xl px-4 py-2 text-sm", dark ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>Cancel</button>
                    <button onClick={() => onApply(center, radiusKm)} className="rounded-xl px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500">Apply</button>
                </div>
            </div>
        </div>
    );
}
