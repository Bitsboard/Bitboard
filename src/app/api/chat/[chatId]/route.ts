import '@/shims/async_hooks';
import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const url = new URL(req.url);
    const userEmail = url.searchParams.get('userEmail');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50'); // Default 50 messages per page
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail required' }, { status: 401 });
    }

    const { chatId } = params;
    if (!chatId) {
      return NextResponse.json({ error: 'chatId required' }, { status: 400 });
    }

    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }
    
    // First get the user's UUID from their email
    const userResult = await db.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(userEmail).all();
    
    if (!userResult.results || userResult.results.length === 0) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }
    
    const userId = userResult.results[0].id;

    
    // Verify user has access to this chat using UUID
    const chatAccess = await db.prepare(`
      SELECT id FROM chats 
      WHERE id = ? AND (buyer_id = ? OR seller_id = ?)
    `).bind(chatId, userId, userId).all();
    
    if (!chatAccess.results || chatAccess.results.length === 0) {

      return NextResponse.json({ error: 'chat not found or access denied' }, { status: 404 });
    }
    

    
    // ✅ IMPLEMENTED: Message pagination for performance
    const offset = (page - 1) * limit;
    
    // Get total message count for pagination
    const totalCountResult = await db.prepare(`
      SELECT COUNT(*) as total FROM messages WHERE chat_id = ?
    `).bind(chatId).all();
    
    const totalMessages = Number(totalCountResult.results?.[0]?.total) || 0;
    const totalPages = Math.ceil(totalMessages / limit);
    
    // Get paginated messages for this chat
    const messages = await db.prepare(`
      SELECT id, chat_id, from_id, text, created_at, read_at
      FROM messages 
      WHERE chat_id = ? 
      ORDER BY created_at ASC  -- ✅ FIXED: ASC order for chronological display (oldest first, newest at bottom)
      LIMIT ? OFFSET ?
    `).bind(chatId, limit, offset).all();

    // Transform messages to include is_from_current_user field
    const transformedMessages = (messages.results || []).map((message: any) => ({
      ...message,
      is_from_current_user: message.from_id === userId
    }));
    
    // ✅ OPTIMIZED: Only mark messages as read if they're from the other user AND we're on the first page
    // This prevents unnecessary updates when loading older messages
    if (page === 1) {
      await db.prepare(`
        UPDATE messages 
        SET read_at = ? 
        WHERE chat_id = ? AND from_id != ? AND (read_at IS NULL OR read_at = 0)
      `).bind(Math.floor(Date.now() / 1000), chatId, userId).run();
    }
    
    return NextResponse.json({ 
      success: true, 
      messages: transformedMessages,
      userId: userId,
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
