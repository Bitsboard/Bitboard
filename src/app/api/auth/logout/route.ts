export const runtime = 'edge';

import { deleteCookie } from '@/lib/auth';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const headers = new Headers();
  headers.append('Set-Cookie', deleteCookie('session'));
  headers.set('Location', `${url.origin}/`);
  return new Response(null, { status: 302, headers });
}


