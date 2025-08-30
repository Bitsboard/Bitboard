export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getD1 } from '@/lib/cf';

export async function POST(req: Request) {
  try {
    const body = await req.json() as { userIds: string[] };
    const { userIds } = body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid user IDs provided' 
      }, { status: 400 });
    }

    const db = await getD1();
    if (!db) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed' 
      }, { status: 500 });
    }

    // Verify users by setting verified = 1
    const placeholders = userIds.map(() => '?').join(',');
    const verifyQuery = `
      UPDATE users 
      SET verified = 1
      WHERE id IN (${placeholders})
    `;

    const result = await db.prepare(verifyQuery).bind(...userIds).run();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Successfully verified ${userIds.length} users`,
        verifiedCount: (result as any).changes || 0
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to verify users' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in bulk verify:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
