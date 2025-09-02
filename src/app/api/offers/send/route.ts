import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  console.log('🎯 API: /api/offers/send POST called');
  
  try {
    const session = await getSessionFromRequest(req);
    console.log('🎯 API: Session:', session?.user?.email ? 'Found' : 'Not found');
    
    if (!session?.user?.email) {
      console.log('❌ API: No session, returning 401');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      console.log('❌ API: No database connection');
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const body = await req.json() as {
      chatId: string;
      listingId: string;
      amountSat: number;
      expiresAt?: number;
    };

    console.log('🎯 API: Request body:', body);

    const { chatId, listingId, amountSat, expiresAt } = body;

    if (!chatId || !listingId || !amountSat || amountSat <= 0) {
      console.log('❌ API: Invalid offer data:', { chatId, listingId, amountSat });
      return NextResponse.json({ error: "Invalid offer data" }, { status: 400 });
    }

    // Get current user ID
    console.log('🎯 API: Looking up user ID for email:', session.user.email);
    const currentUserResult = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(session.user.email)
      .first();

    if (!currentUserResult) {
      console.log('❌ API: User not found in database');
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUserId = currentUserResult.id as string;
    console.log('🎯 API: Current user ID:', currentUserId);

    // Verify chat exists and user is participant
    console.log('🎯 API: Looking up chat:', chatId);
    const chatResult = await db
      .prepare(`
        SELECT buyer_id, seller_id, listing_id 
        FROM chats 
        WHERE id = ?
      `)
      .bind(chatId)
      .first();

    if (!chatResult) {
      console.log('❌ API: Chat not found');
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const { buyer_id, seller_id, listing_id } = chatResult;
    console.log('🎯 API: Chat details:', { buyer_id, seller_id, listing_id });
    
    if (listing_id !== listingId) {
      console.log('❌ API: Chat and listing mismatch:', { listing_id, listingId });
      return NextResponse.json({ error: "Chat and listing mismatch" }, { status: 400 });
    }

    // Determine the other user (recipient of the offer)
    const otherUserId = currentUserId === buyer_id ? seller_id : buyer_id;
    console.log('🎯 API: Other user ID:', otherUserId);
    
    if (!otherUserId) {
      console.log('❌ API: Invalid chat participants');
      return NextResponse.json({ error: "Invalid chat participants" }, { status: 400 });
    }

    // Check if listing still exists and is active
    console.log('🎯 API: Checking listing:', listingId);
    const listingResult = await db
      .prepare("SELECT price_sat FROM listings WHERE id = ? AND status = 'active'")
      .bind(listingId)
      .first();

    if (!listingResult) {
      console.log('❌ API: Listing not found or inactive');
      return NextResponse.json({ error: "Listing not found or inactive" }, { status: 404 });
    }

    const listingPrice = listingResult.price_sat as number;
    console.log('🎯 API: Listing price:', listingPrice);
    
    // Validate offer amount (should be 0 to listing price, or any amount if listing is "make offer")
    if (listingPrice > 0 && amountSat > listingPrice) {
      console.log('❌ API: Offer amount exceeds listing price:', { amountSat, listingPrice });
      return NextResponse.json({ 
        error: "Offer amount cannot exceed listing price" 
      }, { status: 400 });
    }

    // Check for existing offers between these two users for this listing
    // No new offers allowed if there's a pending offer OR if the last offer was accepted
    console.log('🎯 API: Checking for existing offers between users');
    console.log('🎯 API: Query params:', { listingId, currentUserId, otherUserId });
    
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
    
    console.log('🎯 API: Existing offer query result:', existingOfferResult);

    if (existingOfferResult) {
      const { status, from_user_id, to_user_id } = existingOfferResult;
      console.log('🎯 API: Found existing offer:', { status, from_user_id, to_user_id });
      
      if (status === 'pending') {
        console.log('❌ API: Pending offer exists between these users');
        return NextResponse.json({ 
          error: "There is already a pending offer for this listing between you and this user",
          debug: {
            existingOfferFound: true,
            existingOfferStatus: status,
            validationPassed: false,
            reason: 'pending_offer_exists'
          }
        }, { status: 400 });
      }
      
      if (status === 'accepted') {
        console.log('❌ API: Accepted offer exists between these users');
        return NextResponse.json({ 
          error: "An offer has already been accepted for this listing between you and this user",
          debug: {
            existingOfferFound: true,
            existingOfferStatus: status,
            validationPassed: false,
            reason: 'accepted_offer_exists'
          }
        }, { status: 400 });
      }
      
      // If the last offer was declined, revoked, or expired, allow a new offer
      console.log('🎯 API: Last offer was', status, '- allowing new offer');
    }

    // Create the offer
    const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentTime = Math.floor(Date.now() / 1000);

    console.log('🎯 API: Creating offer with ID:', offerId);
    console.log('🎯 API: Offer data:', {
      offerId, chatId, listingId, currentUserId, otherUserId,
      amountSat, expiresAt, currentTime
    });

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
    console.log('🎯 API: Updating user last_active');
    await db
      .prepare("UPDATE users SET last_active = ? WHERE id = ?")
      .bind(currentTime, currentUserId)
      .run();

    console.log('✅ API: Offer created successfully');
    return NextResponse.json({
      success: true,
      offerId,
      message: "Offer sent successfully",
      debug: {
        existingOfferFound: !!existingOfferResult,
        existingOfferStatus: existingOfferResult?.status || 'none',
        validationPassed: true
      }
    });

  } catch (error) {
    console.error("Send offer API error:", error);
    return NextResponse.json(
      { error: "Failed to send offer" },
      { status: 500 }
    );
  }
}
