import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userEmail = url.searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail required' }, { status: 401 });
    }

    const db = await getD1();
    if (!db) return NextResponse.json({ chats: [], error: 'no_db_binding' }, { status: 500 });
    
    await ensureChatSchema(db);
    
    // First, find the user by email to get their UUID
    const userResult = await db.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(userEmail).all();
    
    if (!userResult.results || userResult.results.length === 0) {
      console.log('No user found for email:', userEmail);
      return NextResponse.json({ chats: [], userEmail, totalChats: 0 });
    }
    
    const userId = userResult.results[0].id;
    console.log('Found user ID:', userId, 'for email:', userEmail);
    
    // Get all chats where the user is either buyer or seller using their UUID
    const chatsQuery = `
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
        l.category as listing_category,
        CASE 
          WHEN c.buyer_id = ? THEN 'buyer'
          ELSE 'seller'
        END as user_role,
        CASE 
          WHEN c.buyer_id = ? THEN c.seller_id
          ELSE c.buyer_id
        END as other_user_id
      FROM chats c
      JOIN listings l ON c.listing_id = l.id
      WHERE c.buyer_id = ? OR c.seller_id = ?
      ORDER BY c.last_message_at DESC, c.created_at DESC
    `;
    
    const chats = await db.prepare(chatsQuery).bind(
      userId, 
      userId, 
      userId, 
      userId
    ).all();
    
    console.log('Found chats:', chats.results?.length || 0, 'for user ID:', userId);
    
    // For each chat, get the latest message and unread count
    const chatsWithMessages = await Promise.all(
      (chats.results || []).map(async (chat: any) => {
        // Get latest message
        const latestMessage = await db.prepare(`
          SELECT id, from_id, text, created_at, read_at
          FROM messages 
          WHERE chat_id = ? 
          ORDER BY created_at DESC 
          LIMIT 1
        `).bind(chat.id).all();
        
        // Get unread count
        const unreadCount = await db.prepare(`
          SELECT COUNT(*) as count
          FROM messages 
          WHERE chat_id = ? AND from_id != ? AND (read_at IS NULL OR read_at = 0)
        `).bind(chat.id, userId).all();
        
        return {
          ...chat,
          latestMessage: latestMessage.results?.[0] || null,
          unreadCount: unreadCount.results?.[0]?.count || 0
        };
      })
    );
    
    return NextResponse.json({ 
      chats: chatsWithMessages,
      userEmail,
      userId,
      totalChats: chatsWithMessages.length
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
