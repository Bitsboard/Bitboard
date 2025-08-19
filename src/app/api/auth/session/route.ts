export const runtime = 'edge';

import { getAuthSecret, verifyJwtHS256 } from '@/lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const token = /(?:^|; )session=([^;]+)/.exec(cookieHeader)?.[1];
  if (!token) return new Response(JSON.stringify({ session: null }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    const payload = await verifyJwtHS256(token, getAuthSecret());
    if (!payload) return new Response(JSON.stringify({ session: null }), { status: 200, headers: { 'content-type': 'application/json' } });

    // Enrich from D1 users and associated listings
    let userRow: any = null;
    let listings: any[] = [];
    try {
      const { env } = getRequestContext();
      const db = (env as any).DB as D1Database | undefined;
      if (db) {
        await db.prepare(`CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          username TEXT UNIQUE,
          sso TEXT,
          verified INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          image TEXT
        )`).run();
        const res = await db.prepare('SELECT id, email, username, sso, verified, created_at AS createdAt, image FROM users WHERE email = ?').bind(payload.email ?? '').all();
        userRow = res.results?.[0] ?? null;
        try {
          const lres = await db.prepare('SELECT id, title, price_sat AS priceSat, created_at AS createdAt FROM listings WHERE posted_by = ? ORDER BY created_at DESC LIMIT 20').bind(userRow?.id ?? '').all();
          listings = lres.results ?? [];
        } catch { }
      }
    } catch { }

    const session = {
      user: {
        name: userRow?.username ?? payload.name,
        email: payload.email,
        image: userRow?.image ?? payload.picture,
      },
      account: userRow ? {
        sso: userRow.sso,
        email: userRow.email,
        username: userRow.username,
        verified: Boolean(userRow.verified),
        registeredAt: userRow.createdAt,
        profilePhoto: userRow.image,
        listings,
      } : null,
    };

    return new Response(JSON.stringify({ session }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ session: null }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
}


