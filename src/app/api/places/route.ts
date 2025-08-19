export const runtime = 'edge';

function countryToAlpha3(cc?: string): string | undefined {
    if (!cc) return undefined;
    const m: Record<string, string> = {
        us: 'USA', ca: 'CAN', mx: 'MEX', gb: 'GBR', uk: 'GBR', de: 'DEU', fr: 'FRA', es: 'ESP', it: 'ITA', nl: 'NLD', se: 'SWE', no: 'NOR', fi: 'FIN', dk: 'DNK', au: 'AUS', nz: 'NZL', jp: 'JPN', cn: 'CHN', in: 'IND', br: 'BRA', ar: 'ARG', cl: 'CHL', co: 'COL', pe: 'PER', ru: 'RUS', ua: 'UKR', za: 'ZAF'
    };
    return m[cc.toLowerCase()] || cc.toUpperCase();
}

const US_STATE_ABBR: Record<string, string> = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
};
const CA_PROV_ABBR: Record<string, string> = {
    'Alberta': 'AB', 'British Columbia': 'BC', 'Manitoba': 'MB', 'New Brunswick': 'NB', 'Newfoundland and Labrador': 'NL', 'Nova Scotia': 'NS', 'Ontario': 'ON', 'Prince Edward Island': 'PE', 'Quebec': 'QC', 'Saskatchewan': 'SK', 'Northwest Territories': 'NT', 'Nunavut': 'NU', 'Yukon': 'YT'
};

function abbreviateState(countryCode: string | undefined, state?: string, iso?: string): string | undefined {
    if (!state) return undefined;
    const cc = (countryCode || '').toLowerCase();
    if (iso) {
        // Expect formats like US-ME, CA-ON
        const parts = iso.split('-');
        if (parts.length === 2) return parts[1].toUpperCase();
    }
    if (cc === 'us') return US_STATE_ABBR[state] || undefined;
    if (cc === 'ca') return CA_PROV_ABBR[state] || undefined;
    return undefined;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 15)));
    if (!q || q.length < 2) {
        return new Response(JSON.stringify({ results: [] }), { headers: { 'content-type': 'application/json' } });
    }
    try {
        // Provider 1: Open‑Meteo Geocoding (GeoNames-backed, exhaustive, no API key)
        try {
            const omUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=${limit}&language=en&format=json`;
            const omr = await fetch(omUrl, { headers: { 'Accept': 'application/json' } });
            if (omr.ok) {
                const om = (await omr.json()) as { results?: Array<any> };
                const rows = om?.results ?? [];
                const mapped = rows.map((it) => {
                    const city = (it.name || '').toString();
                    const admin1 = (it.admin1 || '').toString();
                    const c2 = (it.country_code || '').toString();
                    const feature = (it.feature_code || '').toString();
                    // Only populated places (PPL*)
                    if (!city || !c2 || !feature || !feature.startsWith('PPL')) return null;
                    const countryShort = countryToAlpha3(c2);
                    const stateToken = admin1 ? admin1 : undefined;
                    const cleanCity = city.replace(/\s*\(.*?\)\s*/g, '').replace(/\s+-\s+.*/g, '').trim();
                    const name = [cleanCity, stateToken, countryShort].filter(Boolean).join(', ');
                    return { name, lat: Number(it.latitude), lng: Number(it.longitude), pop: Number(it.population) || 0 };
                }).filter(Boolean) as Array<any>;
                // Deduplicate by name, prefer higher population
                const uniq = new Map<string, any>();
                for (const m of mapped) {
                    const k = m.name.toLowerCase();
                    const prev = uniq.get(k);
                    if (!prev || m.pop > prev.pop) uniq.set(k, m);
                }
                const results = Array.from(uniq.values()).slice(0, limit).map(({ pop, ...rest }) => rest);
                if (results.length > 0) {
                    return new Response(JSON.stringify({ results }), { headers: { 'content-type': 'application/json' } });
                }
            }
        } catch {}

        // Provider 2: GeoDB Cities (free)
        try {
            const gUrl = `https://geodb-free-service.wirefreethought.com/v1/geo/cities?namePrefix=${encodeURIComponent(q)}&limit=${limit}&sort=-population&hateoasMode=false&languageCode=en`;
            const gr = await fetch(gUrl, { headers: { 'Accept': 'application/json' } });
            if (gr.ok) {
                const gj = (await gr.json()) as { data?: Array<any> };
                const data = gj?.data ?? [];
                const mapped = data.map((it) => {
                    const cc2: string | undefined = typeof it.countryCode === 'string' ? it.countryCode : undefined;
                    const countryShort = countryToAlpha3(cc2);
                    const regionCode: string | undefined = typeof it.regionCode === 'string' ? it.regionCode : undefined;
                    const regionName: string | undefined = typeof it.region === 'string' ? it.region : undefined;
                    const stateToken = (regionCode || regionName || '').toString().toUpperCase();
                    const city = (it.city || '').toString();
                    if (!city || !countryShort) return null;
                    const cleanCity = city.replace(/\s*\(.*?\)\s*/g, '').replace(/\s+-\s+.*/g, '').trim();
                    const name = [cleanCity, stateToken, countryShort].filter(Boolean).join(', ');
                    return { name, lat: Number(it.latitude), lng: Number(it.longitude), pop: Number(it.population) || 0 };
                }).filter(Boolean) as Array<any>;
                // Deduplicate by name, prefer higher population
                const uniq = new Map<string, any>();
                for (const m of mapped) {
                    const k = m.name.toLowerCase();
                    const prev = uniq.get(k);
                    if (!prev || m.pop > prev.pop) uniq.set(k, m);
                }
                const results = Array.from(uniq.values()).slice(0, limit).map(({ pop, ...rest }) => rest);
                if (results.length > 0) {
                    return new Response(JSON.stringify({ results }), { headers: { 'content-type': 'application/json' } });
                }
            }
        } catch {}

        // Fallback: Nominatim (filtered to settlement types)
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&q=${encodeURIComponent(q)}&class=place&email=noreply@bitsbarter.app`;
        const r = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'bitsbarter/1.0 (+https://bitsbarter.app)'
            }
        });
        const js = (await r.json()) as Array<any>;
        const mapped = js.map((it) => {
            const addr = it.address || {};
            const typ = (it.type || '').toString();
            const allowed = new Set(['city','town','village','municipality','locality']);
            if (!allowed.has(typ)) return null;
            const cc2 = addr.country_code as string | undefined;
            const countryShort = countryToAlpha3(cc2);
            const iso = (addr["ISO3166-2-lvl4"] as string | undefined) || (addr["ISO3166-2-lvl6"] as string | undefined) || (addr["ISO3166-2-lvl3"] as string | undefined);
            const stateAbbr = abbreviateState(cc2, addr.state as string | undefined, iso);
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.locality || '';
            if (!city) return null;
            const cleanCity = String(city).replace(/\s*\(.*?\)\s*/g, '').replace(/\s+-\s+.*/g, '').trim();
            let nameParts: string[] = [];
            if (cleanCity) nameParts.push(cleanCity);
            if (stateAbbr) nameParts.push(stateAbbr);
            else if (addr.state) nameParts.push(String(addr.state));
            if (countryShort) nameParts.push(countryShort);
            const name = nameParts.filter(Boolean).join(', ');
            return {
                name,
                lat: Number(it.lat),
                lng: Number(it.lon),
                importance: typeof it.importance === 'number' ? it.importance : 0,
            };
        }).filter(Boolean) as Array<any>;
        const uniqMap = new Map<string, any>();
        for (const m of mapped) {
            const key = m.name.toLowerCase();
            const prev = uniqMap.get(key);
            if (!prev || m.importance > prev.importance) uniqMap.set(key, m);
        }
        const results = Array.from(uniqMap.values())
            .sort((a, b) => b.importance - a.importance)
            .slice(0, limit)
            .map(({ importance, ...rest }) => rest);
        return new Response(JSON.stringify({ results }), { headers: { 'content-type': 'application/json' } });
    } catch (e) {
        return new Response(JSON.stringify({ results: [] }), { headers: { 'content-type': 'application/json' }, status: 200 });
    }
}
