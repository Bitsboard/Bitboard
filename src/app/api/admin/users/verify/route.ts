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
  await db.prepare('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, username TEXT UNIQUE, sso TEXT, verified INTEGER DEFAULT 0, is_admin INTEGER DEFAULT 0, banned INTEGER DEFAULT 0, created_at INTEGER NOT NULL, image TEXT)').run();
  // Ensure columns exist (no-op if already there)
  try { await db.prepare('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0').run(); } catch {}
  try { await db.prepare('ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0').run(); } catch {}
  const res = await db.prepare('SELECT is_admin FROM users WHERE email = ?').bind(payload.email).all();
  if (!Boolean(res.results?.[0]?.is_admin)) throw new Error('forbidden');
  return db;
}

export async function POST(req: Request) {
  try {
    const db = await requireAdmin(req);
    const body = (await req.json().catch(() => ({}))) as { userId?: unknown; verified?: unknown };
    const userId = (body.userId ?? '').toString();
    const verified = String(body.verified) === 'true' || body.verified === true ? 1 : 0;
    if (!userId) return new Response(JSON.stringify({ error: 'invalid_user' }), { status: 400 });
    await db.prepare('UPDATE users SET verified = ? WHERE id = ?').bind(verified, userId).run();
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const code = msg === 'unauthorized' ? 401 : msg === 'forbidden' ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), { status: code });
  }
}


