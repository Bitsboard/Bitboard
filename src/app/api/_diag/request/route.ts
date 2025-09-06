export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    return NextResponse.json({
      method: req.method,
      url: req.nextUrl.toString(),
      cookies: req.cookies.getAll().map(c => ({ name: c.name, value: '****' })),
      hasBody: !!body,
      body,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    method: req.method,
    url: req.nextUrl.toString(),
    cookies: req.cookies.getAll().map(c => ({ name: c.name, value: '****' })),
  });
}
