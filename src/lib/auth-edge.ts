// Edge-compatible JWT utils using WebCrypto
import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { verifyJwtHS256 } from './auth';

export type JwtPayload = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  exp: number;
  uid?: string;
  username?: string | null;
  sso?: string;
  verified?: boolean;
  isAdmin?: boolean;
};

export type Session = {
  user: {
    id: string;
    email: string;
    username?: string | null;
    image?: string | null;
    verified?: boolean;
    isAdmin?: boolean;
  };
  account?: {
    sso: string;
    verified: boolean;
    registeredAt: number;
  };
  expires: number;
};

export async function getSessionFromRequestEdge(req: NextRequest): Promise<Session | null> {
  try {
    const env = getRequestContext().env as any;
    const secret = env.NEXTAUTH_SECRET;
    const token = req.cookies.get('session')?.value ?? '';

    console.log('🔔 getSessionFromRequestEdge - token exists:', !!token);
    console.log('🔔 getSessionFromRequestEdge - secret exists:', !!secret);

    if (!token) {
      console.log('🔔 getSessionFromRequestEdge - No token found');
      return null;
    }

    // Use the same verification method as the original auth.ts
    const payload = await verifyJwtHS256(token, secret);
    console.log('🔔 getSessionFromRequestEdge - payload:', payload ? 'valid' : 'invalid');
    if (!payload) return null;
    
    return {
      user: {
        id: String(payload.sub || ''),
        email: String(payload.email || ''),
        username: payload.username ? String(payload.username) : null,
        image: payload.picture ? String(payload.picture) : null,
        verified: Boolean(payload.verified),
        isAdmin: Boolean(payload.isAdmin),
      },
      account: payload.sso ? {
        sso: String(payload.sso),
        verified: Boolean(payload.verified),
        registeredAt: Number(payload.exp || 0), // Use exp as fallback since registeredAt doesn't exist in JwtPayload
      } : undefined,
      expires: Number(payload.exp || 0),
    };
  } catch (error) {
    console.log('🔔 getSessionFromRequestEdge - JWT verification failed:', error);
    return null;
  }
}

export async function createJwtEdge(payload: JwtPayload): Promise<string> {
  const env = getRequestContext().env as any;
  const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}
