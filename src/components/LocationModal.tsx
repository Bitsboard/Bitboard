"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from "./Modal";
import type { Place } from "@/lib/types";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-client";
import { useIpLocation } from "@/lib/hooks/useIpLocation";

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
    const leafletRef = React.useRef<any>(null);
    const lang = useLang();
    const [query, setQuery] = React.useState<string>(initialCenter?.name || "");
    
    // Safe setQuery function that prevents worldwide text from being set as query
    const safeSetQuery = React.useCallback((value: string) => {
        if (value === t('all_listings_globally', lang)) {
            setQuery("");
        } else {
            setQuery(value);
        }
    }, [lang, t]);

    // Safe setCenter function that prevents worldwide text from being set as center name
    const safeSetCenter = React.useCallback((value: Place) => {
        if (value.name === t('all_listings_globally', lang)) {
            // Keep the original name, don't set to worldwide text
            setCenter(prev => ({
                ...value,
                name: prev.name || value.name
            }));
        } else {
            setCenter(value);
        }
    }, [lang, t]);
    const [radiusKm, setRadiusKm] = React.useState<number>(initialRadiusKm);
    const { location: ipLocation } = useIpLocation();
    
    const [center, setCenter] = React.useState<Place>(() => {
        if (initialCenter?.lat && initialCenter?.lng) {
            return {
                name: initialCenter.name || "",
                lat: initialCenter.lat,
                lng: initialCenter.lng,
            };
        }
        // Use IP-based location if available, otherwise fallback to Toronto
        if (ipLocation?.lat && ipLocation?.lng) {
            return {
                name: ipLocation.name || "",
                lat: ipLocation.lat,
                lng: ipLocation.lng,
            };
        }
        // Fallback to Toronto coordinates
        return {
            name: "",
            lat: 43.6532,
            lng: -79.3832,
        };
    });
    const [remoteResults, setRemoteResults] = React.useState<Array<{ name: string; lat: number; lng: number }>>([]);
    const [locating, setLocating] = React.useState<boolean>(false);
    const [usingMyLocation, setUsingMyLocation] = React.useState<boolean>(false);
    const [circleMode, setCircleMode] = React.useState<'global' | 'local'>(initialRadiusKm === 0 ? 'global' : 'local');


    // Update query and center when initialCenter changes (e.g., when modal opens with different location)
    React.useEffect(() => {
        if (initialCenter?.lat && initialCenter?.lng) {
            const validLocation = {
                name: initialCenter.name || "",
                lat: initialCenter.lat,
                lng: initialCenter.lng,
            };
            safeSetCenter(validLocation);

        }
        
        // Handle worldwide mode (radius = 0)
        if (initialRadiusKm === 0) {
            setQuery(""); // Keep search bar empty for worldwide mode
            // For worldwide mode, keep the current coordinates and name
            // This prevents jumping to 0,0 (null island) and keeps the city name
        } else if (initialCenter?.name) {
            safeSetQuery(initialCenter.name);
        }
    }, [initialCenter, initialRadiusKm, open, lang]);

    // Update center when IP location becomes available (if no initialCenter was provided)
    React.useEffect(() => {
        if (!initialCenter?.lat && !initialCenter?.lng && ipLocation?.lat && ipLocation?.lng) {
            // Only update if we don't have an initialCenter and IP location is available
            safeSetCenter({
                name: ipLocation.name || "",
                lat: ipLocation.lat,
                lng: ipLocation.lng,
            });
        }
    }, [ipLocation, initialCenter]);

    // Handle radius changes to worldwide mode
    React.useEffect(() => {
        if (radiusKm === 0) {
            // Keep the current location coordinates and name, just clear the query
            // This way the pin stays in place (e.g., NYC) when switching to worldwide
            setQuery(""); // Keep search bar empty for worldwide mode
            // Don't change the center name - keep the original city name
            console.log('LocationModal: Switched to worldwide mode, keeping center at:', center);
        }
    }, [radiusKm, lang, center]);



    // Map zoom helper tied to radius
    function zoomForRadiusKm(r: number): number {
        if (r <= 0) return 1; // world view, show all continents
        if (r <= 2) return 12;
        if (r <= 5) return 11;
        if (r <= 10) return 10;
        if (r <= 25) return 9;
        if (r <= 50) return 8;
        if (r <= 100) return 7;
        if (r <= 250) return 6;
        if (r <= 500) return 5;
        return 4;
    }

    function getCircleRadiusPx(): number {
        const h = containerRef.current?.clientHeight ?? 280;
        const w = containerRef.current?.clientWidth ?? 400;
        return Math.floor(Math.min(h, w) * 0.32); // ~64% diameter, leaves padding top/bottom
    }
    function getGlobalRadiusPx(): number {
        const h = containerRef.current?.clientHeight ?? 280;
        const w = containerRef.current?.clientWidth ?? 400;
        const diag = Math.sqrt(h * h + w * w);
        return Math.ceil(diag / 2) + 20; // cover full map with small padding
    }
    // Helpers for reverse-geocoding and formatting
    const US_STATE_ABBR: Record<string, string> = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
    };
    const CA_PROV_ABBR: Record<string, string> = {
        'Alberta': 'AB', 'British Columbia': 'BC', 'Manitoba': 'MB', 'New Brunswick': 'NB', 'Newfoundland and Labrador': 'NL', 'Nova Scotia': 'NS', 'Ontario': 'ON', 'Prince Edward Island': 'PE', 'Quebec': 'QC', 'Saskatchewan': 'SK', 'Northwest Territories': 'NT', 'Nunavut': 'NU', 'Yukon': 'YT'
    };
    function countryToAlpha3(cc?: string): string | undefined {
        if (!cc) return undefined;
        const m: Record<string, string> = {
            us: 'USA', ca: 'CAN', mx: 'MEX', gb: 'GBR', uk: 'GBR', de: 'DEU', fr: 'FRA', es: 'ESP', it: 'ITA', nl: 'NLD', se: 'SWE', no: 'NOR', fi: 'FIN', dk: 'DNK', au: 'AUS', nz: 'NZL', jp: 'JPN', cn: 'CHN', in: 'IND', br: 'BRA', ar: 'ARG', cl: 'CHL', co: 'COL', pe: 'PER', ru: 'RUS', ua: 'UKR', za: 'ZAF'
        };
        return m[cc.toLowerCase()] || cc.toUpperCase();
    }
    function abbreviateState(cc2?: string, state?: string, iso?: string): string | undefined {
        if (!state) return undefined;
        const cc = (cc2 || '').toLowerCase();
        if (iso && iso.includes('-')) return iso.split('-')[1].toUpperCase();
        if (cc === 'us') return US_STATE_ABBR[state] || undefined;
        if (cc === 'ca') return CA_PROV_ABBR[state] || undefined;
        return undefined;
    }
    function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
        const R = 6371;
        const dLat = (b.lat - a.lat) * Math.PI / 180;
        const dLng = (b.lng - a.lng) * Math.PI / 180;
        const s1 = Math.sin(dLat / 2) ** 2;
        const s2 = Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(s1 + s2));
    }
    async function reverseToNearestCity(lat: number, lng: number): Promise<{ name: string; lat: number; lng: number } | null> {
        // Try Open‑Meteo reverse with multiple results, choose closest populated place
        try {
            const ctl = new AbortController();
            const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lng}&count=10&language=en&format=json`;
            const r = await fetch(url, { signal: ctl.signal });
            if (r.ok) {
                const js = (await r.json()) as { results?: Array<any> };
                const rows = (js?.results || []).filter((it: any) => typeof it?.feature_code === 'string' && it.feature_code.startsWith('PPL'));
                if (rows.length > 0) {
                    let best: any = null; let bestD = Infinity;
                    for (const it of rows) {
                        const d = haversineKm({ lat, lng }, { lat: Number(it.latitude), lng: Number(it.longitude) });
                        if (d < bestD) { best = it; bestD = d; }
                    }
                    if (best) {
                        const cc2 = (best.country_code || '').toString();
                        const country = countryToAlpha3(cc2);
                        const iso = (best.admin1_id as string | undefined) || '';
                        const stateAbbr = abbreviateState(cc2, (best.admin1 || '').toString(), iso);
                        const city = (best.name || '').toString();
                        const name = [city, stateAbbr || (best.admin1 || ''), country].filter(Boolean).join(', ');
                        return { name, lat: Number(best.latitude), lng: Number(best.longitude) };
                    }
                }
            }
        } catch {}
        // Fallback: GeoDB nearby cities
        try {
            const url = `https://geodb-free-service.wirefreethought.com/v1/geo/locations/${lat}${lng}/nearbyCities?limit=5&radius=100&minPopulation=1&sort=distance&hateoasMode=false`;
            const r = await fetch(url);
            if (r.ok) {
                const js = (await r.json()) as { data?: Array<any> };
                const first = (js?.data || [])[0];
                if (first) {
                    const cc2 = (first.countryCode || '').toString();
                    const country = countryToAlpha3(cc2);
                    const state = (first.regionCode || first.region || '').toString();
                    const city = (first.city || '').toString();
                    const name = [city, state, country].filter(Boolean).join(', ');
                    if (city) return { name, lat, lng };
                }
            }
        } catch {}
        // Fallback: Nominatim reverse
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
            const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (r.ok) {
                const js = (await r.json()) as any;
                const addr = js?.address || {};
                const cc2 = (addr.country_code || '').toString();
                const country = countryToAlpha3(cc2);
                const iso = (addr["ISO3166-2-lvl4"] as string | undefined) || (addr["ISO3166-2-lvl6"] as string | undefined) || (addr["ISO3166-2-lvl3"] as string | undefined);
                const stateAbbr = abbreviateState(cc2, (addr.state || '').toString(), iso);
                const city = (addr.city || addr.town || addr.village || addr.municipality || '').toString();
                if (city) {
                    const name = [city, stateAbbr || (addr.state || ''), country].filter(Boolean).join(', ');
                    return { name, lat, lng };
                }
            }
        } catch {}
        return null;
    }

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
            leafletRef.current = L;
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
            const initLat = center.lat;
            const initLng = center.lng;
            const map = L.map(containerRef.current, { zoomControl: false }).setView([initLat, initLng], zoomForRadiusKm(radiusKm));
            mapRef.current = map;
            // Disable interactions
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
            // Grey tiles always
            const greyUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
            const base = L.tileLayer(greyUrl, { maxZoom: 19, attribution: "© OpenStreetMap © CARTO", noWrap: true }).addTo(map);
            // Pane reserved (no tint by default); circle will provide orange fill in Worldwide
            const pane = (map as any).createPane('worldTint');
            (pane as any).style.zIndex = 350;
            (pane as any).style.background = 'transparent';
            (pane as any).style.pointerEvents = 'none';
            (L as any).tileLayer('', { pane: 'worldTint' }).addTo(map);
            const bbIcon = (L as any).icon({
                iconUrl: "/Bitsbarterlogo.svg",
                iconRetinaUrl: "/Bitsbarterlogo.svg",
                iconSize: [36, 36],
                iconAnchor: [18, 34],
                shadowUrl: undefined,
            });
            const marker = (L as any).marker([center.lat, center.lng], { draggable: false, icon: bbIcon }).addTo(map);
            markerRef.current = marker;
            if (radiusKm === 0) {
                const circle = (L as any).circleMarker([center.lat, center.lng], { radius: getGlobalRadiusPx(), stroke: false, fillColor: '#f97316', fillOpacity: 0.25 }).addTo(map);
                circleRef.current = circle;
            } else {
                const circle = (L as any).circleMarker([center.lat, center.lng], { radius: getCircleRadiusPx(), color: "#f97316", fillColor: "#f97316", fillOpacity: 0.15 }).addTo(map);
                circleRef.current = circle;
            }
            setCircleMode(radiusKm === 0 ? 'global' : 'local');
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

    // When the modal opens, restore "using my location" state and seed input appropriately
    React.useEffect(() => {
        if (!open) return;
        let flag = false;
        try { flag = localStorage.getItem('usingMyLocation') === '1'; } catch { }
        const isMyLoc = flag || ((initialCenter?.name || '') === t('my_location', lang));
        setUsingMyLocation(isMyLoc);
        if (isMyLoc) {
            // Show placeholder; do not prefill text
            setQuery("");
        } else {
            // Use initialCenter directly since center state might not be updated yet
            const currentName = initialCenter?.name || center?.name || "";
            // Don't set worldwide text as query
            if (currentName && !query && currentName !== t('all_listings_globally', lang)) {
                safeSetQuery(currentName);
            }
        }
    }, [open, initialCenter?.name, center?.name, lang]);

    // Keep the "My Location" label translated when locale changes
    React.useEffect(() => {
        const flag = (() => { try { return localStorage.getItem('usingMyLocation') === '1'; } catch { return false; } })();
        if (usingMyLocation || flag) {
            setCenter((prev) => ({ ...prev, name: t('my_location', lang) }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lang]);

    // When a city is explicitly selected (center changes) and we're not in "My Location" mode,
    // mirror that selection into the input so the text box always shows the chosen city.
    // Don't mirror worldwide mode - keep the search bar empty with just the placeholder.
    React.useEffect(() => {
        if (!open) return;
        if (!usingMyLocation && center?.name && radiusKm !== 0) {
            safeSetQuery(center.name);
        }
        // Ensure worldwide mode keeps search field empty
        if (radiusKm === 0) {
            setQuery("");
        }
    }, [center.name, usingMyLocation, open, radiusKm]);

    // Safety net: if center changes to a concrete city (not My Location/coords), exit My Location mode
    React.useEffect(() => {
        if (!open) return;
        const name = center?.name || '';
        const isCoords = /\d+\.\d+,\s*\d+\.\d+/.test(name);
        const isMyLoc = name === t('my_location', lang) || isCoords;
        if (!isMyLoc && usingMyLocation) {
            setUsingMyLocation(false);
            try { localStorage.setItem('usingMyLocation', '0'); } catch {}
        }
    }, [center.name, open, lang, usingMyLocation]);

    // Ensure placeholder shows while using My Location by clearing the input value
    React.useEffect(() => {
        if (!open) return;
        if (usingMyLocation) setQuery("");
    }, [usingMyLocation, open]);

    function recreateCircle(currentRadius: number, at: { lat: number; lng: number }) {
        if (!mapRef.current || !leafletRef.current) return;
        const L = (leafletRef.current as any).default || (leafletRef.current as any);
        // Remove any existing circle
        try { circleRef.current?.remove(); } catch {}
        if (currentRadius === 0) {
            circleRef.current = (L as any).circleMarker([at.lat, at.lng], { radius: getGlobalRadiusPx(), stroke: false, fillColor: '#f97316', fillOpacity: 0.25 }).addTo(mapRef.current);
            setCircleMode('global');
        } else {
            circleRef.current = (L as any).circleMarker([at.lat, at.lng], { radius: getCircleRadiusPx(), color: '#f97316', fillColor: '#f97316', fillOpacity: 0.15 }).addTo(mapRef.current);
            setCircleMode('local');
        }
    }

    // Single effect to update view and circle for both radius and center changes
    React.useEffect(() => {
        if (!mapRef.current) return;
        // No pane tint; circle provides orange in Worldwide
        const tint = mapRef.current.getPane('worldTint') as any;
        if (tint) tint.style.background = 'transparent';
        if (radiusKm === 0) {
            mapRef.current.setView([center.lat, center.lng], zoomForRadiusKm(0));
            markerRef.current?.setLatLng([center.lat, center.lng]);
            recreateCircle(0, center);
        } else {
            mapRef.current.setView([center.lat, center.lng], zoomForRadiusKm(radiusKm));
            markerRef.current?.setLatLng([center.lat, center.lng]);
            recreateCircle(radiusKm, center);
        }
    }, [radiusKm, center.lat, center.lng]);

    // Recompute pixel radius on window resize
    React.useEffect(() => {
        function onResize() {
            if (circleRef.current) {
                try {
                    if (circleMode === 'local') circleRef.current.setRadius(getCircleRadiusPx());
                    if (circleMode === 'global') circleRef.current.setRadius(getGlobalRadiusPx());
                } catch {}
            }
        }
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [circleMode]);

    // National scope removed; radius is one of fixed values or Everywhere (0)

    // Remote suggestions via our Edge endpoint (Nominatim-backed)
    React.useEffect(() => {
        const q = query.trim();
        if (!open) return;
        // Allow suggestions even in "My Location" mode when the user types a query
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
                            {/* Search input - placeholder always shows "Enter a city" to encourage city selection, especially when worldwide is selected */}
                            <input
                                value={query}
                                onChange={(e) => { 
                                    safeSetQuery(e.target.value); 
                                    // Exit worldwide mode when user starts typing
                                    if (radiusKm === 0) {
                                        setRadiusKm(25);
                                    }
                                }}
                                onFocus={() => {
                                    // Ensure search field is empty when focusing in worldwide mode
                                    if (radiusKm === 0) {
                                        setQuery("");
                                    }
                                }}
                                placeholder={t('enter_city', lang)}
                                className={cn("w-full rounded-xl px-4 py-3 text-sm bg-transparent", dark ? "text-neutral-100" : "text-neutral-900")}
                            />
                            {suggestions.length > 0 && (
                                <div className={cn("absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl border shadow", dark ? "border-neutral-700 bg-neutral-900" : "border-neutral-300 bg-white")}>
                                    {suggestions.map((s, idx) => (
                                        <button key={`${s.name}-${idx}`} onClick={() => { 
                                            safeSetCenter({ name: s.name, lat: s.lat, lng: s.lng }); 
                                            setUsingMyLocation(false); 
                                            try { localStorage.setItem('usingMyLocation', '0'); } catch {} 
                                            safeSetQuery(s.name); 
                                            setRemoteResults([]); 
                                            // Reset radius to default when selecting a city (exit worldwide mode)
                                            if (radiusKm === 0) {
                                                setRadiusKm(25);
                                            }
                                        }} className="block w-full text-left px-4 py-2 text-sm hover:bg-orange-500/10">
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
                                setLocating(true);
                                await new Promise<void>((resolve, reject) => {
                                    if (!('geolocation' in navigator)) return reject(new Error('no_geo'));
                                    navigator.geolocation.getCurrentPosition(
                                        (pos) => {
                                            const { latitude, longitude } = pos.coords;
                                            // Immediately drop a pin at the user's coordinates for instant feedback
                                            safeSetCenter({ name: t('my_location', lang), lat: latitude, lng: longitude });
                                            setUsingMyLocation(true);
                                            try { localStorage.setItem('usingMyLocation', '1'); } catch {}
                                            setQuery('');
                                            (async () => {
                                                const nearest = await reverseToNearestCity(latitude, longitude);
                                                if (nearest?.name) {
                                                    safeSetCenter({ name: nearest.name, lat: nearest.lat, lng: nearest.lng });
                                                    // Keep the input labeled as "My Location" while using current location
                                                    setUsingMyLocation(true);
                                                    try { localStorage.setItem('usingMyLocation', '1'); } catch {}
                                                    setQuery('');
                                                } else {
                                                    const coordLabel = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                                                    safeSetCenter({ name: coordLabel, lat: latitude, lng: longitude });
                                                    setUsingMyLocation(true);
                                                    try { localStorage.setItem('usingMyLocation', '1'); } catch {}
                                                    setQuery('');
                                                }
                                                resolve();
                                            })();
                                        },
                                        () => reject(new Error('denied')),
                                        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
                                    );
                                });
                            } catch { /* ignore */ }
                            finally { setLocating(false); }
                        }}
                        className={cn(
                            'absolute right-3 top-3 z-[1] inline-flex items-center justify-center rounded-xl shadow px-3 py-2 transition-colors',
                            usingMyLocation
                                ? 'bg-orange-500 text-white border border-orange-500'
                                : 'bg-black text-white border border-black'
                        )}
                        title={t('change', lang)}
                    >
                        {/* Solid navigation icon (filled) */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M12 2L3 21l9-4 9 4-9-19z"/>
                        </svg>
                    </button>
                </div>
            </ModalBody>
            <ModalFooter dark={dark}>
                <button onClick={onClose} className={cn("rounded-xl px-4 py-2 text-sm", dark ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100 text-neutral-700")}>{t('cancel', lang)}</button>
                <button
                    onClick={() => {
                        try { localStorage.setItem('usingMyLocation', usingMyLocation ? '1' : '0'); } catch {}
                        onApply(center, radiusKm);
                    }}
                    className="rounded-xl px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500"
                >
                    {t('apply', lang)}
                </button>
            </ModalFooter>
        </Modal>
    );
}
