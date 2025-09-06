export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getSessionFromRequestEdge } from '@/lib/auth-edge';

export async function POST(request: NextRequest) {
  try {
    // A. Edge context
    let env;
    try {
      env = getRequestContext().env;
    } catch (e) {
      return NextResponse.json({ stage: 'A', error: 'getRequestContext failed', detail: String(e) }, { status: 500 });
    }
    if (!env) return NextResponse.json({ stage: 'A', error: 'env undefined' }, { status: 500 });

    // B. Body parse
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      body = null; // ok for now
    }

    // C. Session (using edge-safe code)
    let session;
    try {
      session = await getSessionFromRequestEdge(request);
    } catch (e) {
      return NextResponse.json({ stage: 'C', error: 'session failed', detail: String(e) }, { status: 500 });
    }
    if (!session?.user?.email) return NextResponse.json({ stage: 'C', error: 'no session' }, { status: 401 });

    // D. Admin emails
    const adminEmails = String(env.ADMIN_EMAILS ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ stage: 'D', error: 'not admin', userEmail: session.user.email, adminEmails }, { status: 403 });
    }

    // E. D1 test
    let d1Test;
    try {
      const { DB } = env as { DB: any };
      const r = await DB.prepare('SELECT 1 as ok').first();
      d1Test = r?.ok === 1;
    } catch (e) {
      return NextResponse.json({ stage: 'E', error: 'D1 failed', detail: String(e) }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      stage: 'Z',
      haveEnv: true,
      adminEmails,
      haveBody: body != null,
      d1Test,
      userEmail: session.user.email,
    });
  } catch (e: any) {
    return NextResponse.json({ stage: 'FATAL', error: String(e), stack: String(e?.stack) }, { status: 500 });
  }
}
