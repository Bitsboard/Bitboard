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
    
    // Schema is pre-created via migrations - no need to check on every request
    // await ensureChatSchema(db); // ❌ REMOVED: Expensive schema check on every request
    
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
    
    // MIGRATION: Fix existing chat IDs that use the old string format
    try {
      console.log('🔧 Checking for old format chat IDs to migrate...');
      
      // Find chats with old format IDs (starting with 'chat_')
      const oldChats = await db.prepare(`
        SELECT id FROM chats WHERE id LIKE 'chat_%'
      `).all();
      
      if (oldChats.results && oldChats.results.length > 0) {
        console.log('🔧 Found', oldChats.results.length, 'chats with old format IDs, migrating...');
        
        for (const oldChat of oldChats.results) {
          const oldId = oldChat.id;
          
          // Generate new UUID for this chat
          const newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
          
          console.log('🔧 Migrating chat ID:', oldId, '→', newId);
          
          // Update the chat ID
          await db.prepare('UPDATE chats SET id = ? WHERE id = ?').bind(newId, oldId).run();
          
          // Update all messages that reference this chat
          await db.prepare('UPDATE messages SET chat_id = ? WHERE chat_id = ?').bind(newId, oldId).run();
          
          console.log('🔧 Successfully migrated chat and messages');
        }
        
        console.log('🔧 Chat ID migration completed');
      } else {
        console.log('🔧 No old format chat IDs found, migration not needed');
      }
    } catch (migrationError) {
      console.log('🔧 Chat ID migration failed:', migrationError);
      // Continue with the request even if migration fails
    }
    
        // Get all chats with basic info first, then we'll fetch messages separately
    const basicChatsQuery = `
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
        l.ad_type as listing_type,
        l.created_at as listing_created_at,
        buyer.username as buyer_username,
        seller.username as seller_username,
        seller.verified as seller_verified,
        CASE 
          WHEN c.buyer_id = ? THEN 'buyer'
          ELSE 'seller'
        END as user_role,
        CASE 
          WHEN c.buyer_id = ? THEN seller.username
          ELSE buyer.username
        END as other_user_username
      FROM chats c
      JOIN listings l ON c.listing_id = l.id
      LEFT JOIN users buyer ON c.buyer_id = buyer.id
      LEFT JOIN users seller ON c.seller_id = seller.id
      WHERE c.buyer_id = ? OR c.seller_id = ?
      ORDER BY c.last_message_at DESC, c.created_at DESC
    `;
    
    console.log('🔍 Chat API: About to execute query with userId:', userId);
    console.log('🔍 Chat API: Query:', basicChatsQuery);
    
    let chats;
    try {
      chats = await db.prepare(basicChatsQuery).bind(
        userId, 
        userId, 
        userId, 
        userId
      ).all();
      
      console.log('🔍 Chat API: Query executed successfully');
      console.log('🔍 Chat API: Raw results:', chats);
      console.log('🔍 Chat API: Found chats:', chats.results?.length || 0, 'for user ID:', userId);
    } catch (dbError) {
      const error = dbError as Error;
      console.error('🔍 Chat API: Database query failed:', dbError);
      throw new Error(`Database query failed: ${error.message}`);
    }
    
    // Now fetch latest messages and unread counts for each chat
    const chatsWithMessages = await Promise.all((chats.results || []).map(async (chat: any) => {
      // Get latest message for this chat
      const latestMessageResult = await db.prepare(`
        SELECT text, created_at, from_id 
        FROM messages 
        WHERE chat_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `).bind(chat.id).all();
      
      const latestMessage = latestMessageResult.results?.[0];
      
      // Get unread count for this chat
      const unreadResult = await db.prepare(`
        SELECT COUNT(*) as count 
        FROM messages 
        WHERE chat_id = ? AND from_id != ? AND (read_at IS NULL OR read_at = 0)
      `).bind(chat.id, userId).all();
      
      const unreadCount = unreadResult.results?.[0]?.count || 0;
      
      return {
        ...chat,
        latest_message_text: latestMessage?.text || null,
        latest_message_time: latestMessage?.created_at || null,
        latest_message_from: latestMessage?.from_id || null,
        unread_count: unreadCount
      };
    }));
    
    return NextResponse.json({ 
      chats: chatsWithMessages,
      userEmail,
      userId,
      totalChats: chatsWithMessages.length
    });
  } catch (error) {
    const errorObj = error as Error;
    console.error('🔍 Chat API: Error fetching chats:', error);
    console.error('🔍 Chat API: Error details:', {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name
    });
    return NextResponse.json({ 
      error: 'server_error', 
      details: errorObj.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
