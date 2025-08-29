export const runtime = 'edge';

import { getAdminDb } from '../../_util';

export async function GET(req: Request) {
  try {
    console.log('🔍 Admin Listings API: Request started');
    
    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
    
    console.log('🔍 Admin Listings API: Parsed URL parameters - limit:', limit, 'offset:', offset);
    
    console.log('🔍 Admin Listings API: About to call getAdminDb...');
    const db = await getAdminDb(req);
    console.log('🔍 Admin Listings API: getAdminDb successful, database connection established');
    
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
    
    const listingsQuery = `
      SELECT 
        l.id,
        l.title,
        l.description,
        l.price_sat AS priceSat,
        l.ad_type AS adType,
        l.category,
        l.posted_by AS postedBy,
        u.username AS postedByUsername,
        l.created_at AS createdAt,
        l.updated_at AS updatedAt,
        l.status,
        l.image_url AS imageUrl,
        l.location,
        COALESCE(l.views, 0) AS views,
        COALESCE(l.favorites, 0) AS favorites,
        COALESCE(chat_stats.chats_count, 0) AS chatsCount,
        COALESCE(chat_stats.messages_count, 0) AS messagesCount,
        COALESCE(chat_stats.last_activity, 0) AS lastActivityAt
      FROM listings l
      LEFT JOIN users u ON l.posted_by = u.id
      LEFT JOIN (
        SELECT 
          listing_id,
          COUNT(DISTINCT c.id) AS chats_count,
          COUNT(m.id) AS messages_count,
          MAX(m.created_at) AS last_activity
        FROM chats c
        LEFT JOIN messages m ON c.id = m.chat_id
        GROUP BY listing_id
      ) chat_stats ON l.id = chat_stats.listing_id
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
    
    return new Response(JSON.stringify({ 
      success: true,
      listings: res.results ?? [], 
      total,
      page: Math.floor(offset / limit) + 1,
      limit
    }), { 
      status: 200, 
      headers: { 'content-type': 'application/json' } 
    });
  } catch (e: any) {
    console.error('🔍 Admin Listings API: Error occurred:', e);
    console.error('🔍 Admin Listings API: Error message:', e?.message);
    console.error('🔍 Admin Listings API: Error stack:', e?.stack);
    
    const msg = e?.message || 'error';
    const code = msg === 'unauthorized' ? 401 : msg === 'forbidden' ? 403 : 500;
    
    return new Response(JSON.stringify({ 
      error: msg,
      details: e?.message,
      stack: e?.stack
    }), { status: code });
  }
}


