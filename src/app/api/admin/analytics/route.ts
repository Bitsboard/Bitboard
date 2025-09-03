import '@/shims/async_hooks';
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || '7d';
    
    // Calculate time boundaries
    const now = Math.floor(Date.now() / 1000);
    let timeBoundary: number;
    
    switch (timeRange) {
      case '24h':
        timeBoundary = now - (24 * 60 * 60);
        break;
      case '7d':
        timeBoundary = now - (7 * 24 * 60 * 60);
        break;
      case '30d':
        timeBoundary = now - (30 * 24 * 60 * 60);
        break;
      case '90d':
        timeBoundary = now - (90 * 24 * 60 * 60);
        break;
      default:
        timeBoundary = now - (7 * 24 * 60 * 60);
    }

    // Get overview statistics
    const [
      totalUsers,
      totalListings,
      totalChats,
      totalMessages,
      totalOffers,
      activeUsers24h,
      newUsers24h,
      newListings24h,
      newChats24h
    ] = await Promise.all([
      // Total users
      db.prepare("SELECT COUNT(*) as count FROM users").first(),
      
      // Total listings
      db.prepare("SELECT COUNT(*) as count FROM listings").first(),
      
      // Total chats
      db.prepare("SELECT COUNT(*) as count FROM chats").first(),
      
      // Total messages
      db.prepare("SELECT COUNT(*) as count FROM messages").first(),
      
      // Total offers
      db.prepare("SELECT COUNT(*) as count FROM offers").first(),
      
      // Active users in last 24h
      db.prepare("SELECT COUNT(*) as count FROM users WHERE last_active > ?").bind(now - (24 * 60 * 60)).first(),
      
      // New users in last 24h
      db.prepare("SELECT COUNT(*) as count FROM users WHERE created_at > ?").bind(now - (24 * 60 * 60)).first(),
      
      // New listings in last 24h
      db.prepare("SELECT COUNT(*) as count FROM listings WHERE created_at > ?").bind(now - (24 * 60 * 60)).first(),
      
      // New chats in last 24h
      db.prepare("SELECT COUNT(*) as count FROM chats WHERE created_at > ?").bind(now - (24 * 60 * 60)).first()
    ]);

    // Get user growth data
    const userGrowthResult = await db.prepare(`
      SELECT 
        DATE(datetime(created_at, 'unixepoch')) as date,
        COUNT(*) as users,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as newUsers
      FROM users 
      WHERE created_at > ?
      GROUP BY DATE(datetime(created_at, 'unixepoch'))
      ORDER BY date DESC
      LIMIT 30
    `).bind(timeBoundary, timeBoundary).all();

    // Get listing statistics by category
    const listingStatsResult = await db.prepare(`
      SELECT 
        category,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM listings), 1) as percentage
      FROM listings 
      WHERE created_at > ?
      GROUP BY category
      ORDER BY count DESC
    `).bind(timeBoundary).all();

    // Get location statistics
    const locationStatsResult = await db.prepare(`
      SELECT 
        location,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM listings), 1) as percentage
      FROM listings 
      WHERE created_at > ? AND location IS NOT NULL AND location != ''
      GROUP BY location
      ORDER BY count DESC
      LIMIT 20
    `).bind(timeBoundary).all();

    // Get top users by activity
    const topUsersResult = await db.prepare(`
      SELECT 
        u.username,
        COUNT(DISTINCT l.id) as listings,
        COUNT(DISTINCT c.id) as chats,
        COALESCE(u.thumbs_up, 0) as reputation
      FROM users u
      LEFT JOIN listings l ON u.id = l.posted_by
      LEFT JOIN chats c ON (u.id = c.buyer_id OR u.id = c.seller_id)
      WHERE u.created_at > ?
      GROUP BY u.id, u.username, u.thumbs_up
      ORDER BY reputation DESC, listings DESC
      LIMIT 10
    `).bind(timeBoundary).all();

    // Get popular searches (mock data for now - would need search logging)
    const popularSearches = [
      { query: "bitcoin mining", count: 45 },
      { query: "ASIC miner", count: 38 },
      { query: "gaming PC", count: 32 },
      { query: "iPhone", count: 28 },
      { query: "MacBook", count: 25 },
      { query: "bicycle", count: 22 },
      { query: "camera", count: 19 },
      { query: "tools", count: 16 },
      { query: "furniture", count: 14 },
      { query: "books", count: 12 }
    ];

    // Performance metrics (mock data - would need actual monitoring)
    const performance = {
      avgResponseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
      errorRate: Math.random() * 2, // 0-2%
      uptime: 99.5 + Math.random() * 0.5, // 99.5-100%
      apiCalls24h: Math.floor(Math.random() * 10000) + 5000 // 5k-15k calls
    };

    // Security metrics (mock data - would need actual security monitoring)
    const security = {
      blockedIPs: Math.floor(Math.random() * 50) + 10, // 10-60 blocked IPs
      failedLogins: Math.floor(Math.random() * 200) + 50, // 50-250 failed logins
      suspiciousActivity: Math.floor(Math.random() * 20) + 5, // 5-25 suspicious activities
      rateLimitHits: Math.floor(Math.random() * 100) + 20 // 20-120 rate limit hits
    };

    const analyticsData = {
      overview: {
        totalUsers: (totalUsers as any)?.count || 0,
        totalListings: (totalListings as any)?.count || 0,
        totalChats: (totalChats as any)?.count || 0,
        totalMessages: (totalMessages as any)?.count || 0,
        totalOffers: (totalOffers as any)?.count || 0,
        activeUsers24h: (activeUsers24h as any)?.count || 0,
        newUsers24h: (newUsers24h as any)?.count || 0,
        newListings24h: (newListings24h as any)?.count || 0,
        newChats24h: (newChats24h as any)?.count || 0
      },
      userGrowth: (userGrowthResult.results || []).map((row: any) => ({
        date: row.date,
        users: row.users,
        newUsers: row.newUsers
      })),
      listingStats: (listingStatsResult.results || []).map((row: any) => ({
        category: row.category,
        count: row.count,
        percentage: row.percentage
      })),
      locationStats: (locationStatsResult.results || []).map((row: any) => ({
        location: row.location,
        count: row.count,
        percentage: row.percentage
      })),
      performance,
      security,
      popularSearches,
      topUsers: (topUsersResult.results || []).map((row: any) => ({
        username: row.username,
        listings: row.listings,
        chats: row.chats,
        reputation: row.reputation
      }))
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
