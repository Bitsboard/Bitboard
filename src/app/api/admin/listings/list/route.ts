export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    
    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10));
    const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') ?? 'desc';
    const searchQuery = url.searchParams.get('q') || '';
    const searchById = url.searchParams.get('id') || '';
    
    
    // Get database connection using the same method as main listings API
    
    const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
    if (!mod || typeof mod.getRequestContext !== "function") {
      return NextResponse.json({ 
        success: false,
        error: 'Cloudflare adapter not available'
      }, { status: 500 });
    }

    const env = mod.getRequestContext().env as { DB?: D1Database };
    const db = env.DB;
    
    if (!db) {
      return NextResponse.json({ 
        success: false,
        error: 'Database connection not available'
      }, { status: 500 });
    }
    
    
    // Test basic database functionality
    try {
      const testResult = await db.prepare('SELECT 1 as test').all();
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
    try {
      const tableCheck = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='listings'").all();
      
      if (!tableCheck.results || tableCheck.results.length === 0) {
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
    
    
    try {
      const res = await db.prepare(listingsQuery).bind(...bindParams, limit, offset).all();
      
      // Get total count with same search conditions
      let countQuery = 'SELECT COUNT(*) AS total FROM listings l';
      if (searchById) {
        countQuery += ' WHERE l.id = ?';
      } else if (searchQuery) {
        countQuery += ' WHERE l.title LIKE ? OR l.description LIKE ?';
      }
      
      const countResult = await db.prepare(countQuery).bind(...bindParams).all();
      const total = countResult.results?.[0]?.total || 0;
      
      
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


