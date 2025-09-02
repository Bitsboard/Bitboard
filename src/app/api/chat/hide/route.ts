import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Get session from request
    const session = await getSessionFromRequest(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user ID from database
    const userResult = await db.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(session.user.email).all();

    if (!userResult.results || userResult.results.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUserId = userResult.results[0].id;

    // Parse request body
    const { chatId, action } = await req.json() as { chatId?: string; action?: string };

    if (!chatId || !action) {
      return NextResponse.json({ error: "Missing chatId or action" }, { status: 400 });
    }

    if (action === 'hide') {
      // Hide the conversation for this user
      const hideId = `hide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        await db.prepare(`
          INSERT INTO hidden_conversations (id, user_id, chat_id, hidden_at)
          VALUES (?, ?, ?, strftime('%s','now'))
        `).bind(hideId, currentUserId, chatId).run();

        return NextResponse.json({ success: true, message: "Conversation hidden" });
      } catch (error: any) {
        // If conversation is already hidden, that's fine
        if (error.message?.includes('UNIQUE constraint failed')) {
          return NextResponse.json({ success: true, message: "Conversation already hidden" });
        }
        throw error;
      }
    } else if (action === 'unhide') {
      // Unhide the conversation for this user
      const result = await db.prepare(`
        DELETE FROM hidden_conversations 
        WHERE user_id = ? AND chat_id = ?
      `).bind(currentUserId, chatId).run();

      return NextResponse.json({ 
        success: true, 
        message: "Conversation unhidden",
        deleted: result.meta.changes > 0
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error('Hide conversation API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
