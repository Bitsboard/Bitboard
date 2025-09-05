export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const adminEmails = process.env.ADMIN_EMAILS || '';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    return NextResponse.json({
      session: session ? {
        user: session.user,
        hasSession: true
      } : null,
      adminEmails: adminEmails.split(',').map(email => email.trim()),
      adminPassword: adminPassword ? 'SET' : 'NOT_SET',
      userIsAdmin: session ? await isAdmin(session.user.email) : false,
      userEmail: session?.user.email || 'NO_SESSION'
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
