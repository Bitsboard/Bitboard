export const runtime = 'edge';

import { createCookie, deleteCookie, getAuthSecret, signJwtHS256, generateUserId } from '@/lib/auth';
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
        has_chosen_username INTEGER DEFAULT 0 CHECK (has_chosen_username IN (0, 1)),
        thumbs_up INTEGER DEFAULT 0,
        deals INTEGER DEFAULT 0,
        last_active INTEGER DEFAULT 0,
        is_admin INTEGER DEFAULT 0,
        banned INTEGER DEFAULT 0
      )`).run();
      
      // Check if we need to migrate from an old schema with NOT NULL username
      try {
        const tableInfo = await db.prepare("PRAGMA table_info(users)").all();
        const usernameColumn = tableInfo.results?.find((col: any) => col.name === 'username');
        
        if (usernameColumn && usernameColumn.notnull === 1) {

          
          // Drop any existing migration tables first
          try {
            await db.prepare('DROP TABLE IF EXISTS users_new').run();
          } catch (cleanupError) {
          }
          
          // Create new table with correct schema
          await db.prepare(`CREATE TABLE users_new (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            username TEXT UNIQUE,
            sso TEXT,
            verified INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            image TEXT,
            has_chosen_username INTEGER DEFAULT 0 CHECK (has_chosen_username IN (0, 1)),
            thumbs_up INTEGER DEFAULT 0,
            deals INTEGER DEFAULT 0,
            last_active INTEGER DEFAULT 0,
            is_admin INTEGER DEFAULT 0,
            banned INTEGER DEFAULT 0
          )`).run();
          
          
          // Copy data from old table
          await db.prepare('INSERT INTO users_new (id, email, username, sso, verified, created_at, image, has_chosen_username, thumbs_up, deals, last_active, is_admin, banned) SELECT id, email, username, sso, verified, created_at, image, has_chosen_username, 0, 0, 0, 0, 0 FROM users').run();
          
          // Drop old table and rename new one
          await db.prepare('DROP TABLE users').run();
          await db.prepare('ALTER TABLE users_new RENAME TO users').run();
          
          
          // Verify the migration worked
          const newTableInfo = await db.prepare("PRAGMA table_info(users)").all();
          const newUsernameColumn = newTableInfo.results?.find((col: any) => col.name === 'username');
        } else {
        }
      } catch (migrationError) {
      }
      
      
      const existing = await db.prepare('SELECT id, username FROM users WHERE email = ?').bind(user.email).all();
      let userId = existing.results?.[0]?.id as string | undefined;
      
      if (!userId) {
        userId = generateUserId();
        
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Don't generate a default username - user must choose one
        // New users start as unverified and have proper last_active timestamp
        await db.prepare(`
          INSERT INTO users (id, email, username, sso, verified, created_at, image, has_chosen_username, thumbs_up, deals, last_active, is_admin, banned)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(userId, user.email, null, 'google', 0, currentTime, user.picture ?? null, 0, 0, 0, currentTime, 0, 0).run();
          
      } else {
        
        const currentTime = Math.floor(Date.now() / 1000);
        
        await db.prepare('UPDATE users SET image = COALESCE(?, image), sso = ?, last_active = ? WHERE id = ?')
          .bind(user.picture ?? null, 'google', currentTime, userId)
          .run();
          
      }
      // Optional: ensure listings table has posted_by column; association left as future enhancement
    } else {
      console.error('🔐 OAuth callback: No database connection found!');
    }
  } catch (error) {
    console.error('🔐 OAuth callback: Error during user creation/update:', error);
    console.error('🔐 OAuth callback: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userEmail: user.email,
      userData: user
    });
  }

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


