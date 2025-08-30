import '../../../../shims/async_hooks';
import { NextResponse } from "next/server";
import { getD1, ensureChatSchema } from '@/lib/cf';

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const db = await getD1();
    if (!db) {
      return NextResponse.json({ error: 'no_db_binding' }, { status: 500 });
    }

    // Ensure chat schema exists
    await ensureChatSchema(db);

    // Get user statistics
    const userStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN verified = 1 THEN 1 END) as verified_users,
        COUNT(CASE WHEN is_admin = 1 THEN 1 END) as admin_users,
        COUNT(CASE WHEN banned = 1 THEN 1 END) as banned_users,
        COUNT(CASE WHEN created_at >= strftime('%s', 'now', '-7 days') THEN 1 END) as new_users_7d,
        COUNT(CASE WHEN created_at >= strftime('%s', 'now', '-30 days') THEN 1 END) as new_users_30d
      FROM users
    `).all();

    // Get listing statistics
    const listingStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_listings,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_listings,
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_listings,
        COUNT(CASE WHEN created_at >= strftime('%s', 'now', '-7 days') THEN 1 END) as new_listings_7d,
        COUNT(CASE WHEN created_at >= strftime('%s', 'now', '-30 days') THEN 1 END) as new_listings_30d,
        AVG(price_sat) as avg_price_sats,
        SUM(CASE WHEN status = 'active' THEN price_sat ELSE 0 END) as total_value_active
      FROM listings
    `).all();

    // Get chat statistics
    const chatStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_chats,
        COUNT(CASE WHEN created_at >= strftime('%s', 'now', '-7 days') THEN 1 END) as new_chats_7d,
        COUNT(CASE WHEN created_at >= strftime('%s', 'now', '-30 days') THEN 1 END) as new_chats_30d
      FROM chats
    `).all();

    // Get message statistics
    const messageStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN created_at >= strftime('%s', 'now', '-7 days') THEN 1 END) as new_messages_7d,
        COUNT(CASE WHEN created_at >= strftime('%s', 'now', '-30 days') THEN 1 END) as new_messages_30d,
        COUNT(CASE WHEN read_at IS NULL OR read_at = 0 THEN 1 END) as unread_messages
      FROM messages
    `).all();

    // Get recent activity with simplified queries
    const recentActivity = await db.prepare(`
      SELECT 
        'user' as type,
        u.username as username,
        u.id as user_id,
        u.email as email,
        'created account' as action,
        u.created_at as timestamp,
        NULL as listing_title,
        NULL as listing_id,
        NULL as other_username,
        NULL as chat_id,
        NULL as message_count
      FROM users u
      WHERE u.created_at >= strftime('%s', 'now', '-7 days')
      ORDER BY u.created_at DESC
      LIMIT 10
    `).all();

    const recentListings = await db.prepare(`
      SELECT 
        'listing' as type,
        u.username as username,
        u.id as user_id,
        u.email as email,
        'listed' as action,
        l.created_at as timestamp,
        l.title as listing_title,
        l.id as listing_id,
        NULL as other_username,
        NULL as chat_id,
        NULL as message_count
      FROM listings l
      JOIN users u ON l.posted_by = u.id
      WHERE l.created_at >= strftime('%s', 'now', '-7 days')
      ORDER BY l.created_at DESC
      LIMIT 10
    `).all();

    const recentMessages = await db.prepare(`
      SELECT 
        'message' as type,
        u.username as username,
        u.id as user_id,
        u.email as email,
        'messaged' as action,
        m.created_at as timestamp,
        l.title as listing_title,
        l.id as listing_id,
        CASE 
          WHEN c.buyer_id = m.from_id THEN 
            (SELECT username FROM users WHERE id = c.seller_id)
          ELSE 
            (SELECT username FROM users WHERE id = c.buyer_id)
        END as other_username,
        m.chat_id as chat_id,
        (SELECT COUNT(*) FROM messages WHERE chat_id = m.chat_id) as message_count
      FROM messages m
      JOIN users u ON m.from_id = u.id
      JOIN chats c ON m.chat_id = c.id
      JOIN listings l ON c.listing_id = l.id
      WHERE m.created_at >= strftime('%s', 'now', '-7 days')
      ORDER BY m.created_at DESC
      LIMIT 10
    `).all();

    // Combine and sort all recent activity
    const allActivity = [
      ...recentActivity.results || [],
      ...recentListings.results || [],
      ...recentMessages.results || []
    ].sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 30);

    const stats = {
      users: {
        total: Number(userStats.results?.[0]?.total_users) || 0,
        verified: Number(userStats.results?.[0]?.verified_users) || 0,
        admin: Number(userStats.results?.[0]?.admin_users) || 0,
        banned: Number(userStats.results?.[0]?.banned_users) || 0,
        new7d: Number(userStats.results?.[0]?.new_users_7d) || 0,
        new30d: Number(userStats.results?.[0]?.new_users_30d) || 0
      },
      listings: {
        total: Number(listingStats.results?.[0]?.total_listings) || 0,
        active: Number(listingStats.results?.[0]?.active_listings) || 0,
        sold: Number(listingStats.results?.[0]?.sold_listings) || 0,
        new7d: Number(listingStats.results?.[0]?.new_listings_7d) || 0,
        new30d: Number(listingStats.results?.[0]?.new_listings_30d) || 0,
        avgPriceSats: Math.round(Number(listingStats.results?.[0]?.avg_price_sats) || 0),
        totalValueActive: Number(listingStats.results?.[0]?.total_value_active) || 0
      },
      conversations: {
        total: Number(chatStats.results?.[0]?.total_chats) || 0,
        messages: Number(messageStats.results?.[0]?.total_messages) || 0,
        unread: Number(messageStats.results?.[0]?.unread_messages) || 0,
        new7d: Number(chatStats.results?.[0]?.new_chats_7d) || 0,
        new30d: Number(chatStats.results?.[0]?.new_chats_30d) || 0
      },
      recentActivity: allActivity
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
