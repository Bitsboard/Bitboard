"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from "./Modal";
import type { Place } from "@/lib/types";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-client";

type LocationModalProps = {
    open: boolean;
    onClose: () => void;
    initialCenter?: { lat: number; lng: number; name?: string };
    initialRadiusKm?: number;
    onApply: (place: Place, radiusKm: number) => void;
    dark?: boolean;
};

// Local sample removed to avoid noisy labels; rely on remote results only
const SAMPLE_PLACES: Array<Place> = [];

export function LocationModal({ open, onClose, initialCenter, initialRadiusKm = 25, onApply, dark }: LocationModalProps) {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const mapRef = React.useRef<any>(null);
    const circleRef = React.useRef<any>(null);
    const markerRef = React.useRef<any>(null);
    const lang = useLang();
    const [query, setQuery] = React.useState<string>("");
    const [radiusKm, setRadiusKm] = React.useState<number>(initialRadiusKm);
    const [center, setCenter] = React.useState<Place>({
        name: initialCenter?.name || "",
        lat: initialCenter?.lat ?? 43.6532,
        lng: initialCenter?.lng ?? -79.3832,
    });
    const [remoteResults, setRemoteResults] = React.useState<Array<{ name: string; lat: number; lng: number }>>([]);

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
            // Base tiles (light/dark)
            const lightUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
            const darkUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
            const base = L.tileLayer(dark ? darkUrl : lightUrl, { maxZoom: 19, attribution: "© OpenStreetMap © CARTO" }).addTo(map);
            // Orange tint overlay via pane
            const pane = (map as any).createPane('orangeTint');
            (pane as any).style.mixBlendMode = 'multiply';
            (pane as any).style.background = 'linear-gradient(0deg, rgba(255,149,0,0.10), rgba(255,149,0,0.10))';
            (pane as any).style.pointerEvents = 'none';
            (L as any).tileLayer('', { pane: 'orangeTint' }).addTo(map);
            const bbIcon = (L as any).icon({
                iconUrl: "/Bitsbarterlogo.svg",
                iconRetinaUrl: "/Bitsbarterlogo.svg",
                iconSize: [36, 36],
                iconAnchor: [18, 34],
                shadowUrl: undefined,
            });
            const marker = (L as any).marker([center.lat, center.lng], { draggable: false, icon: bbIcon }).addTo(map);
            markerRef.current = marker;
            const circle = (L as any).circle(
                [center.lat, center.lng],
                {
                    radius: (radiusKm === 0 ? 100000 : Math.max(1, radiusKm)) * 1000,
                    color: "#f97316",
                    fillColor: "#f97316",
                    fillOpacity: 0.15
                }
            ).addTo(map);
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

    // When the modal opens, seed the search box with the current selection so it's not blank
    React.useEffect(() => {
        if (!open) return;
        const currentName = center?.name || initialCenter?.name || "";
        if (currentName && !query) setQuery(currentName);
    }, [open]);

    // Update circle when radius changes
    React.useEffect(() => {
        if (!mapRef.current || !circleRef.current) return;
        // Everywhere: draw a gigantic circle (~100,000 km) so the map appears fully orange
        const meters = (radiusKm === 0 ? 100000 : radiusKm) * 1000;
        circleRef.current.setRadius(meters);
        // Keep a subtle base tint regardless
        (mapRef.current.getPane('orangeTint') as any).style.background = 'linear-gradient(0deg, rgba(255,149,0,0.10), rgba(255,149,0,0.10))';
    }, [radiusKm]);

    // Update map center when center changes (from search select)
    React.useEffect(() => {
        if (mapRef.current && markerRef.current && circleRef.current) {
            mapRef.current.setView([center.lat, center.lng]);
            markerRef.current.setLatLng([center.lat, center.lng]);
            circleRef.current.setLatLng([center.lat, center.lng]);
        }
    }, [center.lat, center.lng]);

    // National scope removed; radius is one of fixed values or Everywhere (0)

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
        if (!q) return [] as typeof remoteResults;
        // Remote results are already globally ranked and deduped by the API; filter client-side for partials
        return remoteResults.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 20);
    }, [query, remoteResults]);

    return (
        <Modal open={open} onClose={onClose} dark={dark} size="md" ariaLabel={t('change_location', lang)}>
            <ModalHeader dark={dark}>
                <h2 className="text-xl font-bold">{t('change_location', lang)}</h2>
                <ModalCloseButton onClose={onClose} dark={dark} label={t('close', lang)} />
            </ModalHeader>
            <ModalBody className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                        <label className={cn("text-xs mb-1 block", dark ? "text-neutral-400" : "text-neutral-500")}>{t('location', lang)}</label>
                        <div className={cn("relative rounded-xl border", dark ? "border-neutral-700 bg-neutral-800" : "border-neutral-300 bg-white")}>
                            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('enter_city', lang)} className={cn("w-full rounded-xl px-4 py-3 text-sm bg-transparent", dark ? "text-neutral-100" : "text-neutral-900")} />
                            {suggestions.length > 0 && (
                                <div className={cn("absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl border shadow", dark ? "border-neutral-700 bg-neutral-900" : "border-neutral-300 bg-white")}>
                                    {suggestions.map((s, idx) => (
                                        <button key={`${s.name}-${idx}`} onClick={() => { setCenter({ name: s.name, lat: s.lat, lng: s.lng }); setQuery(s.name); setRemoteResults([]); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-orange-500/10">
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className={cn("text-xs mb-1 block", dark ? "text-neutral-400" : "text-neutral-500")}>{t('radius', lang)}</label>
                        <select
                            value={radiusKm}
                            onChange={(e) => setRadiusKm(Number(e.target.value))}
                            className={cn("w-full rounded-xl px-4 py-3 text-sm border appearance-none bg-no-repeat pr-10", dark ? "border-neutral-700 bg-neutral-800 text-neutral-100" : "border-neutral-300 bg-white text-neutral-900")}
                            style={{ backgroundImage: `url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")`, backgroundPosition: 'right 1.25rem center', backgroundSize: '1.25em 1.25em' }}
                        >
                            {[2, 5, 10, 25, 50, 100, 250, 500].map((n) => (
                                <option key={n} value={n}>{n} km</option>
                            ))}
                            <option value={0}>{t('all_listings_globally', lang)}</option>
                        </select>
                    </div>
                </div>

                <div className="rounded-xl overflow-hidden relative z-0 bb-map" style={{ height: 280 }}>
                    <div ref={containerRef} className="w-full h-full" />
                    <button
                        type="button"
                        aria-label="Use my location"
                        onClick={async () => {
                            try {
                                await new Promise<void>((resolve, reject) => {
                                    if (!('geolocation' in navigator)) return reject(new Error('no_geo'));
                                    navigator.geolocation.getCurrentPosition(
                                        (pos) => {
                                            const { latitude, longitude } = pos.coords;
                                            (async () => {
                                                try {
                                                    const u = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`;
                                                    const r = await fetch(u, { headers: { 'Accept': 'application/json' } });
                                                    const js = (await r.json()) as { results?: Array<any> };
                                                    const first = (js?.results || []).find((it: any) => typeof it?.feature_code === 'string' && it.feature_code.startsWith('PPL')) || (js?.results || [])[0];
                                                    const city = (first?.name || '').toString();
                                                    const admin1 = (first?.admin1 || '').toString();
                                                    const cc2 = (first?.country_code || '').toString().toUpperCase();
                                                    const name = [city, admin1 || undefined, cc2 || undefined].filter(Boolean).join(', ');
                                                    setCenter({ name: name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, lat: latitude, lng: longitude });
                                                    setQuery(name || city || '');
                                                } catch {
                                                    setCenter({ name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, lat: latitude, lng: longitude });
                                                }
                                                resolve();
                                            })();
                                        },
                                        () => reject(new Error('denied')),
                                        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
                                    );
                                });
                            } catch { /* ignore */ }
                        }}
                        className={cn(
                            'absolute right-3 top-3 z-[1] inline-flex items-center justify-center rounded-xl shadow px-3 py-2',
                            dark ? 'bg-neutral-900/90 text-white border border-neutral-700' : 'bg-white/95 text-neutral-900 border border-neutral-300'
                        )}
                        title={t('change', lang)}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21.707 2.293a1 1 0 0 0-1.06-.217l-18 7a1 1 0 0 0 .062 1.888l7.76 2.59 2.59 7.76a1 1 0 0 0 1.888.062l7-18a1 1 0 0 0-.24-1.083zM12.85 19.435l-1.87-5.6a1 1 0 0 0-.63-.63l-5.6-1.87L19.07 4.93l-6.22 14.505z"/>
                        </svg>
                    </button>
                </div>
            </ModalBody>
            <ModalFooter dark={dark}>
                <button onClick={onClose} className={cn("rounded-xl px-4 py-2 text-sm", dark ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>{t('cancel', lang)}</button>
                <button onClick={() => onApply(center, radiusKm)} className="rounded-xl px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500">{t('apply', lang)}</button>
            </ModalFooter>
        </Modal>
    );
}
