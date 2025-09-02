import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "edge";

export async function GET(req: NextRequest) {
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

    const url = new URL(req.url);
    const listingId = url.searchParams.get('listingId');
    const chatId = url.searchParams.get('chatId');

    if (!listingId || !chatId) {
      return NextResponse.json({ error: "Missing listingId or chatId" }, { status: 400 });
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

    // Get chat details to find the other user
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

    // Determine the other user
    const otherUserId = currentUserId === buyer_id ? seller_id : buyer_id;
    
    if (!otherUserId) {
      return NextResponse.json({ error: "Invalid chat participants" }, { status: 400 });
    }

    // Check for existing offers between these users for this listing
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

    const canMakeOffer = !existingOfferResult || 
      (existingOfferResult.status !== 'pending' && existingOfferResult.status !== 'accepted');

    return NextResponse.json({
      canMakeOffer,
      existingOffer: existingOfferResult ? {
        id: existingOfferResult.id,
        status: existingOfferResult.status,
        from_user_id: existingOfferResult.from_user_id,
        to_user_id: existingOfferResult.to_user_id,
        created_at: existingOfferResult.created_at
      } : null
    });

  } catch (error) {
    console.error("Check offer API error:", error);
    return NextResponse.json(
      { error: "Failed to check offer status" },
      { status: 500 }
    );
  }
}
