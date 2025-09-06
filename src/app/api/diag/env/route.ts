export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

function mask(v: unknown) {
  const s = String(v ?? '');
  if (!s) return '';
  if (s.length <= 4) return '****';
  return s.slice(0, 2) + '***' + s.slice(-2);
}

export async function GET() {
  try {
    const env = getRequestContext().env as Record<string, unknown>;
    const keys = Object.keys(env ?? {});
    const snapshot = Object.fromEntries(
      keys.map(k => [k, mask(env[k])])
    );
    return NextResponse.json({
      hasEnv: !!env,
      keys,
      snapshot,
      hasWebCrypto: typeof crypto?.subtle?.digest === 'function',
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
