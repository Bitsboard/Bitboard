import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmails = process.env.ADMIN_EMAILS;
    
    return NextResponse.json({
      adminPassword: adminPassword ? 'SET' : 'NOT SET',
      adminPasswordLength: adminPassword?.length || 0,
      adminEmails: adminEmails || 'NOT SET',
      nodeEnv: process.env.NODE_ENV,
      hasAdminPassword: !!adminPassword
    });
  } catch (error) {
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}