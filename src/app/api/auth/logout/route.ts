export const runtime = 'edge';

import { deleteCookie } from '@/lib/auth';

export async function POST() {
  const headers = new Headers();
  headers.append('Set-Cookie', deleteCookie('session'));
  return new Response(null, { status: 204, headers });
}


