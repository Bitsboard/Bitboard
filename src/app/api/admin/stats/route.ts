export const runtime = 'edge';

import { getAdminDb } from '../_util';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const filter = url.searchParams.get('filter') || 'all';
    
    const db = await getAdminDb(req);
    
    // Get basic stats
    const usersCount = await db.prepare('SELECT COUNT(*) as count FROM users').first();
    const listingsCount = await db.prepare('SELECT COUNT(*) as count FROM listings').first();
    const chatsCount = await db.prepare('SELECT COUNT(*) as count FROM chats').first();
    
    // Get recent activity from multiple sources
    const userActivity = await db.prepare(`
      SELECT 
        'user' as type,
        u.username,
        u.id as user_id,
        u.email,
        'joined' as action,
        u.created_at as timestamp,
        NULL as listing_title,
        NULL as listing_id,
        NULL as other_username,
        NULL as other_user_id,
        NULL as chat_id,
        NULL as message_count,
        NULL as offer_amount,
        NULL as offer_expires_at,
        NULL as offer_status
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 10
    `).all();

    const listingActivity = await db.prepare(`
      SELECT 
        'listing' as type,
        u.username,
        u.id as user_id,
        u.email,
        'created' as action,
        l.created_at as timestamp,
        l.title as listing_title,
        l.id as listing_id,
        NULL as other_username,
        NULL as other_user_id,
        NULL as chat_id,
        NULL as message_count,
        NULL as offer_amount,
        NULL as offer_expires_at,
        NULL as offer_status
      FROM listings l
      JOIN users u ON l.posted_by = u.id
      ORDER BY l.created_at DESC
      LIMIT 10
    `).all();

    const chatActivity = await db.prepare(`
      SELECT 
        'chat' as type,
        u1.username,
        u1.id as user_id,
        u1.email,
        'started' as action,
        c.created_at as timestamp,
        l.title as listing_title,
        l.id as listing_id,
        u2.username as other_username,
        u2.id as other_user_id,
        c.id as chat_id,
        NULL as message_count,
        NULL as offer_amount,
        NULL as offer_expires_at,
        NULL as offer_status
      FROM chats c
      JOIN users u1 ON c.buyer_id = u1.id
      JOIN users u2 ON c.seller_id = u2.id
      LEFT JOIN listings l ON c.listing_id = l.id
      ORDER BY c.created_at DESC
      LIMIT 10
    `).all();

    const offerActivity = await db.prepare(`
      SELECT 
        'offer' as type,
        u1.username,
        u1.id as user_id,
        u1.email,
        'sent' as action,
        o.created_at as timestamp,
        l.title as listing_title,
        l.id as listing_id,
        u2.username as other_username,
        u2.id as other_user_id,
        o.chat_id as chat_id,
        NULL as message_count,
        o.amount_sat as offer_amount,
        o.expires_at as offer_expires_at,
        o.status as offer_status
      FROM offers o
      JOIN users u1 ON o.from_user_id = u1.id
      JOIN users u2 ON o.to_user_id = u2.id
      LEFT JOIN listings l ON o.listing_id = l.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all();

    // Combine all activities and sort by timestamp
    const allActivities = [
      ...(userActivity.results || []),
      ...(listingActivity.results || []),
      ...(chatActivity.results || []),
      ...(offerActivity.results || [])
    ].sort((a, b) => (b.timestamp as number) - (a.timestamp as number)).slice(0, 20);

    const recentActivity = { results: allActivities };
    
    const stats = {
      users: {
        total: usersCount?.count || 0,
        verified: 0,
        admin: 0,
        banned: 0,
        new7d: 0,
        new30d: 0
      },
      listings: {
        total: listingsCount?.count || 0,
        active: listingsCount?.count || 0,
        sold: 0,
        new7d: 0,
        new30d: 0,
        avgPriceSats: 0,
        totalValueActive: 0
      },
      conversations: {
        total: chatsCount?.count || 0,
        messages: 0,
        unread: 0,
        new7d: 0,
        new30d: 0
      },
      recentActivity: recentActivity.results || []
    };
    
    return new Response(JSON.stringify({ 
      success: true,
      data: stats
    }), { 
      status: 200, 
      headers: { 'content-type': 'application/json' } 
    });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const code = msg === 'unauthorized' ? 401 : msg === 'forbidden' ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), { status: code });
  }
}
