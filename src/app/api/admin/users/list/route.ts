export const runtime = 'edge';

import { getAdminDb } from '../../_util';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
    const db = await getAdminDb(req);
    const q = (url.searchParams.get('q') || '').trim();
    
    let where = '';
    let binds: any[] = [];
    if (q) {
      where = 'WHERE u.email LIKE ? OR u.username LIKE ?';
      binds.push(`%${q}%`, `%${q}%`);
    }
    
    const usersQuery = `
      SELECT 
        u.id,
        u.email,
        u.username,
        u.verified AS isVerified,
        u.is_admin AS isAdmin,
        u.banned AS isBanned,
        u.ban_reason AS banReason,
        u.ban_expires_at AS banExpiresAt,
        u.created_at AS createdAt,
        u.last_login_at AS lastLoginAt,
        COALESCE(listing_stats.listings_count, 0) AS listingsCount,
        COALESCE(chat_stats.chats_count, 0) AS chatsCount,
        COALESCE(message_stats.messages_count, 0) AS messagesCount,
        COALESCE(u.rating, 0) AS rating,
        COALESCE(u.deals, 0) AS deals,
        COALESCE(listing_stats.total_value, 0) AS totalListingsValue,
        COALESCE(activity_stats.last_activity, 0) AS lastActivityAt
      FROM users u
      LEFT JOIN (
        SELECT 
          posted_by,
          COUNT(*) AS listings_count,
          SUM(price_sat) AS total_value
        FROM listings
        GROUP BY posted_by
      ) listing_stats ON u.id = listing_stats.posted_by
      LEFT JOIN (
        SELECT 
          buyer_id AS user_id,
          COUNT(*) AS chats_count
        FROM chats
        GROUP BY buyer_id
        UNION ALL
        SELECT 
          seller_id AS user_id,
          COUNT(*) AS chats_count
        FROM chats
        GROUP BY seller_id
      ) chat_stats ON u.id = chat_stats.user_id
      LEFT JOIN (
        SELECT 
          from_id,
          COUNT(*) AS messages_count
        FROM messages
        GROUP BY from_id
      ) message_stats ON u.id = message_stats.from_id
      LEFT JOIN (
        SELECT 
          user_id,
          MAX(timestamp) AS last_activity
        FROM (
          SELECT posted_by AS user_id, created_at AS timestamp FROM listings
          UNION ALL
          SELECT from_id AS user_id, created_at AS timestamp FROM messages
        )
        GROUP BY user_id
      ) activity_stats ON u.id = activity_stats.user_id
      ${where}
      ORDER BY u.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const res = await db.prepare(usersQuery).bind(...binds, limit, offset).all();
    const count = await db.prepare(`SELECT COUNT(*) AS c FROM users u ${where}`).bind(...binds).all();
    const total = count.results?.[0]?.c ?? 0;
    
    return new Response(JSON.stringify({ 
      success: true,
      users: res.results ?? [], 
      total,
      page: Math.floor(offset / limit) + 1,
      limit
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


