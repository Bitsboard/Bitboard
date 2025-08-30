export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getD1 } from '@/lib/cf';

export async function GET(req: Request) {
  try {
    console.log('🔍 Admin Listings API: Request started');
    
    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10));
    
    console.log('🔍 Admin Listings API: Parsed URL parameters - limit:', limit, 'offset:', offset);
    
    // Get database connection
    const db = await getD1();
    if (!db) {
      console.log('🔍 Admin Listings API: No database binding - returning mock data');
      return NextResponse.json({ 
        success: true,
        listings: [
          {
            id: 'mock-1',
            title: 'Mock Listing 1',
            description: 'This is a mock listing for development',
            priceSat: 100000,
            adType: 'wanted',
            category: 'electronics',
            postedBy: 'mock-user-1',
            username: 'mock-user-1',
            createdAt: Math.floor(Date.now() / 1000) - 86400,
            updatedAt: Math.floor(Date.now() / 1000),
            status: 'active',
            imageUrl: null,
            location: 'Mock City, MC',
            views: 0,
            favorites: 0,
            replies: 0
          },
          {
            id: 'mock-2',
            title: 'Mock Listing 2',
            description: 'Another mock listing for development',
            priceSat: 250000,
            adType: 'offered',
            category: 'books',
            postedBy: 'mock-user-2',
            username: 'mock-user-2',
            createdAt: Math.floor(Date.now() / 1000) - 172800,
            updatedAt: Math.floor(Date.now() / 1000),
            status: 'active',
            imageUrl: null,
            location: 'Mock Town, MT',
            views: 5,
            favorites: 2,
            replies: 1
          }
        ], 
        total: 2,
        page: 1,
        limit
      });
    }
    
    console.log('✅ Database connection established');
    
    // Simple query to get listings
    const listingsQuery = `
      SELECT 
        id,
        title,
        description,
        price_sat AS priceSat,
        ad_type AS adType,
        category,
        posted_by AS postedBy,
        posted_by AS username,
        created_at AS createdAt,
        updated_at AS updatedAt,
        status,
        image_url AS imageUrl,
        location,
        COALESCE(views, 0) AS views,
        COALESCE(favorites, 0) AS favorites,
        0 AS replies
      FROM listings
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    console.log('🔍 Admin Listings API: Executing query with limit:', limit, 'offset:', offset);
    
    const res = await db.prepare(listingsQuery).bind(limit, offset).all();
    console.log('🔍 Admin Listings API: Query result count:', res.results?.length || 0);
    
    // Get total count
    const countResult = await db.prepare('SELECT COUNT(*) AS total FROM listings').all();
    const total = countResult.results?.[0]?.total || 0;
    
    console.log('🔍 Admin Listings API: Total listings in database:', total);
    
    return NextResponse.json({ 
      success: true,
      listings: res.results ?? [], 
      total,
      page: Math.floor(offset / limit) + 1,
      limit
    });
    
  } catch (e: any) {
    console.error('🔍 Admin Listings API: Error occurred:', e);
    console.error('🔍 Admin Listings API: Error message:', e?.message);
    
    return NextResponse.json({ 
      error: 'Failed to load listings',
      details: e?.message || String(e) || 'Unknown error'
    }, { status: 500 });
  }
}


