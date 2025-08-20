export const runtime = 'edge';

import { getAdminDb } from '../../_util';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
    const db = await getAdminDb(req);
    const q = (url.searchParams.get('q') || '').trim();
    let where = '';
    let binds: any[] = [];
    if (q) {
      where = 'WHERE email LIKE ? OR username LIKE ?';
      binds.push(`%${q}%`, `%${q}%`);
    }
    const res = await db.prepare(`SELECT id, email, username, verified, is_admin AS isAdmin, banned, created_at AS createdAt FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...binds, limit, offset).all();
    const count = await db.prepare(`SELECT COUNT(*) AS c FROM users ${where}`).bind(...binds).all();
    const total = count.results?.[0]?.c ?? 0;
    return new Response(JSON.stringify({ users: res.results ?? [], total }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const code = msg === 'unauthorized' ? 401 : msg === 'forbidden' ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), { status: code });
  }
}


