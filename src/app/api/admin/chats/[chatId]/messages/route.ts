import '../../../../../../shims/async_hooks';
import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;
    if (!chatId) {
      return NextResponse.json({ error: 'chatId required' }, { status: 400 });
    }

    const db = await getD1();
    if (!db) return NextResponse.json({ error: 'no_db_binding' }, { status: 500 });
    
    await ensureChatSchema(db);
    
    // Get all messages for this chat (admin can see all chats)
    const messages = await db.prepare(`
      SELECT 
        id, 
        chat_id, 
        from_id, 
        text, 
        created_at, 
        read_at
      FROM messages 
      WHERE chat_id = ? 
      ORDER BY created_at ASC
    `).bind(chatId).all();
    
    return NextResponse.json({ 
      success: true, 
      messages: messages.results || [] 
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
