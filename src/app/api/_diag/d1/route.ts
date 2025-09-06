export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET() {
  try {
    const { DB } = getRequestContext().env as { DB: any };
    const row = await DB.prepare('SELECT 1 AS ok').first();
    return NextResponse.json({ d1Ok: row?.ok === 1, row });
  } catch (e: any) {
    return NextResponse.json({ d1Error: String(e) }, { status: 500 });
  }
}
