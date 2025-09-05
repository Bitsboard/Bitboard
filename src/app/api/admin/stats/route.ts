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
    
    // Get recent activity (simplified)
    const recentActivity = await db.prepare(`
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
        NULL as chat_id
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 20
    `).all();
    
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
