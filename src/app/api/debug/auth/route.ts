export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    console.log('🔔 Debug auth - ADMIN_EMAILS env var:', process.env.ADMIN_EMAILS);
    console.log('🔔 Debug auth - ADMIN_PASSWORD env var:', process.env.ADMIN_PASSWORD);
    console.log('🔔 Debug auth - NODE_ENV env var:', process.env.NODE_ENV);
    console.log('🔔 Debug auth - All env vars:', Object.keys(process.env).filter(key => key.includes('ADMIN')));
    console.log('🔔 Debug auth - adminEmails array:', adminEmails);
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Parse cookies manually
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });
    
    return NextResponse.json({
      session: session ? {
        exists: true,
        user: session.user ? {
          id: session.user.id,
          email: session.user.email,
          username: session.user.username
        } : null
      } : null,
      adminEmails: adminEmails,
      isAdmin: session?.user?.email ? adminEmails.includes(session.user.email) : false,
      cookieHeader: cookieHeader,
      parsedCookies: cookies,
      hasSessionCookie: !!cookies.session,
      userAgent: request.headers.get('user-agent')
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
