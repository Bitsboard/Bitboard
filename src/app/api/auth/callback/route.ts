export const runtime = 'edge';

import { createCookie, deleteCookie, getAuthSecret, signJwtHS256, uuidv4 } from '@/lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state') || '';
  const [state, redirectRaw] = stateParam.split('|');
  const redirect = decodeURIComponent(redirectRaw || '/profile');
  const cookieHeader = req.headers.get('cookie') || '';
  const getCookie = (name: string) => new RegExp(`(?:^|; )${name}=([^;]+)`).exec(cookieHeader)?.[1];
  const oauthState = getCookie('oauth_state');
  const verifier = getCookie('oauth_verifier');
  if (!code || !state || !oauthState || state !== oauthState || !verifier) {
    return new Response('Invalid state', { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: new URL('/api/auth/callback', url.origin).toString(),
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    return new Response(`Token exchange failed: ${txt}`, { status: 400 });
  }
  const tokenJson = await tokenRes.json() as any;
  const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!userRes.ok) return new Response('Failed to fetch user', { status: 400 });
  const user = await userRes.json() as any;

  // Upsert user in D1 users table
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
        has_chosen_username INTEGER DEFAULT 0 CHECK (has_chosen_username IN (0, 1))
      )`).run();
      const existing = await db.prepare('SELECT id, username FROM users WHERE email = ?').bind(user.email).all();
      let userId = existing.results?.[0]?.id as string | undefined;
      if (!userId) {
        userId = uuidv4();
        // Don't generate a default username - user must choose one
        await db.prepare('INSERT INTO users (id, email, username, sso, verified, created_at, image, has_chosen_username) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(userId, user.email, null, 'google', 1, Math.floor(Date.now() / 1000), user.picture ?? null, 0)
          .run();
      } else {
        await db.prepare('UPDATE users SET image = COALESCE(?, image), sso = ? WHERE id = ?')
          .bind(user.picture ?? null, 'google', userId)
          .run();
      }
      // Optional: ensure listings table has posted_by column; association left as future enhancement
    }
  } catch { }

  const secret = getAuthSecret();
  const expiresSec = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const jwt = await signJwtHS256({
    sub: String(user.sub || user.email),
    name: user.name,
    email: user.email,
    picture: user.picture,
    sso: 'google',
    exp: expiresSec,
  }, secret);

  const headers = new Headers();
  headers.append('Set-Cookie', createCookie('session', jwt, { httpOnly: true, maxAgeSec: 60 * 60 * 24 * 7 }));
  headers.append('Set-Cookie', deleteCookie('oauth_state'));
  headers.append('Set-Cookie', deleteCookie('oauth_verifier'));
  headers.append('Location', redirect);
  return new Response(null, { status: 302, headers });
}


