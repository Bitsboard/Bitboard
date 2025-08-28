export const runtime = 'edge';

import { getAdminDb } from '../../../_util';

export async function GET(
  req: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    const db = await getAdminDb(req);
    const { listingId } = params;

    // Get all chats for this listing with user details and message counts
    const chatsQuery = `
      SELECT 
        c.id,
        c.buyer_id,
        c.seller_id,
        buyer.username AS buyerUsername,
        seller.username AS sellerUsername,
        c.created_at AS createdAt,
        c.last_message_at AS lastMessageAt,
        COALESCE(message_stats.message_count, 0) AS messageCount,
        COALESCE(message_stats.unread_count, 0) AS unreadCount
      FROM chats c
      LEFT JOIN users buyer ON c.buyer_id = buyer.id
      LEFT JOIN users seller ON c.seller_id = seller.id
      LEFT JOIN (
        SELECT 
          chat_id,
          COUNT(*) AS message_count,
          COUNT(CASE WHEN read_at IS NULL THEN 1 END) AS unread_count
        FROM messages
        GROUP BY chat_id
      ) message_stats ON c.id = message_stats.chat_id
      WHERE c.listing_id = ?
      ORDER BY c.last_message_at DESC
    `;

    const chats = await db.prepare(chatsQuery).bind(listingId).all();

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
