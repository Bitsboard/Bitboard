import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
    const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
    if (!mod || typeof mod.getRequestContext !== "function") {
      return NextResponse.json({ error: "adapter_missing" }, { status: 200 });
    }
    
    const env = mod.getRequestContext().env as { DB?: D1Database };
    const db = env.DB;
    if (!db) {
      // Fallback to mock data for local development
      return NextResponse.json({ error: "no_db_binding" }, { status: 200 });
    }

    const username = params.username;
    if (!username) {
      return NextResponse.json({ error: "username_required" }, { status: 400 });
    }

    // Ensure users table exists
    try {
      await db.prepare(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        username TEXT UNIQUE,
        sso TEXT,
        verified INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        image TEXT
      )`).run();
    } catch (error) {
      console.error('Failed to create users table:', error);
    }

    // Ensure listings table exists with proper schema
    try {
      await db.prepare(`CREATE TABLE IF NOT EXISTS listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'Misc',
        ad_type TEXT DEFAULT 'sell',
        location TEXT DEFAULT '',
        lat REAL DEFAULT 0,
        lng REAL DEFAULT 0,
        image_url TEXT DEFAULT '',
        price_sat INTEGER NOT NULL,
        posted_by TEXT DEFAULT '',
        boosted_until INTEGER,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
      )`).run();
    } catch (error) {
      console.error('Failed to create listings table:', error);
    }

    // First, get the user ID from username
    const userResult = await db.prepare(
      'SELECT id, username, verified, created_at, image FROM users WHERE username = ?'
    ).bind(username).all();

    if (!userResult.results || userResult.results.length === 0) {
      return NextResponse.json({ 
        error: "user_not_found",
        message: "User not found" 
      }, { status: 404 });
    }

    const user = userResult.results[0] as any;

    // Get listings for this user
    const listingsResult = await db.prepare(`
      SELECT 
        id,
        title,
        description,
        price_sat as priceSat,
        ad_type as type,
        created_at as createdAt,
        category,
        location,
        lat,
        lng,
        image_url as imageUrl,
        boosted_until as boostedUntil
      FROM listings 
      WHERE posted_by = ? 
      ORDER BY created_at DESC
    `).bind(user.id).all();

    const listings = listingsResult.results || [];

    // Transform listings to match expected format
    const transformedListings = listings.map((listing: any) => ({
      id: listing.id,
      title: listing.title,
      priceSat: listing.priceSat,
      createdAt: listing.createdAt,
      type: listing.type || 'selling',
      description: listing.description || '',
      category: listing.category || 'Misc',
      location: listing.location || '',
      lat: listing.lat || 0,
      lng: listing.lng || 0,
      imageUrl: listing.imageUrl || '',
      boostedUntil: listing.boostedUntil
    }));

    return NextResponse.json({
      user: {
        username: user.username,
        verified: Boolean(user.verified),
        registeredAt: user.created_at,
        profilePhoto: user.image
      },
      listings: transformedListings,
      count: transformedListings.length
    });

  } catch (error) {
    console.error('Error fetching user listings:', error);
    return NextResponse.json({ 
      error: "internal_error",
      message: "Failed to fetch user listings" 
    }, { status: 500 });
  }
}
