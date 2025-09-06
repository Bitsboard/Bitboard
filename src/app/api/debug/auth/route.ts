export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    return NextResponse.json({
      session: session ? {
        exists: true,
        user: session.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        } : null
      } : null,
      adminEmails: adminEmails,
      isAdmin: session?.user?.email ? adminEmails.includes(session.user.email) : false,
      cookies: request.headers.get('cookie'),
      userAgent: request.headers.get('user-agent')
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
