export const runtime = 'edge';

import { getAdminDb } from '../../_util';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
    const db = await getAdminDb(req);
    const res = await db.prepare('SELECT id, title, price_sat AS priceSat, posted_by AS postedBy, created_at AS createdAt FROM listings ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(limit, offset).all();
    const count = await db.prepare('SELECT COUNT(*) AS c FROM listings').all();
    const total = count.results?.[0]?.c ?? 0;
    return new Response(JSON.stringify({ listings: res.results ?? [], total }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const code = msg === 'unauthorized' ? 401 : msg === 'forbidden' ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), { status: code });
  }
}


