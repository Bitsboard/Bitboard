import { NextResponse } from "next/server";

// Edge runtime for production, standard for local development
// export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
    console.log('User listings API called for username:', params.username);
    
    // Try to get Cloudflare context
    let db: any = null;
    try {
      const mod = await import("@cloudflare/next-on-pages");
      if (mod && typeof mod.getRequestContext === "function") {
        const env = mod.getRequestContext().env as { DB?: any };
        db = env.DB;
      }
    } catch (error) {
      console.log('Cloudflare adapter not available, using fallback');
    }

    // If no database binding, return fallback for local development
    if (!db) {
      console.log('Local development mode, returning no_db_binding error');
      return NextResponse.json({ error: "no_db_binding" }, { status: 200 });
    }

    const username = params.username;
    if (!username) {
      return NextResponse.json({ error: "username_required" }, { status: 400 });
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

    const user = userResult.results[0];

    // Get listings for this user (only active ones)
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
        boosted_until as boostedUntil,
        status
      FROM listings 
      WHERE posted_by = ? AND status = 'active'
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
      boostedUntil: listing.boostedUntil,
      status: listing.status || 'active'
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
