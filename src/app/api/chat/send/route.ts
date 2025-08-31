import '../../../shims/async_hooks';
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, text, listingId, otherUserId, userEmail } = await req.json() as {
      chatId?: string;
      text?: string;
      listingId?: string;
      otherUserId?: string;
      userEmail?: string;
    };
    
    if (!text || !listingId || !otherUserId || !userEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Validate listing exists
    const listingCheck = await db
      .prepare("SELECT id, title FROM listings WHERE id = ?")
      .bind(listingId)
      .first();

    if (!listingCheck) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Validate other user exists
    const otherUserCheck = await db
      .prepare("SELECT id FROM users WHERE username = ?")
      .bind(otherUserId)
      .first();

    if (!otherUserCheck) {
      // Check if user exists in listings table
      const listingUserCheck = await db
        .prepare("SELECT posted_by FROM listings WHERE id = ?")
        .bind(listingId)
        .first();

      if (listingUserCheck && listingUserCheck.posted_by !== otherUserId) {
        return NextResponse.json({ error: "Other user not found" }, { status: 404 });
      }
    }

    // Get actual user IDs for foreign key constraints
    const currentUserResult = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(userEmail)
      .first();

    if (!currentUserResult) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 });
    }

    const currentUserId = currentUserResult.id;

    const otherUserResult = await db
      .prepare("SELECT id FROM users WHERE username = ?")
      .bind(otherUserId)
      .first();

    if (!otherUserResult) {
      return NextResponse.json({ error: "Other user not found" }, { status: 404 });
    }

    const otherUserActualId = otherUserResult.id;

    // Find or create chat
    let actualChatId = chatId;
    
    if (!actualChatId) {
      // Create new chat
      actualChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        const chatInsertResult = await db
          .prepare(`
            INSERT INTO chats (id, listing_id, user1_id, user2_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, strftime('%s','now'), strftime('%s','now'))
          `)
          .bind(actualChatId, listingId, currentUserId, otherUserActualId)
          .run();
      } catch (insertError) {
        console.error('❌ Error creating chat:', insertError);
        return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
      }
    }

    // Insert message
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await db
        .prepare(`
          INSERT INTO messages (id, chat_id, sender_id, content, created_at)
          VALUES (?, ?, ?, ?, strftime('%s','now'))
        `)
        .bind(messageId, actualChatId, currentUserId, text)
        .run();
    } catch (messageError) {
      console.error('❌ Error inserting message:', messageError);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    // Update chat timestamp
    try {
      await db
        .prepare("UPDATE chats SET updated_at = strftime('%s','now') WHERE id = ?")
        .bind(actualChatId)
        .run();
    } catch (updateError) {
      console.error('❌ Error updating chat timestamp:', updateError);
      // Don't fail the request for this
    }

    return NextResponse.json({ 
      success: true,
      messageId,
      chatId: actualChatId
    });

  } catch (error) {
    console.error('=== CHAT SEND API ERROR ===');
    console.error('Error in chat send API:', error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
