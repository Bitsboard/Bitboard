export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getD1 } from '@/lib/cf';

export async function POST(req: Request) {
  try {
    const { userIds, reason = 'Banned by admin' } = await req.json();
    
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

    // Ban users by setting banned = 1 and adding ban reason
    const placeholders = userIds.map(() => '?').join(',');
    const banQuery = `
      UPDATE users 
      SET banned = 1, 
          ban_reason = ?, 
          ban_expires_at = NULL
      WHERE id IN (${placeholders})
    `;

    const result = await db.prepare(banQuery).bind(reason, ...userIds).run();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Successfully banned ${userIds.length} users`,
        bannedCount: result.changes || 0
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to ban users' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in bulk ban:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
