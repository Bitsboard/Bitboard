export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json() as { password: string };
    
    if (!password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Password required' 
      }, { status: 400 });
    }

    // Get admin password from environment
    let adminPassword = 'admin123'; // default fallback
    
    try {
      const env = getRequestContext().env;
      adminPassword = (env.ADMIN_PASSWORD as string) || 'admin123';
    } catch (error) {
      console.log('Using default admin password for local development');
    }
    
    if (password !== adminPassword) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password' 
      }, { status: 401 });
    }

    // Return success with a simple token
    const token = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return NextResponse.json({ 
      success: true,
      token: token,
      message: 'Admin authentication successful'
    });

  } catch (error) {
    console.error('Error in admin authentication:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Authentication failed' 
    }, { status: 500 });
  }
}
