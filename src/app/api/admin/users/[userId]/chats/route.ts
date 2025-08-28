export const runtime = 'edge';

import { getAdminDb } from '../../../_util';

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const db = await getAdminDb(req);
    const { userId } = params;

    // Get all chats for this user (as buyer or seller) with listing details
    const chatsQuery = `
      SELECT 
        c.id,
        c.listing_id AS listingId,
        l.title AS listingTitle,
        CASE 
          WHEN c.buyer_id = ? THEN c.seller_id
          ELSE c.buyer_id
        END AS other_user_id,
        other.username AS otherUsername,
        c.created_at AS createdAt,
        c.last_message_at AS lastMessageAt,
        COALESCE(message_stats.message_count, 0) AS messageCount,
        COALESCE(message_stats.unread_count, 0) AS unreadCount
      FROM chats c
      LEFT JOIN listings l ON c.listing_id = l.id
      LEFT JOIN users other ON (
        CASE 
          WHEN c.buyer_id = ? THEN c.seller_id
          ELSE c.buyer_id
        END = other.id
      )
      LEFT JOIN (
        SELECT 
          chat_id,
          COUNT(*) AS message_count,
          COUNT(CASE WHEN read_at IS NULL THEN 1 END) AS unread_count
        FROM messages
        GROUP BY chat_id
      ) message_stats ON c.id = message_stats.chat_id
      WHERE c.buyer_id = ? OR c.seller_id = ?
      ORDER BY c.last_message_at DESC
    `;

    const chats = await db.prepare(chatsQuery).bind(userId, userId, userId, userId).all();

    return new Response(JSON.stringify({ 
      success: true,
      chats: chats.results ?? []
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
