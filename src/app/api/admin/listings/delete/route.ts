export const runtime = 'edge';

import { getAuthSecret, verifyJwtHS256 } from '@/lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

async function requireAdmin(req: Request): Promise<D1Database> {
  const cookieHeader = req.headers.get('cookie') || '';
  const token = /(?:^|; )session=([^;]+)/.exec(cookieHeader)?.[1];
  if (!token) throw new Error('unauthorized');
  const payload = await verifyJwtHS256(token, getAuthSecret());
  if (!payload?.email) throw new Error('unauthorized');
  const { env } = getRequestContext();
  const db = (env as any).DB as D1Database | undefined;
  if (!db) throw new Error('no_db');
  const res = await db.prepare('SELECT is_admin FROM users WHERE email = ?').bind(payload.email).all();
  if (!Boolean(res.results?.[0]?.is_admin)) throw new Error('forbidden');
  return db;
}

export async function POST(req: Request) {
  try {
    const db = await requireAdmin(req);
    const body = (await req.json().catch(() => ({}))) as { id?: unknown };
    const id = (body.id ?? '').toString();
    if (!id) return new Response(JSON.stringify({ error: 'invalid_id' }), { status: 400 });
    await db.prepare('DELETE FROM listings WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const code = msg === 'unauthorized' ? 401 : msg === 'forbidden' ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), { status: code });
  }
}


