import { NextResponse } from "next/server";

export const runtime = "edge";

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
      'SELECT id, username, verified, created_at, image, rating, deals FROM users WHERE username = ?'
    ).bind(username).all();

    if (!userResult.results || userResult.results.length === 0) {
      return NextResponse.json({ 
        error: "user_not_found",
        message: "User not found" 
      }, { status: 404 });
    }

    const user = userResult.results[0];

    // Get listings for this user (only active ones) with seller info
    const listingsResult = await db.prepare(`
      SELECT 
        l.id,
        l.title,
        l.description,
        l.price_sat as priceSats,
        l.ad_type as type,
        l.created_at as createdAt,
        l.category,
        l.location,
        l.lat,
        l.lng,
        l.image_url as imageUrl,
        l.boosted_until as boostedUntil,
        l.status,
        u.username as sellerName,
        u.verified as sellerVerified
      FROM listings l
      JOIN users u ON l.posted_by = u.id
      WHERE l.posted_by = ? AND l.status = 'active'
      ORDER BY l.created_at DESC
    `).bind(user.id).all();

    const listings = listingsResult.results || [];

    // Transform listings to match expected format
    const transformedListings = listings.map((listing: any, index: number) => {
      // Use only real images from the database
      let images = [];
      if (listing.imageUrl && listing.imageUrl.trim()) {
        images.push(listing.imageUrl);
      }

      return {
        id: listing.id,
        title: listing.title,
        priceSats: listing.priceSats,
        createdAt: listing.createdAt * 1000, // Convert seconds to milliseconds for formatPostAge
        type: listing.type === 'want' ? 'want' : 'sell', // Convert 'selling' to 'sell'
        description: listing.description || '',
        category: listing.category || 'Misc',
        location: listing.location || '',
        lat: listing.lat || 0,
        lng: listing.lng || 0,
        images: images, // Now we have only real images
        boostedUntil: listing.boostedUntil,
        status: listing.status || 'active',
        seller: {
          name: listing.sellerName,
          verified: Boolean(listing.sellerVerified),
          score: Math.floor(user.rating || 0), // Ensure whole number, default to 0
          deals: user.deals || 0, // Use real deals count
          rating: Math.floor(user.rating || 0), // Ensure whole number, default to 0
          verifications: {
            email: Boolean(listing.sellerVerified),
            phone: false,
            lnurl: false
          },
          onTimeRelease: 100 // Default on-time release percentage
        }
      };
    });

    return NextResponse.json({
      user: {
        username: user.username,
        verified: Boolean(user.verified),
        registeredAt: user.created_at,
        profilePhoto: user.image,
        rating: Math.floor(user.rating || 0), // Ensure whole number, default to 0
        deals: user.deals || 0
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
