import '@/shims/async_hooks';
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    // Try to get userEmail from query parameters first, then from session
    const url = new URL(req.url);
    const userEmailParam = url.searchParams.get('userEmail');
    
    let userEmail: string;
    if (userEmailParam) {
      userEmail = userEmailParam;
    } else {
      const session = await getSessionFromRequest(req);
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userEmail = session.user.email;
    }

    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Get user ID from email
    const userResult = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(userEmail)
      .first();

    if (!userResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userResult.id;

    // Check for old format chat IDs and migrate them
    try {
      const oldChats = await db
        .prepare("SELECT id FROM chats WHERE id LIKE 'chat_%' AND LENGTH(id) < 20")
        .all();

      if (oldChats.results && oldChats.results.length > 0) {
        // Migrate old format chat IDs
        for (const chat of oldChats.results) {
          const oldId = chat.id;
          const newId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Update chat ID
          await db.prepare("UPDATE chats SET id = ? WHERE id = ?").bind(newId, oldId).run();
          
          // Update message references
          await db.prepare("UPDATE messages SET chat_id = ? WHERE chat_id = ?").bind(newId, oldId).run();
        }
      }
    } catch (migrationError) {
      console.error('🔍 Chat API: Chat ID migration failed:', migrationError);
    }

    // Build the query to get chats for this user (excluding blocked users)
    const basicChatsQuery = `
      SELECT DISTINCT
        c.id,
        c.listing_id,
        c.created_at,
        c.last_message_at,
        l.title as listing_title,
        l.price_sat as listing_price,
        l.location as listing_location,
        COALESCE(li.image_url, '') as listing_image,
        seller.username as seller_name,
        seller.verified as seller_verified,
        seller.rating as seller_rating,
        seller.deals as seller_deals
      FROM chats c
      JOIN listings l ON c.listing_id = l.id
      JOIN users seller ON l.posted_by = seller.id
      LEFT JOIN listing_images li ON l.id = li.listing_id
      WHERE (c.buyer_id = ? OR c.seller_id = ?)
        AND c.buyer_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)
        AND c.seller_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)
        AND c.buyer_id NOT IN (SELECT blocker_id FROM user_blocks WHERE blocked_id = ?)
        AND c.seller_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocked_id = ?)
      ORDER BY c.last_message_at DESC
    `;

    let chats: any;
    try {
      chats = await db
        .prepare(basicChatsQuery)
        .bind(userId, userId, userId, userId, userId, userId)
        .all();
    } catch (dbError) {
      console.error('🔍 Chat API: Database query failed:', dbError);
      return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
    }

    if (!chats.results) {
      return NextResponse.json({ chats: [] });
    }

    // Transform chats to match expected format
    const transformedChats = chats.results.map((chat: any) => ({
      id: chat.id,
      listing: {
        id: chat.listing_id,
        title: chat.listing_title,
        priceSat: chat.listing_price,
        imageUrl: chat.listing_image,
        location: chat.listing_location
      },
      seller: {
        name: chat.seller_name,
        verified: Boolean(chat.seller_verified),
        rating: chat.seller_rating || 0,
        deals: chat.seller_deals || 0
      },
      lastMessageAt: chat.last_message_at * 1000,
      createdAt: chat.created_at * 1000
    }));

    return NextResponse.json({ chats: transformedChats });

  } catch (error) {
    console.error('🔍 Chat API: Error fetching chats:', error);
    console.error('🔍 Chat API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}
