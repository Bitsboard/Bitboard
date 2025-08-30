export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getD1 } from '@/lib/cf';

export async function POST(req: Request) {
  try {
    const body = await req.json() as { listingIds: string[] };
    const { listingIds } = body;
    
    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid listing IDs provided' 
      }, { status: 400 });
    }

    const db = await getD1();
    if (!db) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed' 
      }, { status: 500 });
    }

    // For now, just mark listings as boosted in the database
    // In a real implementation, this would trigger actual boost logic
    const placeholders = listingIds.map(() => '?').join(',');
    const boostQuery = `
      UPDATE listings 
      SET boosted_at = strftime('%s', 'now'), 
          boost_count = COALESCE(boost_count, 0) + 1
      WHERE id IN (${placeholders})
    `;

    const result = await db.prepare(boostQuery).bind(...listingIds).run();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Successfully boosted ${listingIds.length} listings`,
        boostedCount: (result as any).changes || 0
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to boost listings' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in bulk boost:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
