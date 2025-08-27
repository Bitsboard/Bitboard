import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    console.log('Chat list API called');
    
    const url = new URL(req.url);
    const userEmail = url.searchParams.get('userEmail');
    
    console.log('User email from query:', userEmail);
    
    if (!userEmail) {
      console.log('No userEmail provided');
      return NextResponse.json({ error: 'userEmail required' }, { status: 401 });
    }

    console.log('Getting D1 database...');
    const db = await getD1();
    if (!db) {
      console.log('No database binding found');
      return NextResponse.json({ chats: [], error: 'no_db_binding' }, { status: 500 });
    }
    
    console.log('Ensuring chat schema...');
    await ensureChatSchema(db);
    console.log('Chat schema ensured');
    
    // Get all chats where the user is either buyer or seller
    console.log('Executing chats query...');
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
      userEmail, 
      userEmail, 
      userEmail, 
      userEmail
    ).all();
    
    console.log('Chats query result:', chats);
    
    // For each chat, get the latest message
    console.log('Processing chats with messages...');
    const chatsWithMessages = await Promise.all(
      (chats.results || []).map(async (chat: any) => {
        console.log('Processing chat:', chat.id);
        
        const latestMessage = await db.prepare(`
          SELECT id, from_id, text, created_at, read_at
          FROM messages 
          WHERE chat_id = ? 
          ORDER BY created_at DESC 
          LIMIT 1
        `).bind(chat.id).all();
        
        const unreadCount = await db.prepare(`
          SELECT COUNT(*) as count
          FROM messages 
          WHERE chat_id = ? AND from_id != ? AND (read_at IS NULL OR read_at = 0)
        `).bind(chat.id, userEmail).all();
        
        return {
          ...chat,
          latestMessage: latestMessage.results?.[0] || null,
          unreadCount: unreadCount.results?.[0]?.count || 0
        };
      })
    );
    
    console.log('Returning chats with messages:', chatsWithMessages);
    return NextResponse.json({ chats: chatsWithMessages });
  } catch (error) {
    console.error('Error fetching chats:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
