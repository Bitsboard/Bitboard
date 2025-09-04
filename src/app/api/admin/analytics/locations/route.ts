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
    
    console.log(`🌍 API: timeRange=${timeRange}, viewType=${viewType}`);
    
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
      // Get user location data from their listings (since users table doesn't have location)
      let query = `
        SELECT 
          l.location,
          COUNT(DISTINCT l.posted_by) as userCount,
          AVG(l.lat) as avgLat,
          AVG(l.lng) as avgLng
        FROM listings l
        WHERE l.location IS NOT NULL AND l.location != ''
      `;
      
      // Only add time filter if not "all"
      if (timeRange !== 'all') {
        query += ` AND l.created_at > ?`;
      }
      
      query += `
        GROUP BY l.location
        ORDER BY userCount DESC
        LIMIT 50
      `;
      
      console.log(`🌍 Users query:`, query);
      console.log(`🌍 Time boundary:`, timeBoundary, `(${new Date(timeBoundary * 1000).toISOString()})`);
      
      const userLocationsResult = timeRange === 'all' 
        ? await db.prepare(query).all()
        : await db.prepare(query).bind(timeBoundary).all();

      console.log(`🌍 Users query result:`, userLocationsResult);

      result = (userLocationsResult.results || []).map((row: any) => ({
        location: row.location,
        userCount: row.userCount,
        listingCount: 0, // No listings for users view
        lat: row.avgLat || 0,
        lng: row.avgLng || 0
      }));
      
      console.log(`🌍 Mapped users result:`, result);
    } else if (viewType === 'listings') {
      // Get listing location data
      let query = `
        SELECT 
          location,
          COUNT(*) as listingCount,
          AVG(lat) as avgLat,
          AVG(lng) as avgLng
        FROM listings 
        WHERE location IS NOT NULL AND location != ''
      `;
      
      // Only add time filter if not "all"
      if (timeRange !== 'all') {
        query += ` AND created_at > ?`;
      }
      
      query += `
        GROUP BY location
        ORDER BY listingCount DESC
        LIMIT 50
      `;
      
      console.log(`🌍 Listings query:`, query);
      console.log(`🌍 Time boundary:`, timeBoundary, `(${new Date(timeBoundary * 1000).toISOString()})`);
      
      const listingLocationsResult = timeRange === 'all' 
        ? await db.prepare(query).all()
        : await db.prepare(query).bind(timeBoundary).all();

      console.log(`🌍 Listings query result:`, listingLocationsResult);

      result = (listingLocationsResult.results || []).map((row: any) => ({
        location: row.location,
        userCount: 0, // No users for listings view
        listingCount: row.listingCount,
        lat: row.avgLat || 0,
        lng: row.avgLng || 0
      }));
      
      console.log(`🌍 Mapped listings result:`, result);
    } else {
      return NextResponse.json({ error: "Invalid view type" }, { status: 400 });
    }

    console.log(`🌍 Final API response:`, { success: true, data: result });
    
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
