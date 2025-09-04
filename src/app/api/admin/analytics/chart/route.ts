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
      // Get current total users first
      const totalUsersResult = await db.prepare(`
        SELECT COUNT(*) as totalUsers FROM users
      `).first();
      
      const totalUsers = (totalUsersResult as any)?.totalUsers || 0;
      
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

      const growthData = (userGrowthResult.results || []).map((row: any) => ({
        date: row.date,
        value: row.cumulativeUsers
      }));
      
      // If no data in timeframe, create a horizontal line at current total
      if (growthData.length === 0 && totalUsers > 0) {
        const today = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        const daysBack = timeRange === '24h' ? 1 : 
                        timeRange === '7d' ? 7 : 
                        timeRange === '30d' ? 30 : 
                        timeRange === '90d' ? 90 : 365;
        startDate.setDate(startDate.getDate() - daysBack);
        const startDateStr = startDate.toISOString().split('T')[0];
        
        // Create multiple points for a proper horizontal line
        const numPoints = Math.max(3, Math.min(daysBack, 10)); // 3-10 points depending on timeframe
        result = [];
        
        for (let i = 0; i < numPoints; i++) {
          const pointDate = new Date(startDate);
          pointDate.setDate(startDate.getDate() + (i * daysBack / (numPoints - 1)));
          const pointDateStr = pointDate.toISOString().split('T')[0];
          
          result.push({
            date: pointDateStr,
            value: totalUsers
          });
        }
      } else {
        result = growthData;
      }
    } else if (chartType === 'listings') {
      // Get current total listings first
      const totalListingsResult = await db.prepare(`
        SELECT COUNT(*) as totalListings FROM listings
      `).first();
      
      const totalListings = (totalListingsResult as any)?.totalListings || 0;
      
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

      const growthData = (listingGrowthResult.results || []).map((row: any) => ({
        date: row.date,
        value: row.cumulativeListings
      }));
      
      // If no data in timeframe, create a horizontal line at current total
      if (growthData.length === 0 && totalListings > 0) {
        const today = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        const daysBack = timeRange === '24h' ? 1 : 
                        timeRange === '7d' ? 7 : 
                        timeRange === '30d' ? 30 : 
                        timeRange === '90d' ? 90 : 365;
        startDate.setDate(startDate.getDate() - daysBack);
        const startDateStr = startDate.toISOString().split('T')[0];
        
        // Create multiple points for a proper horizontal line
        const numPoints = Math.max(3, Math.min(daysBack, 10)); // 3-10 points depending on timeframe
        result = [];
        
        for (let i = 0; i < numPoints; i++) {
          const pointDate = new Date(startDate);
          pointDate.setDate(startDate.getDate() + (i * daysBack / (numPoints - 1)));
          const pointDateStr = pointDate.toISOString().split('T')[0];
          
          result.push({
            date: pointDateStr,
            value: totalListings
          });
        }
      } else {
        result = growthData;
      }
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
