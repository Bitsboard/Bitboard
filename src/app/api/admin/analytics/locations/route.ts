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
    const viewType = url.searchParams.get('type') || 'users'; // 'users' or 'listings'
    
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
    
    if (viewType === 'users') {
      // Get user location data
      const userLocationsResult = await db.prepare(`
        SELECT 
          location,
          COUNT(*) as userCount,
          AVG(lat) as avgLat,
          AVG(lng) as avgLng
        FROM users 
        WHERE created_at > ? AND location IS NOT NULL AND location != ''
        GROUP BY location
        ORDER BY userCount DESC
        LIMIT 50
      `).bind(timeBoundary).all();

      result = (userLocationsResult.results || []).map((row: any) => ({
        location: row.location,
        userCount: row.userCount,
        lat: row.avgLat || 0,
        lng: row.avgLng || 0
      }));
    } else if (viewType === 'listings') {
      // Get listing location data
      const listingLocationsResult = await db.prepare(`
        SELECT 
          location,
          COUNT(*) as listingCount,
          AVG(lat) as avgLat,
          AVG(lng) as avgLng
        FROM listings 
        WHERE created_at > ? AND location IS NOT NULL AND location != ''
        GROUP BY location
        ORDER BY listingCount DESC
        LIMIT 50
      `).bind(timeBoundary).all();

      result = (listingLocationsResult.results || []).map((row: any) => ({
        location: row.location,
        userCount: row.listingCount, // Using userCount field for consistency with WorldMap component
        lat: row.avgLat || 0,
        lng: row.avgLng || 0
      }));
    } else {
      return NextResponse.json({ error: "Invalid view type" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Analytics locations API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch location data' 
    }, { status: 500 });
  }
}
