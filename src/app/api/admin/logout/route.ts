export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Clear admin session
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
    // Clear any admin-specific cookies
    response.cookies.set('admin_session', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
