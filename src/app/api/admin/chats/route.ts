import '../../../../shims/async_hooks';
import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';
import { getSessionFromRequest, isAdmin } from '@/lib/auth';

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminCheck = await isAdmin(session.user.email);
    if (!adminCheck) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '100', 10) || 100);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);

    const db = await getD1();
    if (!db) return NextResponse.json({ error: 'no_db_binding' }, { status: 500 });
    
    await ensureChatSchema(db);
    
    console.log('🔍 Admin Chats API: Database connection established, fetching chats...');
    console.log('🔍 Admin Chats API: Limit:', limit, 'Offset:', offset);
    
    // Get all chats with listing and user details
    const chats = await db.prepare(`
      SELECT 
        c.id,
        c.listing_id,
        c.buyer_id,
        c.seller_id,
        c.created_at,
        c.last_message_at,
        l.title as listing_title,
        l.price_sat as listing_price,
        l.image_url as listing_image,
        l.created_at as listing_created_at,
        buyer.username as buyer_username,
        seller.username as seller_username
      FROM chats c
      JOIN listings l ON c.listing_id = l.id
      LEFT JOIN users buyer ON c.buyer_id = buyer.id
      LEFT JOIN users seller ON c.seller_id = seller.id
      ORDER BY c.last_message_at DESC, c.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    console.log('🔍 Admin Chats API: Raw chats query result:', {
      chatCount: chats.results?.length || 0,
      chats: chats.results?.slice(0, 3) // Show first 3 chats for debugging
    });
    
    // For each chat, get message count and latest message
    const chatsWithDetails = await Promise.all(
      (chats.results || []).map(async (chat: any) => {
        const messageCount = await db.prepare(`
          SELECT COUNT(*) as count
          FROM messages 
          WHERE chat_id = ?
        `).bind(chat.id).all();
        
        const latestMessage = await db.prepare(`
          SELECT id, from_id, text, created_at
          FROM messages 
          WHERE chat_id = ? 
          ORDER BY created_at DESC 
          LIMIT 1
        `).bind(chat.id).all();
        
        return {
          ...chat,
          messageCount: messageCount.results?.[0]?.count || 0,
          latestMessage: latestMessage.results?.[0] || null
        };
      })
    );
    
    // Get total count for pagination
    const totalCount = await db.prepare(`
      SELECT COUNT(*) as count
      FROM chats c
      JOIN listings l ON c.listing_id = l.id
    `).all();
    
    const total = totalCount.results?.[0]?.count || 0;
    
    console.log('🔍 Admin Chats API: Returning', chatsWithDetails.length, 'chats out of', total, 'total');
    
    return NextResponse.json({ 
      chats: chatsWithDetails,
      total,
      page: Math.floor(offset / limit) + 1,
      limit
    });
  } catch (error) {
    console.error('Error fetching admin chats:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
