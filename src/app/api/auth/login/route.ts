export const runtime = 'edge';

import { randomUrlSafeString, sha256Base64Url } from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirect = url.searchParams.get('redirect') || '/profile';

  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const callbackUrl = new URL('/api/auth/callback', url.origin).toString();
  const state = randomUrlSafeString(16);
  const codeVerifier = randomUrlSafeString(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', `${state}|${encodeURIComponent(redirect)}`);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  const headers = new Headers();
  headers.append('Set-Cookie', `oauth_state=${state}; Path=/; SameSite=Lax; Secure; HttpOnly; Max-Age=600`);
  headers.append('Set-Cookie', `oauth_verifier=${codeVerifier}; Path=/; SameSite=Lax; Secure; HttpOnly; Max-Age=600`);
  return new Response(null, { status: 302, headers: new Headers({ ...headers, Location: authUrl.toString() }) as any });
}


