import '@/shims/async_hooks';
import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const db = await getD1();
    if (!db) return NextResponse.json({ error: 'no_db_binding' }, { status: 500 });
    
    await ensureChatSchema(db);
    
    console.log('🔍 Admin Chats API: Database connection established, fetching chats...');
    
    const url = new URL(req.url);
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
    const sortBy = url.searchParams.get('sortBy') || 'lastMessageAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    console.log('🔍 Admin Chats API: Limit:', limit, 'Offset:', offset, 'SortBy:', sortBy, 'SortOrder:', sortOrder);
    
    // Build ORDER BY clause based on sortBy parameter
    let orderBy = 'c.last_message_at DESC, c.created_at DESC'; // default
    switch (sortBy) {
      case 'createdAt':
        orderBy = `c.created_at ${sortOrder.toUpperCase()}`;
        break;
      case 'listingTitle':
        orderBy = `l.title ${sortOrder.toUpperCase()}`;
        break;
      case 'buyerUsername':
        orderBy = `buyer.username ${sortOrder.toUpperCase()}`;
        break;
      case 'sellerUsername':
        orderBy = `seller.username ${sortOrder.toUpperCase()}`;
        break;
      case 'lastMessageAt':
      default:
        orderBy = `c.last_message_at ${sortOrder.toUpperCase()}`;
        break;
    }
    
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
      ORDER BY ${orderBy}
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
