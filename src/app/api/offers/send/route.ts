import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const body = await req.json() as {
      chatId: string;
      listingId: string;
      amountSat: number;
      expiresAt?: number;
    };

    let { chatId, listingId, amountSat, expiresAt } = body;

    if (!listingId || !amountSat || amountSat <= 0) {
      return NextResponse.json({ error: "Invalid offer data" }, { status: 400 });
    }

    // Get current user ID
    const currentUserResult = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(session.user.email)
      .first();

    if (!currentUserResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUserId = currentUserResult.id as string;

    let chatResult;
    let otherUserId;
    let createdNewChat = false;

    if (chatId) {
      // Verify chat exists and user is participant
      chatResult = await db
        .prepare(`
          SELECT buyer_id, seller_id, listing_id 
          FROM chats 
          WHERE id = ?
        `)
        .bind(chatId)
        .first();

      if (!chatResult) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }

      const { buyer_id, seller_id, listing_id } = chatResult;
      
      if (listing_id !== listingId) {
        return NextResponse.json({ error: "Chat and listing mismatch" }, { status: 400 });
      }

      // Determine the other user (recipient of the offer)
      otherUserId = currentUserId === buyer_id ? seller_id : buyer_id;
      
      if (!otherUserId) {
        return NextResponse.json({ error: "Invalid chat participants" }, { status: 400 });
      }
    } else {
      // No chat provided, need to create one
      // Get the listing owner (seller)
      const listingResult = await db
        .prepare("SELECT posted_by FROM listings WHERE id = ?")
        .bind(listingId)
        .first();

      if (!listingResult) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      }

      const sellerId = listingResult.posted_by as string;
      
      if (!sellerId) {
        return NextResponse.json({ error: "Listing has no owner" }, { status: 400 });
      }

      // Check if user is trying to make an offer on their own listing
      if (currentUserId === sellerId) {
        return NextResponse.json({ error: "Cannot make offer on your own listing" }, { status: 400 });
      }

      otherUserId = sellerId;

      // Check if chat already exists between these users for this listing
      const existingChatResult = await db
        .prepare(`
          SELECT id FROM chats 
          WHERE listing_id = ? 
          AND ((buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?))
          LIMIT 1
        `)
        .bind(listingId, currentUserId, sellerId, sellerId, currentUserId)
        .first();

      if (existingChatResult) {
        chatId = existingChatResult.id as string;
      } else {
        // Create new chat
        const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const currentTime = Math.floor(Date.now() / 1000);

        await db
          .prepare(`
            INSERT INTO chats (id, listing_id, buyer_id, seller_id, created_at, last_message_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `)
          .bind(newChatId, listingId, currentUserId, sellerId, currentTime, currentTime)
          .run();

        chatId = newChatId;
        createdNewChat = true;
      }
    }

    // Check if listing still exists and is active
    const listingPriceResult = await db
      .prepare("SELECT price_sat FROM listings WHERE id = ? AND status = 'active'")
      .bind(listingId)
      .first();

    if (!listingPriceResult) {
      return NextResponse.json({ error: "Listing not found or inactive" }, { status: 404 });
    }

    const listingPrice = listingPriceResult.price_sat as number;
    
    // Validate offer amount (should be 0 to listing price, or any amount if listing is "make offer")
    if (listingPrice > 0 && amountSat > listingPrice) {
      return NextResponse.json({ 
        error: "Offer amount cannot exceed listing price" 
      }, { status: 400 });
    }

    // Check for existing offers between these two users for this listing
    // No new offers allowed if there's a pending offer OR if the last offer was accepted
    const existingOfferResult = await db
      .prepare(`
        SELECT id, status, from_user_id, to_user_id, created_at
        FROM offers 
        WHERE listing_id = ? 
        AND (
          (from_user_id = ? AND to_user_id = ?) OR 
          (from_user_id = ? AND to_user_id = ?)
        )
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .bind(listingId, currentUserId, otherUserId, otherUserId, currentUserId)
      .first();

    if (existingOfferResult) {
      const { status } = existingOfferResult;
      
      if (status === 'pending') {
        return NextResponse.json({ 
          error: "There is already a pending offer for this listing between you and this user"
        }, { status: 400 });
      }
      
      if (status === 'accepted') {
        return NextResponse.json({ 
          error: "An offer has already been accepted for this listing between you and this user"
        }, { status: 400 });
      }
      
      // If the last offer was declined, revoked, or expired, allow a new offer
    }

    // Create the offer
    const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentTime = Math.floor(Date.now() / 1000);

    const insertResult = await db
      .prepare(`
        INSERT INTO offers (
          id, chat_id, listing_id, from_user_id, to_user_id, 
          amount_sat, expires_at, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `)
      .bind(
        offerId, chatId, listingId, currentUserId, otherUserId,
        amountSat, expiresAt || null, currentTime, currentTime
      )
      .run();

    console.log('🎯 API: Offer insert result:', insertResult);

    // Update chat's last_message_at
    console.log('🎯 API: Updating chat last_message_at');
    await db
      .prepare("UPDATE chats SET last_message_at = ? WHERE id = ?")
      .bind(currentTime, chatId)
      .run();

    // Update user's last_active
    await db
      .prepare("UPDATE users SET last_active = ? WHERE id = ?")
      .bind(currentTime, currentUserId)
      .run();

    return NextResponse.json({
      success: true,
      offerId,
      message: "Offer sent successfully",
      ...(createdNewChat && { newChatId: chatId })
    });

  } catch (error) {
    console.error("Send offer API error:", error);
    return NextResponse.json(
      { error: "Failed to send offer" },
      { status: 500 }
    );
  }
}
