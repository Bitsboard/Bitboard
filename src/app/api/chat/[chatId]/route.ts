import '../../../../shims/async_hooks';
import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const url = new URL(req.url);
    const userEmail = url.searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail required' }, { status: 401 });
    }

    const { chatId } = params;
    if (!chatId) {
      return NextResponse.json({ error: 'chatId required' }, { status: 400 });
    }

    const db = await getD1();
    if (!db) return NextResponse.json({ error: 'no_db_binding' }, { status: 500 });
    
    await ensureChatSchema(db);
    
    // First get the user's UUID from their email
    const userResult = await db.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(userEmail).all();
    
    if (!userResult.results || userResult.results.length === 0) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }
    
    const userId = userResult.results[0].id;
    console.log('🔍 Chat API: User ID:', userId, 'for email:', userEmail);
    
    // Verify user has access to this chat using UUID
    const chatAccess = await db.prepare(`
      SELECT id FROM chats 
      WHERE id = ? AND (buyer_id = ? OR seller_id = ?)
    `).bind(chatId, userId, userId).all();
    
    if (!chatAccess.results || chatAccess.results.length === 0) {
      console.log('🔍 Chat API: Access denied for chat:', chatId, 'user:', userId);
      return NextResponse.json({ error: 'chat not found or access denied' }, { status: 404 });
    }
    
    console.log('🔍 Chat API: Access granted for chat:', chatId, 'user:', userId);
    
    // Get messages for this chat
    const messages = await db.prepare(`
      SELECT id, chat_id, from_id, text, created_at, read_at
      FROM messages 
      WHERE chat_id = ? 
      ORDER BY created_at ASC
    `).bind(chatId).all();
    
    // Mark messages as read if they're from the other user
    await db.prepare(`
      UPDATE messages 
      SET read_at = ? 
      WHERE chat_id = ? AND from_id != ? AND (read_at IS NULL OR read_at = 0)
    `).bind(Math.floor(Date.now() / 1000), chatId, userEmail).run();
    
    return NextResponse.json({ 
      success: true, 
      messages: messages.results || [] 
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
