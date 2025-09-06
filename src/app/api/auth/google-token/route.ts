export const runtime = 'edge';

import { createCookie, getAuthSecret, signJwtHS256, generateUserId } from '@/lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Function to send welcome notification to new users
async function sendWelcomeNotification(db: D1Database, userId: string, createdAt: number) {
  // Create welcome system notification
  const notificationId = `welcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.prepare(`
    INSERT INTO system_notifications (id, title, message, icon, target_group, action_url, created_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `).bind(
    notificationId,
    'Welcome to bitsbarter!',
    'Welcome to the Bitcoin trading platform. Check out our safety guidelines to get started.',
    'info',
    'all',
    '/safety',
    createdAt
  ).run();

  // Create user notification record
  const userNotificationId = `un_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  await db.prepare(`
    INSERT INTO user_notifications (id, user_id, notification_id, created_at)
    VALUES (?, ?, ?, ?)
  `).bind(
    userNotificationId,
    userId,
    notificationId,
    createdAt
  ).run();
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { credential: string };
    const { credential } = body;
    
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
          has_chosen_username INTEGER DEFAULT 0 CHECK (has_chosen_username IN (0, 1)),
          thumbs_up INTEGER DEFAULT 0,
          deals INTEGER DEFAULT 0,
          last_active INTEGER DEFAULT 0,
          is_admin INTEGER DEFAULT 0,
          banned INTEGER DEFAULT 0
        )`).run();
        
        const existing = await db.prepare('SELECT id, username FROM users WHERE email = ?').bind(tokenInfo.email).all();
        userId = existing.results?.[0]?.id as string;
        
        if (!userId) {
          userId = generateUserId();
          const currentTime = Math.floor(Date.now() / 1000);
          // Don't generate a default username - user must choose one
          // New users start as unverified and have proper last_active timestamp
          await db.prepare('INSERT INTO users (id, email, username, sso, verified, created_at, image, has_chosen_username, thumbs_up, deals, last_active, is_admin, banned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(userId, tokenInfo.email, null, 'google', 0, currentTime, tokenInfo.picture ?? null, 0, 0, 0, currentTime, 0, 0)
            .run();
          
          // Send welcome notification to new user
          try {
            await sendWelcomeNotification(db, userId, currentTime);
          } catch (welcomeError) {
            console.error('Failed to send welcome notification:', welcomeError);
            // Don't fail the signup if welcome notification fails
          }
        } else {
          const currentTime = Math.floor(Date.now() / 1000);
          await db.prepare('UPDATE users SET image = COALESCE(?, image), sso = ?, last_active = ? WHERE id = ?')
            .bind(tokenInfo.picture ?? null, 'google', currentTime, userId)
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
      maxAgeSec: 60 * 60 * 24 * 7
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
