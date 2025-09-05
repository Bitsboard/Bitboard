import { NextResponse } from "next/server";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmails = process.env.ADMIN_EMAILS;
    
    // Check session
    const session = await getSessionFromRequest(req);
    let adminStatus = false;
    let userEmail = null;
    
    if (session) {
      userEmail = session.user.email;
      adminStatus = await isAdmin(session.user.email);
    }
    
    return NextResponse.json({
      adminPassword: adminPassword ? 'SET' : 'NOT SET',
      adminPasswordLength: adminPassword?.length || 0,
      adminEmails: adminEmails || 'NOT SET',
      nodeEnv: process.env.NODE_ENV,
      hasAdminPassword: !!adminPassword,
      session: {
        exists: !!session,
        userEmail: userEmail,
        isAdmin: adminStatus
      },
      adminEmailsList: adminEmails ? adminEmails.split(',').map(e => e.trim()) : []
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}