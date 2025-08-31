export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    console.log('🔍 Admin Listings API: Request started');
    console.log('🔍 Admin Listings API: Request URL:', req.url);
    console.log('🔍 Admin Listings API: Request method:', req.method);
    
    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10));
    const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') ?? 'desc';
    const searchQuery = url.searchParams.get('q') || '';
    const searchById = url.searchParams.get('id') || '';
    
    console.log('🔍 Admin Listings API: Parsed URL parameters - limit:', limit, 'offset:', offset, 'sortBy:', sortBy, 'sortOrder:', sortOrder, 'searchQuery:', searchQuery, 'searchById:', searchById);
    console.log('🔍 Admin Listings API: Raw limit param:', url.searchParams.get('limit'));
    console.log('🔍 Admin Listings API: Raw offset param:', url.searchParams.get('offset'));
    console.log('🔍 Admin Listings API: Raw sortBy param:', url.searchParams.get('sortBy'));
    console.log('🔍 Admin Listings API: Raw sortOrder param:', url.searchParams.get('sortOrder'));
    
    // Get database connection using the same method as main listings API
    console.log('🔍 Admin Listings API: Attempting to get database binding...');
    
    const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
    if (!mod || typeof mod.getRequestContext !== "function") {
      console.log('🔍 Admin Listings API: Cloudflare adapter missing');
      return NextResponse.json({ 
        success: false,
        error: 'Cloudflare adapter not available'
      }, { status: 500 });
    }

    const env = mod.getRequestContext().env as { DB?: D1Database };
    const db = env.DB;
    
    if (!db) {
      console.log('🔍 Admin Listings API: No database binding');
      return NextResponse.json({ 
        success: false,
        error: 'Database connection not available'
      }, { status: 500 });
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
      
      return NextResponse.json({ 
        success: false,
        error: 'Database connection test failed'
      }, { status: 500 });
    }

    // Check if listings table exists
    console.log('🔍 Admin Listings API: Checking if listings table exists...');
    try {
      const tableCheck = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='listings'").all();
      console.log('🔍 Admin Listings API: Table check result:', tableCheck);
      
      if (!tableCheck.results || tableCheck.results.length === 0) {
        console.log('🔍 Admin Listings API: Listings table does not exist');
        return NextResponse.json({ 
          success: false,
          error: 'Listings table not found'
        }, { status: 500 });
      }
    } catch (tableError: any) {
      console.error('🔍 Admin Listings API: Table check failed:', tableError);
      console.error('🔍 Admin Listings API: Table check error message:', tableError?.message);
      
      return NextResponse.json({ 
        success: false,
        error: 'Database table check failed'
      }, { status: 500 });
    }
    
    // Now use the correct query based on actual database schema
    console.log('🔍 Admin Listings API: Executing corrected query...');
    
    // Map frontend column names to database column names
    const sortColumnMap: { [key: string]: string } = {
      'createdAt': 'l.created_at',
      'priceSat': 'l.price_sat',
      'views': 'views',
      'replies': 'COALESCE(chat_counts.chat_count, 0)'
    };
    
    const sortColumn = sortColumnMap[sortBy] || 'l.created_at';
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    // Build WHERE clause for search
    let whereClause = '';
    let bindParams: any[] = [];
    
    if (searchById) {
      whereClause = 'WHERE l.id = ?';
      bindParams.push(searchById);
    } else if (searchQuery) {
      whereClause = 'WHERE l.title LIKE ? OR l.description LIKE ?';
      bindParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }
    
    const listingsQuery = `
      SELECT 
        l.id,
        l.title,
        l.description,
        l.price_sat AS priceSat,
        COALESCE(l.pricing_type, 'fixed') AS pricingType,
        l.ad_type AS adType,
        l.category,
        l.posted_by AS postedBy,
        COALESCE(u.username, l.posted_by) AS username,
        l.created_at AS createdAt,
        l.updated_at AS updatedAt,
        l.status,
        l.image_url AS imageUrl,
        l.location,
        COALESCE(l.views, 0) AS views,
        0 AS favorites,
        COALESCE(chat_counts.chat_count, 0) AS replies
      FROM listings l
      LEFT JOIN users u ON l.posted_by = u.id
      LEFT JOIN (
        SELECT 
          listing_id,
          COUNT(*) AS chat_count
        FROM chats
        GROUP BY listing_id
      ) chat_counts ON l.id = chat_counts.listing_id
      ${whereClause}
      ORDER BY ${sortColumn} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    console.log('🔍 Admin Listings API: Executing query with limit:', limit, 'offset:', offset);
    console.log('🔍 Admin Listings API: Query:', listingsQuery);
    console.log('🔍 Admin Listings API: Bind params:', bindParams);
    
    try {
      const res = await db.prepare(listingsQuery).bind(...bindParams, limit, offset).all();
      console.log('🔍 Admin Listings API: Query result count:', res.results?.length || 0);
      console.log('🔍 Admin Listings API: Query success:', res.success);
      console.log('🔍 Admin Listings API: First result sample:', res.results?.[0] || 'No results');
      
      // Get total count with same search conditions
      let countQuery = 'SELECT COUNT(*) AS total FROM listings l';
      if (searchById) {
        countQuery += ' WHERE l.id = ?';
      } else if (searchQuery) {
        countQuery += ' WHERE l.title LIKE ? OR l.description LIKE ?';
      }
      
      const countResult = await db.prepare(countQuery).bind(...bindParams).all();
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
      
      return NextResponse.json({ 
        success: false,
        error: 'Database query failed'
      }, { status: 500 });
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


