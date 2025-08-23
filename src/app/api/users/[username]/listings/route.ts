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
      'SELECT id, username, verified, created_at, image FROM users WHERE username = ?'
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

    // Stock images for creating galleries when listings only have one image
    const stockImages = [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1600&auto=format&fit=crop'
    ];

    // Transform listings to match expected format
    const transformedListings = listings.map((listing: any, index: number) => {
      // Create a gallery with the main image + stock images
      let images = [];
      if (listing.imageUrl && listing.imageUrl.trim()) {
        // Start with the main listing image
        images.push(listing.imageUrl);
        // Add 2-3 stock images to create a gallery
        const stockStart = (index * 2) % stockImages.length;
        images.push(stockImages[stockStart]);
        images.push(stockImages[(stockStart + 1) % stockImages.length]);
      } else {
        // If no main image, use stock images
        const stockStart = (index * 2) % stockImages.length;
        images = stockImages.slice(stockStart, stockStart + 3);
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
        images: images, // Now we have a proper gallery array
        boostedUntil: listing.boostedUntil,
        status: listing.status || 'active',
        seller: {
          name: listing.sellerName,
          verified: Boolean(listing.sellerVerified),
          score: 75, // Default score since we don't have this in the DB yet
          deals: 0, // Default deals count
          rating: 4.5, // Default rating
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
