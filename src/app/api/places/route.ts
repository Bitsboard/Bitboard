export const runtime = 'edge';

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const q = (searchParams.get('q') || '').trim();
	const limit = Math.min(30, Math.max(1, Number(searchParams.get('limit') || 15)));
	if (!q || q.length < 2) {
		return new Response(JSON.stringify({ results: [] }), { headers: { 'content-type': 'application/json' } });
	}
	try {
		const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&q=${encodeURIComponent(q)}&email=noreply@bitsbarter.app`;
		const r = await fetch(url, {
			headers: {
				'Accept': 'application/json',
				'User-Agent': 'bitsbarter/1.0 (+https://bitsbarter.app)'
			}
		});
		const js = (await r.json()) as Array<any>;
		const mapped = js.map((it) => {
			const nameParts: string[] = [];
			const city = it.address?.city || it.address?.town || it.address?.village || '';
			if (city) nameParts.push(city);
			if (it.address?.state) nameParts.push(it.address.state);
			if (it.address?.country) nameParts.push(it.address.country);
			const name = nameParts.length ? nameParts.join(', ') : (it.display_name?.split(',').slice(0, 3).join(', ') || '');
			const postal = it.address?.postcode as string | undefined;
			return {
				name,
				lat: Number(it.lat),
				lng: Number(it.lon),
				postal,
				importance: typeof it.importance === 'number' ? it.importance : 0,
			};
		});
		// Deduplicate by name, prefer higher importance
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
