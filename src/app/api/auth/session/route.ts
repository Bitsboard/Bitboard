export const runtime = 'edge';

import { getAuthSecret, verifyJwtHS256 } from '@/lib/auth';

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const token = /(?:^|; )session=([^;]+)/.exec(cookieHeader)?.[1];
  if (!token) return new Response(JSON.stringify({ session: null }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    const payload = await verifyJwtHS256(token, getAuthSecret());
    if (!payload) return new Response(JSON.stringify({ session: null }), { status: 200, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify({ session: { user: { name: payload.name, email: payload.email, image: payload.picture } } }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ session: null }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
}


