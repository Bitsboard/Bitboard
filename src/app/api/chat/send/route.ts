import '@/shims/async_hooks';
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
      // First, check if a chat already exists between these users for this listing
      const existingChatResult = await db
        .prepare(`
          SELECT id FROM chats 
          WHERE listing_id = ? 
          AND ((buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?))
          LIMIT 1
        `)
        .bind(listingId, currentUserId, otherUserActualId, otherUserActualId, currentUserId)
        .all();
      
      if (existingChatResult.results && existingChatResult.results.length > 0) {
        // Use existing chat
        actualChatId = (existingChatResult.results[0] as any).id;
        console.log('🔄 Using existing chat:', actualChatId);
      } else {
        // Create new chat only if none exists
        actualChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const chatTime = Math.floor(Date.now() / 1000); // Use consistent timestamp
        
        try {
          const chatInsertResult = await db
            .prepare(`
              INSERT INTO chats (id, listing_id, buyer_id, seller_id, created_at, last_message_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `)
            .bind(actualChatId, listingId, currentUserId, otherUserActualId, chatTime, chatTime)
            .run();
          console.log('✅ Created new chat:', actualChatId);
        } catch (insertError) {
          console.error('❌ Error creating chat:', insertError);
          return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
        }
      }
    }

    // Insert message with consistent timestamp
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentTime = Math.floor(Date.now() / 1000); // Use consistent timestamp
    
    try {
      await db
        .prepare(`
          INSERT INTO messages (id, chat_id, from_id, text, created_at)
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(messageId, actualChatId, currentUserId, text, currentTime)
        .run();
    } catch (messageError) {
      console.error('❌ Error inserting message:', messageError);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    // Update chat timestamp and user's last_active
    try {
      await db
        .prepare("UPDATE chats SET last_message_at = ? WHERE id = ?")
        .bind(currentTime, actualChatId)
        .run();
      
      // Update user's last_active time
      await db
        .prepare("UPDATE users SET last_active = ? WHERE id = ?")
        .bind(currentTime, currentUserId)
        .run();
    } catch (updateError) {
      console.error('❌ Error updating chat timestamp or user last_active:', updateError);
      // Don't fail the request for this
    }

    // Unhide conversation for the current user when they send a new message
    try {
      await db
        .prepare("DELETE FROM hidden_conversations WHERE chat_id = ? AND user_id = ?")
        .bind(actualChatId, currentUserId)
        .run();
    } catch (unhideError) {
      console.error('❌ Error unhiding conversation:', unhideError);
      // Don't fail the request for this
    }

    // Get the complete message object with correct timestamp
    const messageResult = await db
      .prepare("SELECT id, chat_id, from_id, text, created_at, read_at FROM messages WHERE id = ?")
      .bind(messageId)
      .first();

    return NextResponse.json({ 
      success: true,
      messageId,
      chatId: actualChatId,
      message: messageResult
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
