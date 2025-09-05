import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/cf";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'users';
    const timeframe = searchParams.get('timeframe') || '30d';

    const db = await getD1();
    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    // Calculate date range based on timeframe
    let dateFilter = '';
    switch (timeframe) {
      case '7d':
        dateFilter = "datetime('now', '-7 days')";
        break;
      case '30d':
        dateFilter = "datetime('now', '-30 days')";
        break;
      case '90d':
        dateFilter = "datetime('now', '-90 days')";
        break;
      case 'all':
        dateFilter = "datetime('2020-01-01')"; // Far back enough
        break;
      default:
        dateFilter = "datetime('now', '-30 days')";
    }

    let data: any[] = [];

    if (type === 'users') {
      // Get user growth data with cumulative totals
      const result = await db.prepare(`
        WITH daily_users AS (
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as daily_count
          FROM users 
          WHERE created_at > ${dateFilter}
          GROUP BY DATE(created_at)
        ),
        cumulative_users AS (
          SELECT 
            date,
            daily_count,
            SUM(daily_count) OVER (ORDER BY date) as value
          FROM daily_users
        )
        SELECT date, value
        FROM cumulative_users
        ORDER BY date ASC
      `).all();
      
      data = result.results || [];
    } else if (type === 'listings') {
      // Get listing growth data with cumulative totals
      const result = await db.prepare(`
        WITH daily_listings AS (
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as daily_count
          FROM listings 
          WHERE created_at > ${dateFilter}
          GROUP BY DATE(created_at)
        ),
        cumulative_listings AS (
          SELECT 
            date,
            daily_count,
            SUM(daily_count) OVER (ORDER BY date) as value
          FROM daily_listings
        )
        SELECT date, value
        FROM cumulative_listings
        ORDER BY date ASC
      `).all();
      
      data = result.results || [];
    }

    // If no data, return a single point with current count
    if (data.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      if (type === 'users') {
        const totalUsers = await db.prepare(`SELECT COUNT(*) as count FROM users`).first();
        data = [{ date: today, value: Number(totalUsers?.count || 0) }];
      } else {
        const totalListings = await db.prepare(`SELECT COUNT(*) as count FROM listings`).first();
        data = [{ date: today, value: Number(totalListings?.count || 0) }];
      }
    } else {
      // Ensure we have at least one data point for the current date
      const today = new Date().toISOString().split('T')[0];
      const hasToday = data.some(d => d.date === today);
      
      if (!hasToday) {
        // Add today's data point with the last cumulative value
        const lastValue = data.length > 0 ? data[data.length - 1].value : 0;
        data.push({ date: today, value: lastValue });
      }
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Chart API error:', error);
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    );
  }
}
