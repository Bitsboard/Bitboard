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
      offerId: string;
      action: 'accept' | 'decline' | 'revoke';
    };

    const { offerId, action } = body;

    if (!offerId || !['accept', 'decline', 'revoke'].includes(action)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
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

    // Get offer details
    const offerResult = await db
      .prepare(`
        SELECT id, chat_id, listing_id, from_user_id, to_user_id, 
               amount_sat, expires_at, status, created_at
        FROM offers 
        WHERE id = ?
      `)
      .bind(offerId)
      .first();

    if (!offerResult) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    const offer = offerResult as {
      id: string;
      chat_id: string;
      listing_id: string;
      from_user_id: string;
      to_user_id: string;
      amount_sat: number;
      expires_at: number | null;
      status: string;
      created_at: number;
    };

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return NextResponse.json({ 
        error: `Offer has already been ${offer.status}` 
      }, { status: 400 });
    }

    // Check if offer has expired
    if (offer.expires_at && offer.expires_at < Math.floor(Date.now() / 1000)) {
      // Mark as expired
      await db
        .prepare("UPDATE offers SET status = 'expired', updated_at = ? WHERE id = ?")
        .bind(Math.floor(Date.now() / 1000), offerId)
        .run();
      
      return NextResponse.json({ 
        error: "This offer has expired" 
      }, { status: 400 });
    }

    // Validate user permissions
    if (action === 'revoke') {
      // Only the offer sender can revoke
      if (offer.from_user_id !== currentUserId) {
        return NextResponse.json({ 
          error: "Only the offer sender can revoke this offer" 
        }, { status: 403 });
      }
    } else if (action === 'accept' || action === 'decline') {
      // Only the offer recipient can accept/decline
      if (offer.to_user_id !== currentUserId) {
        return NextResponse.json({ 
          error: "Only the offer recipient can ${action} this offer" 
        }, { status: 403 });
      }
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const newStatus = action === 'accept' ? 'accepted' : 
                     action === 'decline' ? 'declined' : 'revoked';

    // Update offer status
    await db
      .prepare("UPDATE offers SET status = ?, updated_at = ? WHERE id = ?")
      .bind(newStatus, currentTime, offerId)
      .run();

    // Update chat's last_message_at
    await db
      .prepare("UPDATE chats SET last_message_at = ? WHERE id = ?")
      .bind(currentTime, offer.chat_id)
      .run();

    // Update user's last_active
    await db
      .prepare("UPDATE users SET last_active = ? WHERE id = ?")
      .bind(currentTime, currentUserId)
      .run();

    // If offer was accepted, we might want to mark the listing as sold
    // For now, we'll leave that for future implementation

    return NextResponse.json({
      success: true,
      message: `Offer ${action}ed successfully`,
      newStatus
    });

  } catch (error) {
    console.error("Offer action API error:", error);
    return NextResponse.json(
      { error: "Failed to process offer action" },
      { status: 500 }
    );
  }
}
