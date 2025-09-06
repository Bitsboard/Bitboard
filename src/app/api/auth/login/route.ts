export const runtime = 'edge';

import { randomUrlSafeString, sha256Base64Url } from '@/lib/auth';
import { authRateLimiter } from '@/lib/security/rateLimiter';

export async function GET(req: Request) {
  // Apply rate limiting
  const rateLimit = await authRateLimiter(req);
  if (!rateLimit.allowed) {
    return new Response('Rate limit exceeded', { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  }

  const url = new URL(req.url);
  const redirect = url.searchParams.get('redirect') || '/profile';
  const isPopup = url.searchParams.get('popup') === 'true';

  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const callbackUrl = new URL('/api/debug/oauth', url.origin).toString();
  const state = randomUrlSafeString(16);
  const codeVerifier = randomUrlSafeString(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);

  // If this is a popup, we'll redirect to auth-success page after OAuth
  const finalRedirect = isPopup ? '/auth-success' : redirect;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', `${state}|${encodeURIComponent(finalRedirect)}`);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  const headers = new Headers();
  headers.append('Set-Cookie', `oauth_state=${state}; Path=/; SameSite=Lax; Secure; HttpOnly; Max-Age=600`);
  headers.append('Set-Cookie', `oauth_verifier=${codeVerifier}; Path=/; SameSite=Lax; Secure; HttpOnly; Max-Age=600`);
  headers.set('Location', authUrl.toString());
  return new Response(null, { status: 302, headers });
}


