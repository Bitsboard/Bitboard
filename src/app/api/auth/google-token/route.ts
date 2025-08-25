export const runtime = 'edge';

import { createCookie, getAuthSecret, signJwtHS256, uuidv4 } from '@/lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(req: Request) {
  try {
    const { credential } = await req.json();
    
    if (!credential) {
      return new Response('Missing credential', { status: 400 });
    }

    // Verify the Google ID token
    const tokenInfo = await verifyGoogleToken(credential);
    
    if (!tokenInfo) {
      return new Response('Invalid token', { status: 400 });
    }

    // Upsert user in D1 users table
    let userId: string;
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
        
        const existing = await db.prepare('SELECT id, username FROM users WHERE email = ?').bind(tokenInfo.email).all();
        userId = existing.results?.[0]?.id as string;
        
        if (!userId) {
          userId = uuidv4();
          // Don't generate a default username - user must choose one
          await db.prepare('INSERT INTO users (id, email, username, sso, verified, created_at, image, has_chosen_username) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(userId, tokenInfo.email, null, 'google', 1, Math.floor(Date.now() / 1000), tokenInfo.picture ?? null, 0)
            .run();
        } else {
          await db.prepare('UPDATE users SET image = COALESCE(?, image), sso = ? WHERE id = ?')
            .bind(tokenInfo.picture ?? null, 'google', userId)
            .run();
        }
      } else {
        throw new Error('Database not available');
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      return new Response('Database error', { status: 500 });
    }

    // Create JWT session
    const secret = getAuthSecret();
    const expiresSec = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
    const jwt = await signJwtHS256({
      sub: String(tokenInfo.sub || tokenInfo.email),
      name: tokenInfo.name,
      email: tokenInfo.email,
      picture: tokenInfo.picture,
      sso: 'google',
      exp: expiresSec,
    }, secret);

    // Return user data and set session cookie
    const headers = new Headers();
    headers.append('Set-Cookie', createCookie('session', jwt, { 
      httpOnly: true, 
      maxAgeSec: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: true
    }));

    return new Response(JSON.stringify({
      user: {
        id: userId,
        email: tokenInfo.email,
        name: tokenInfo.name,
        picture: tokenInfo.picture,
        sso: 'google',
        hasChosenUsername: false, // Will be updated when user chooses username
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(headers.entries())
      }
    });

  } catch (error) {
    console.error('Google token verification error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function verifyGoogleToken(idToken: string) {
  try {
    // For production, you should verify the token server-side
    // For now, we'll decode the JWT to get user info
    // In production, verify with Google's public keys
    
    const payload = decodeJwtPayload(idToken);
    
    if (!payload || !payload.email) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}
