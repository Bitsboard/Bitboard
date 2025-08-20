export const runtime = 'edge';

import { getAuthSecret, verifyJwtHS256 } from '@/lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
    const cookieHeader = req.headers.get('cookie') || '';
    const token = /(?:^|; )session=([^;]+)/.exec(cookieHeader)?.[1];
    if (!token) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    const payload = await verifyJwtHS256(token, getAuthSecret());
    if (!payload?.email) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });

    const body = (await req.json().catch(() => ({ username: '' }))) as { username?: unknown };
    const { username } = body;
    const handle = (username || '').toString().trim().toLowerCase();
    if (!/^[a-z0-9_\.\-]{3,20}$/.test(handle)) {
        return new Response(JSON.stringify({ error: 'invalid_username' }), { status: 400 });
    }

    try {
        const { env } = getRequestContext();
        const db = (env as any).DB as D1Database | undefined;
        if (!db) return new Response(JSON.stringify({ error: 'no_db' }), { status: 500 });
        await db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      sso TEXT,
      verified INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      image TEXT
    )`).run();
        try { await db.prepare('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0').run(); } catch {}
        try { await db.prepare('ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0').run(); } catch {}
        // One-time change rule: only allow update if current username is default pattern
        const current = await db.prepare('SELECT username FROM users WHERE email = ?').bind(payload.email).all();
        const cur = current.results?.[0]?.username as string | undefined;
        if (cur && !/^User[0-9a-z]{8}$/i.test(cur)) {
            return new Response(JSON.stringify({ error: 'username_locked' }), { status: 409 });
        }
        // Ensure unique username
        const exists = await db.prepare('SELECT 1 FROM users WHERE username = ?').bind(handle).all();
        if ((exists.results ?? []).length) {
            return new Response(JSON.stringify({ error: 'username_taken' }), { status: 409 });
        }
        await db.prepare('UPDATE users SET username = ? WHERE email = ?').bind(handle, payload.email).run();
        return new Response(JSON.stringify({ ok: true, username: handle }), { status: 200, headers: { 'content-type': 'application/json' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'server_error' }), { status: 500 });
    }
}


