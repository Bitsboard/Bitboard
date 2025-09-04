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
    const chartType = url.searchParams.get('type') || 'users'; // 'users' or 'listings'
    
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
      case 'all':
        timeBoundary = 0; // All time
        break;
      default:
        timeBoundary = now - (7 * 24 * 60 * 60);
    }

    let result;
    
    if (chartType === 'users') {
      // Get user growth data - always show full cumulative history
      const userGrowthResult = await db.prepare(`
        WITH daily_users AS (
          SELECT 
            DATE(datetime(created_at, 'unixepoch')) as date,
            COUNT(*) as newUsers
          FROM users 
          GROUP BY DATE(datetime(created_at, 'unixepoch'))
          ORDER BY date ASC
        ),
        cumulative_users AS (
          SELECT 
            date,
            newUsers,
            SUM(newUsers) OVER (ORDER BY date) as cumulativeUsers
          FROM daily_users
        )
        SELECT * FROM cumulative_users
        WHERE date >= DATE('now', '-' || ? || ' days')
        ORDER BY date ASC
      `).bind(
        timeRange === '24h' ? 1 : 
        timeRange === '7d' ? 7 : 
        timeRange === '30d' ? 30 : 
        timeRange === '90d' ? 90 : 
        365 // For 'all', show last year of data points
      ).all();

      result = (userGrowthResult.results || []).map((row: any) => ({
        date: row.date,
        value: row.cumulativeUsers
      }));
    } else if (chartType === 'listings') {
      // Get listing growth data - always show full cumulative history
      const listingGrowthResult = await db.prepare(`
        WITH daily_listings AS (
          SELECT 
            DATE(datetime(created_at, 'unixepoch')) as date,
            COUNT(*) as newListings
          FROM listings 
          GROUP BY DATE(datetime(created_at, 'unixepoch'))
          ORDER BY date ASC
        ),
        cumulative_listings AS (
          SELECT 
            date,
            newListings,
            SUM(newListings) OVER (ORDER BY date) as cumulativeListings
          FROM daily_listings
        )
        SELECT * FROM cumulative_listings
        WHERE date >= DATE('now', '-' || ? || ' days')
        ORDER BY date ASC
      `).bind(
        timeRange === '24h' ? 1 : 
        timeRange === '7d' ? 7 : 
        timeRange === '30d' ? 30 : 
        timeRange === '90d' ? 90 : 
        365 // For 'all', show last year of data points
      ).all();

      result = (listingGrowthResult.results || []).map((row: any) => ({
        date: row.date,
        value: row.cumulativeListings
      }));
    } else {
      return NextResponse.json({ error: "Invalid chart type" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Analytics chart API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch chart data' 
    }, { status: 500 });
  }
}
