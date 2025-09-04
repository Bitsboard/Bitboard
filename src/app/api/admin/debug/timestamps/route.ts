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

    // Get sample of recent listings with their timestamps
    const query = `
      SELECT 
        id,
        title,
        location,
        created_at,
        datetime(created_at, 'unixepoch') as created_at_readable,
        posted_by
      FROM listings 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    
    const result = await db.prepare(query).all();
    
    // Get count by time ranges
    const now = Math.floor(Date.now() / 1000);
    const timeRanges = {
      '24h': now - (24 * 60 * 60),
      '7d': now - (7 * 24 * 60 * 60),
      '30d': now - (30 * 24 * 60 * 60),
      '90d': now - (90 * 24 * 60 * 60)
    };
    
    const counts: any = {};
    
    for (const [range, boundary] of Object.entries(timeRanges)) {
      const countQuery = `
        SELECT COUNT(*) as count
        FROM listings 
        WHERE created_at > ?
      `;
      const countResult = await db.prepare(countQuery).bind(boundary).first();
      counts[range] = countResult?.count || 0;
    }
    
    // Get total count
    const totalResult = await db.prepare("SELECT COUNT(*) as count FROM listings").first();
    counts.total = totalResult?.count || 0;
    
    return NextResponse.json({
      success: true,
      data: {
        sampleListings: result.results || [],
        counts,
        currentTime: now,
        currentTimeReadable: new Date(now * 1000).toISOString(),
        timeBoundaries: Object.fromEntries(
          Object.entries(timeRanges).map(([range, boundary]) => [
            range, 
            {
              boundary,
              readable: new Date(boundary * 1000).toISOString()
            }
          ])
        )
      }
    });

  } catch (error) {
    console.error('Debug timestamps API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch timestamp data' 
    }, { status: 500 });
  }
}
