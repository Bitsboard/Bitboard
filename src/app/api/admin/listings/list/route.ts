export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getD1 } from '@/lib/cf';

export async function GET(req: Request) {
  try {
    console.log('🔍 Admin Listings API: Request started');
    console.log('🔍 Admin Listings API: Request URL:', req.url);
    console.log('🔍 Admin Listings API: Request method:', req.method);
    
    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10));
    
    console.log('🔍 Admin Listings API: Parsed URL parameters - limit:', limit, 'offset:', offset);
    console.log('🔍 Admin Listings API: Raw limit param:', url.searchParams.get('limit'));
    console.log('🔍 Admin Listings API: Raw offset param:', url.searchParams.get('offset'));
    
    // Get database connection
    console.log('🔍 Admin Listings API: Attempting to get database binding...');
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
    console.log('🔍 Admin Listings API: Database object type:', typeof db);
    console.log('🔍 Admin Listings API: Database object keys:', Object.keys(db));
    
    // Test basic database functionality
    console.log('🔍 Admin Listings API: Testing basic database functionality...');
    try {
      const testResult = await db.prepare('SELECT 1 as test').all();
      console.log('🔍 Admin Listings API: Basic test query successful:', testResult);
    } catch (testError: any) {
      console.error('🔍 Admin Listings API: Basic test query failed:', testError);
      console.error('🔍 Admin Listings API: Test error message:', testError?.message);
      console.error('🔍 Admin Listings API: Test error stack:', testError?.stack);
      
      // Return mock data if basic test fails
      console.log('🔍 Admin Listings API: Basic test failed - returning mock data');
      return NextResponse.json({ 
        success: true,
        listings: [
          {
            id: 'mock-1',
            title: 'Mock Listing 1 (Test Failed)',
            description: 'Basic database test failed - using mock data',
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
          }
        ], 
        total: 1,
        page: 1,
        limit
      });
    }
    
    // Check if listings table exists
    console.log('🔍 Admin Listings API: Checking if listings table exists...');
    try {
      const tableCheck = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='listings'").all();
      console.log('🔍 Admin Listings API: Table check result:', tableCheck);
      
      if (!tableCheck.results || tableCheck.results.length === 0) {
        console.log('🔍 Admin Listings API: Listings table does not exist - returning mock data');
        return NextResponse.json({ 
          success: true,
          listings: [
            {
              id: 'mock-1',
              title: 'Mock Listing 1 (No Table)',
              description: 'Listings table does not exist - using mock data',
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
            }
          ], 
          total: 1,
          page: 1,
          limit
        });
      }
    } catch (tableError: any) {
      console.error('🔍 Admin Listings API: Table check failed:', tableError);
      console.error('🔍 Admin Listings API: Table check error message:', tableError?.message);
      
      // Continue anyway - table might exist but check failed
    }
    
    // Now use the correct query based on actual database schema
    console.log('🔍 Admin Listings API: Executing corrected query...');
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
        0 AS views,
        0 AS favorites,
        0 AS replies
      FROM listings
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    console.log('🔍 Admin Listings API: Executing query with limit:', limit, 'offset:', offset);
    console.log('🔍 Admin Listings API: Query:', listingsQuery);
    
    try {
      const res = await db.prepare(listingsQuery).bind(limit, offset).all();
      console.log('🔍 Admin Listings API: Query result count:', res.results?.length || 0);
      console.log('🔍 Admin Listings API: Query success:', res.success);
      console.log('🔍 Admin Listings API: First result sample:', res.results?.[0] || 'No results');
      
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
      
    } catch (queryError: any) {
      console.error('🔍 Admin Listings API: Query execution failed:', queryError);
      console.error('🔍 Admin Listings API: Query error message:', queryError?.message);
      console.error('🔍 Admin Listings API: Query error stack:', queryError?.stack);
      
      // Return mock data if query fails
      console.log('🔍 Admin Listings API: Query failed - returning mock data');
      return NextResponse.json({ 
        success: true,
        listings: [
          {
            id: 'mock-1',
            title: 'Mock Listing 1 (Query Failed)',
            description: 'Database query failed - using mock data',
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
          }
        ], 
        total: 1,
        page: 1,
        limit
      });
    }
    
  } catch (e: any) {
    console.error('🔍 Admin Listings API: Top-level error occurred:', e);
    console.error('🔍 Admin Listings API: Error message:', e?.message);
    console.error('🔍 Admin Listings API: Error stack:', e?.stack);
    console.error('🔍 Admin Listings API: Error type:', e?.constructor?.name);
    
    return NextResponse.json({ 
      error: 'Failed to load listings',
      details: e?.message || String(e) || 'Unknown error',
      errorType: e?.constructor?.name || 'Unknown'
    }, { status: 500 });
  }
}


