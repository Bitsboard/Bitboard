import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
    // Try to get Cloudflare context
    let db: any = null;
    try {
      const mod = await import("@cloudflare/next-on-pages");
      if (mod && typeof mod.getRequestContext === "function") {
        const env = mod.getRequestContext().env as { DB?: any };
        db = env.DB;
      }
    } catch (error) {
      // Cloudflare adapter not available
    }

    // If no database binding, return fallback for local development
    if (!db) {
      return NextResponse.json({ error: "no_db_binding" }, { status: 200 });
    }

    const username = params.username;
    if (!username) {
      return NextResponse.json({ error: "username_required" }, { status: 400 });
    }

    // Get user profile
    const userResult = await db.prepare(`
      SELECT id, username, verified, created_at, image, thumbs_up, deals, last_active
      FROM users WHERE username = ?
    `).bind(username).all();

    if (!userResult.results || userResult.results.length === 0) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    const user = userResult.results[0];

    // Get user's listings
    const listingsResult = await db.prepare(`
      SELECT 
        l.id,
        l.title,
        l.description,
        l.category,
        l.ad_type as type,
        l.price_sat as priceSat,
        l.created_at as createdAt,
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

    // Fetch all images for all listings in one efficient query
    let allImages: any[] = [];
    try {
      if (listings.length > 0) {
        const imageResults = await db
          .prepare(`SELECT listing_id, image_url, image_order 
                    FROM listing_images 
                    WHERE listing_id IN (${listings.map(() => '?').join(',')})
                    ORDER BY listing_id, image_order`)
          .bind(...listings.map((l: any) => l.id))
          .all();
        allImages = imageResults.results ?? [];
      }
    } catch (error) {
      console.error('🔍 User listings API: Images query failed:', error);
      allImages = [];
    }

    // Group images by listing_id
    const imagesByListing = allImages.reduce((acc: any, img: any) => {
      if (!acc[img.listing_id]) {
        acc[img.listing_id] = [];
      }
      acc[img.listing_id].push(img.image_url);
      return acc;
    }, {});

    // Transform listings to match expected format
    const transformedListings = listings.map((listing: any, index: number) => {
      // Get real images for this listing, fallback to single image if none found
      const realImages = imagesByListing[listing.id] || [];
      const fallbackImages = listing.imageUrl && listing.imageUrl.trim() ? [listing.imageUrl] : [];
      const finalImages = realImages.length > 0 ? realImages : fallbackImages;

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
        images: finalImages, // Now we have real multiple images
        boostedUntil: listing.boostedUntil,
        status: listing.status || 'active',
        seller: {
          name: listing.sellerName,
          verified: Boolean(listing.sellerVerified),
          thumbsUp: Math.floor(user.thumbs_up || 0), // Ensure whole number, default to 0
          deals: user.deals || 0, // Use real deals count
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
        thumbsUp: Math.floor(user.thumbs_up || 0), // Ensure whole number, default to 0
        deals: user.deals || 0,
        lastActive: user.last_active || user.created_at
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
