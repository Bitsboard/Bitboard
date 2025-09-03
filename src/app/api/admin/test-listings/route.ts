export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getD1 } from '@/lib/cf';

export async function GET(req: Request) {
  try {
    
    // Get database connection
    const db = await getD1();
    if (!db) {
      return NextResponse.json({ 
        success: false,
        error: 'No database binding'
      });
    }
    
    // Simple query to test
    const result = await db.prepare('SELECT COUNT(*) as count FROM listings').all();
    const total = result.results?.[0]?.count || 0;
    
    // Get first few listings
    const listings = await db.prepare('SELECT * FROM listings LIMIT 5').all();
    
    return NextResponse.json({ 
      success: true,
      total,
      sampleListings: listings.results || [],
      message: 'Database query successful'
    });
    
  } catch (e: any) {
    console.error('🔍 Test Listings API: Error:', e);
    
    return NextResponse.json({ 
      success: false,
      error: e?.message || String(e) || 'Unknown error'
    }, { status: 500 });
  }
}
