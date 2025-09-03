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
          image TEXT,
          is_admin INTEGER DEFAULT 0,
          banned INTEGER DEFAULT 0,
          thumbs_up INTEGER DEFAULT 0,
          deals INTEGER DEFAULT 0,
          last_active INTEGER DEFAULT 0,
          has_chosen_username INTEGER DEFAULT 0
        )`).run();
        
        const res = await db.prepare('SELECT id, email, username, sso, verified, created_at AS createdAt, image, has_chosen_username FROM users WHERE email = ?').bind(payload.email ?? '').all();
        userRow = res.results?.[0] ?? null;
        
        if (userRow) {
          try {
            const lres = await db.prepare('SELECT id, title, price_sat AS priceSat, COALESCE(pricing_type, "fixed") AS pricingType, created_at AS createdAt FROM listings WHERE posted_by = ? ORDER BY created_at DESC LIMIT 20').bind(userRow?.id ?? '').all();
            listings = lres.results ?? [];
          } catch (listingError) {
          }
        }
      } else {
      }
    } catch (dbError) {
    }

    const session = {
      user: {
        id: userRow?.id ?? 'unknown',  // Only use database ID, don't fall back to OAuth ID
        email: payload.email ?? null,
        username: userRow?.username ?? null,
        image: userRow?.image ?? payload.picture ?? null,
        hasChosenUsername: Boolean(userRow?.has_chosen_username),
      },
      account: userRow ? {
        username: userRow.username,
        verified: Boolean(userRow.verified),
        registeredAt: userRow.createdAt,
        profilePhoto: userRow.image,
        hasChosenUsername: Boolean(userRow.has_chosen_username),
        listings,
      } : null,
    };

    return NextResponse.json({
      userId: session.user.id,
      email: session.user.email,
      hasAccount: !!session.account
    });
  } catch (error) {
    return new Response(JSON.stringify({ session: null }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
}


