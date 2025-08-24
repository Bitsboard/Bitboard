export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST() {
  // Simple test endpoint - no database operations
  return NextResponse.json({ 
    success: true, 
    message: 'Test endpoint working - account wipe simulation successful' 
  });
}
