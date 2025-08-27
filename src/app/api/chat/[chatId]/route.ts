import '../../../../../shims/async_hooks';
import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';
import { getSessionFromRequest } from '@/lib/auth';

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { chatId } = params;
    if (!chatId) {
      return NextResponse.json({ error: 'chat_id_required' }, { status: 400 });
    }

    const db = await getD1();
    if (!db) return NextResponse.json({ error: 'no_db_binding' }, { status: 500 });
    
    await ensureChatSchema(db);
    
    // Verify user has access to this chat
    const chatAccess = await db.prepare(`
      SELECT id, listing_id, buyer_id, seller_id
      FROM chats 
      WHERE id = ? AND (buyer_id = ? OR seller_id = ?)
    `).bind(chatId, session.user.email, session.user.email).all();
    
    if (!chatAccess.results || chatAccess.results.length === 0) {
      return NextResponse.json({ error: 'chat_not_found' }, { status: 404 });
    }
    
    // Get all messages for this chat
    const messages = await db.prepare(`
      SELECT 
        id, 
        from_id, 
        text, 
        created_at,
        read_at
      FROM messages 
      WHERE chat_id = ? 
      ORDER BY created_at ASC
    `).bind(chatId).all();
    
    // Mark messages from other user as read
    await db.prepare(`
      UPDATE messages 
      SET read_at = ? 
      WHERE chat_id = ? AND from_id != ? AND (read_at IS NULL OR read_at = 0)
    `).bind(Math.floor(Date.now() / 1000), chatId, session.user.email).run();
    
    return NextResponse.json({ 
      messages: messages.results || [],
      chat: chatAccess.results[0]
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
