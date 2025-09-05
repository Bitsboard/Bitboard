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

    // Get basic analytics data
    const now = Math.floor(Date.now() / 1000);
    
    const [
      totalUsers,
      totalListings,
      totalMessages,
      totalOffers,
      activeUsers24h,
      newListings24h
    ] = await Promise.all([
      // Total users
      db.prepare("SELECT COUNT(*) as count FROM users").first(),
      
      // Total listings
      db.prepare("SELECT COUNT(*) as count FROM listings").first(),
      
      // Total messages
      db.prepare("SELECT COUNT(*) as count FROM messages").first(),
      
      // Total offers
      db.prepare("SELECT COUNT(*) as count FROM offers").first(),
      
      // Active users in last 24h
      db.prepare("SELECT COUNT(*) as count FROM users WHERE last_active > ?").bind(now - (24 * 60 * 60)).first(),
      
      // New listings in last 7 days
      db.prepare("SELECT COUNT(*) as count FROM listings WHERE created_at > ?").bind(now - (7 * 24 * 60 * 60)).first()
    ]);

    // Get simple user growth data
    const userGrowthResult = await db.prepare(`
      SELECT 
        DATE(datetime(created_at, 'unixepoch')) as date,
        COUNT(*) as users
      FROM users 
      GROUP BY DATE(datetime(created_at, 'unixepoch'))
      ORDER BY date ASC
    `).all();

    // Get simple listing growth data
    const listingGrowthResult = await db.prepare(`
      SELECT 
        DATE(datetime(created_at, 'unixepoch')) as date,
        COUNT(*) as listings
      FROM listings 
      GROUP BY DATE(datetime(created_at, 'unixepoch'))
      ORDER BY date ASC
    `).all();

    // Build simple analytics data
    const analyticsData = {
      overview: {
        totalUsers: (totalUsers as any)?.count || 0,
        totalListings: (totalListings as any)?.count || 0,
        activeUsers24h: (activeUsers24h as any)?.count || 0,
        newListings24h: (newListings24h as any)?.count || 0,
        totalMessages: (totalMessages as any)?.count || 0,
        totalOffers: (totalOffers as any)?.count || 0
      },
      userGrowth: (userGrowthResult.results || []).map((row: any) => ({
        date: row.date,
        users: row.users
      })),
      listingGrowth: (listingGrowthResult.results || []).map((row: any) => ({
        date: row.date,
        listings: row.listings
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