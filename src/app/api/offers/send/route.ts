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

    const { chatId, listingId, amountSat, expiresAt } = body;

    if (!chatId || !listingId || !amountSat || amountSat <= 0) {
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

    // Verify chat exists and user is participant
    const chatResult = await db
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
    const otherUserId = currentUserId === buyer_id ? seller_id : buyer_id;
    
    if (!otherUserId) {
      return NextResponse.json({ error: "Invalid chat participants" }, { status: 400 });
    }

    // Check if listing still exists and is active
    const listingResult = await db
      .prepare("SELECT price_sat FROM listings WHERE id = ? AND status = 'active'")
      .bind(listingId)
      .first();

    if (!listingResult) {
      return NextResponse.json({ error: "Listing not found or inactive" }, { status: 404 });
    }

    const listingPrice = listingResult.price_sat as number;
    
    // Validate offer amount (should be 0 to listing price, or any amount if listing is "make offer")
    if (listingPrice > 0 && amountSat > listingPrice) {
      return NextResponse.json({ 
        error: "Offer amount cannot exceed listing price" 
      }, { status: 400 });
    }

    // Check for existing pending offers from this user for this listing
    const existingOfferResult = await db
      .prepare(`
        SELECT id FROM offers 
        WHERE from_user_id = ? AND listing_id = ? AND status = 'pending'
      `)
      .bind(currentUserId, listingId)
      .first();

    if (existingOfferResult) {
      return NextResponse.json({ 
        error: "You already have a pending offer for this listing" 
      }, { status: 400 });
    }

    // Create the offer
    const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentTime = Math.floor(Date.now() / 1000);

    await db
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

    // Update chat's last_message_at
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
      message: "Offer sent successfully"
    });

  } catch (error) {
    console.error("Send offer API error:", error);
    return NextResponse.json(
      { error: "Failed to send offer" },
      { status: 500 }
    );
  }
}
