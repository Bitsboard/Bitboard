import '../../../../shims/async_hooks';
import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';
import { getSessionFromRequest } from '@/lib/auth';

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { chatId, text, listingId, otherUserId } = await req.json() as { 
      chatId?: string; 
      text?: string; 
      listingId?: string;
      otherUserId?: string;
    };
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const db = await getD1();
    if (!db) return NextResponse.json({ error: 'no_db_binding' }, { status: 500 });
    
    await ensureChatSchema(db);
    
    let actualChatId = chatId;
    
    // If no chatId provided, create a new chat
    if (!actualChatId) {
      if (!listingId || !otherUserId) {
        return NextResponse.json({ error: "listingId and otherUserId required for new chat" }, { status: 400 });
      }
      
      // Check if chat already exists
      const existingChat = await db.prepare(`
        SELECT id FROM chats 
        WHERE listing_id = ? AND 
        ((buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?))
      `).bind(listingId, session.user.email, otherUserId, otherUserId, session.user.email).all();
      
      if (existingChat.results && existingChat.results.length > 0) {
        actualChatId = existingChat.results[0].id as string;
      } else {
        // Create new chat
        const chatResult = await db.prepare(`
          INSERT INTO chats (listing_id, buyer_id, seller_id, created_at, last_message_at) 
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          listingId, 
          session.user.email, 
          otherUserId, 
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000)
        ).run();
        
        actualChatId = chatResult.meta?.last_row_id?.toString() || 
                      await db.prepare('SELECT last_insert_rowid() AS id').all().then(r => (r.results?.[0]?.id as string));
      }
    }
    
    if (!actualChatId) {
      return NextResponse.json({ error: "failed to create or find chat" }, { status: 500 });
    }
    
    // Insert the message
    const messageResult = await db.prepare(`
      INSERT INTO messages (chat_id, from_id, text, created_at) 
      VALUES (?, ?, ?, ?)
    `).bind(
      actualChatId, 
      session.user.email, 
      text.trim(), 
      Math.floor(Date.now() / 1000)
    ).run();
    
    const messageId = messageResult.meta?.last_row_id?.toString() || 
                     await db.prepare('SELECT last_insert_rowid() AS id').all().then(r => (r.results?.[0]?.id as string));
    
    // Update chat's last_message_at
    await db.prepare(`
      UPDATE chats 
      SET last_message_at = ? 
      WHERE id = ?
    `).bind(Math.floor(Date.now() / 1000), actualChatId).run();
    
    return NextResponse.json({ 
      ok: true, 
      messageId, 
      chatId: actualChatId 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
