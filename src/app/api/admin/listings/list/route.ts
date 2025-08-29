export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    console.log('🔍 Admin Listings API: Request started');
    
    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
    
    console.log('🔍 Admin Listings API: Parsed URL parameters - limit:', limit, 'offset:', offset);
    
    // Try to get database connection using different methods
    let db: D1Database | null = null;
    
    try {
      // Method 1: Try @cloudflare/next-on-pages
      const mod = await import('@cloudflare/next-on-pages').catch(() => null);
      if (mod && typeof mod.getRequestContext === 'function') {
        const context = mod.getRequestContext();
        if (context?.env?.DB) {
          console.log('✅ Database found via @cloudflare/next-on-pages');
          db = context.env.DB as D1Database;
        }
      }
    } catch (error) {
      console.log('⚠️ @cloudflare/next-on-pages method failed:', error);
    }
    
    if (!db) {
      try {
        // Method 2: Try globalThis.__env__
        if (typeof globalThis !== 'undefined' && (globalThis as any).__env__?.DB) {
          console.log('✅ Database found via globalThis.__env__');
          db = (globalThis as any).__env__.DB as D1Database;
        }
      } catch (error) {
        console.log('⚠️ globalThis.__env__ method failed:', error);
      }
    }
    
    if (!db) {
      console.error('❌ No database binding found via any method');
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: 'No D1 database binding found'
      }, { status: 500 });
    }
    
    console.log('✅ Database connection established successfully');
    
    // Test basic database connectivity
    console.log('🔍 Admin Listings API: Testing database connectivity...');
    try {
      const testResult = await db.prepare('SELECT 1 as test').all();
      console.log('🔍 Admin Listings API: Database connectivity test successful:', testResult);
    } catch (testError) {
      console.error('🔍 Admin Listings API: Database connectivity test failed:', testError);
      return NextResponse.json({ 
        error: 'Database connectivity test failed',
        details: testError?.message || 'Unknown error'
      }, { status: 500 });
    }
    
    // Check if listings table exists and has data
    console.log('🔍 Admin Listings API: Checking listings table...');
    try {
      const tableCheck = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='listings'").all();
      console.log('🔍 Admin Listings API: Listings table check:', tableCheck);
      
      if (tableCheck.results && tableCheck.results.length > 0) {
        const countCheck = await db.prepare('SELECT COUNT(*) as count FROM listings').all();
        console.log('🔍 Admin Listings API: Listings count check:', countCheck);
      } else {
        console.log('🔍 Admin Listings API: Listings table does not exist!');
        return NextResponse.json({ 
          error: 'Listings table not found',
          details: 'The listings table does not exist in the database'
        }, { status: 500 });
      }
    } catch (tableError) {
      console.error('🔍 Admin Listings API: Table check failed:', tableError);
      return NextResponse.json({ 
        error: 'Table check failed',
        details: tableError?.message || 'Unknown error'
      }, { status: 500 });
    }
    
    const q = (url.searchParams.get('q') || '').trim();
    
    console.log('🔍 Admin Listings API: Request received with limit:', limit, 'offset:', offset, 'query:', q);
    
    let where = '';
    let binds: any[] = [];
    if (q) {
      where = 'WHERE l.title LIKE ? OR l.description LIKE ? OR u.username LIKE ?';
      binds.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    
    console.log('🔍 Admin Listings API: Where clause:', where);
    console.log('🔍 Admin Listings API: Binds:', binds);
    
    // Simplified query to avoid complex JOINs that might be causing issues
    const listingsQuery = `
      SELECT 
        l.id,
        l.title,
        l.description,
        l.price_sat AS priceSat,
        l.ad_type AS adType,
        l.category,
        l.posted_by AS postedBy,
        l.created_at AS createdAt,
        l.updated_at AS updatedAt,
        l.status,
        l.image_url AS imageUrl,
        l.location,
        COALESCE(l.views, 0) AS views,
        COALESCE(l.favorites, 0) AS favorites
      FROM listings l
      ${where}
      ORDER BY l.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    console.log('🔍 Admin Listings API: Query:', listingsQuery);
    console.log('🔍 Admin Listings API: About to execute query with binds:', [...binds, limit, offset]);
    
    const res = await db.prepare(listingsQuery).bind(...binds, limit, offset).all();
    console.log('🔍 Admin Listings API: Query result:', {
      success: res.success,
      resultsCount: res.results?.length || 0,
      firstResult: res.results?.[0] || null
    });
    
    const count = await db.prepare(`SELECT COUNT(*) AS c FROM listings l ${where}`).bind(...binds).all();
    const total = count.results?.[0]?.c ?? 0;
    
    console.log('🔍 Admin Listings API: Total count:', total);
    
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
    console.error('🔍 Admin Listings API: Error stack:', e?.stack);
    
    return NextResponse.json({ 
      error: e?.message || 'Unknown error',
      details: e?.message,
      stack: e?.stack
    }, { status: 500 });
  }
}


