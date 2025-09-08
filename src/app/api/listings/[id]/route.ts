// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '@/shims/async_hooks';
import { NextResponse } from "next/server";
// Import dynamically to avoid top-level failures if adapter not present

export const runtime = "edge";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
  if (!mod || typeof mod.getRequestContext !== "function") {
    return NextResponse.json({ error: "@cloudflare/next-on-pages not available" }, { status: 500 });
  }
  const db = mod.getRequestContext().env.DB as D1Database;
  
  // Handle both string and numeric IDs
  let id: string | number = params.id;
  
  // Try to convert to number if it's a string that looks like a number
  if (typeof id === 'string' && /^\d+$/.test(id)) {
    const numericId = Number(id);
    if (Number.isInteger(numericId) && numericId > 0) {
      id = numericId;
    }
  }
  
  // If it's still a string (like 'V6PJhUdwoU'), we'll use it as-is
  // If it's a number, we'll use it as-is
  if (typeof id === 'string' && !/^[A-Za-z0-9]+$/.test(id)) {
    return NextResponse.json({ error: "invalid id format" }, { status: 400 });
  }
  
  try {
    
    // Get listing data with seller information
    const listing = await db.prepare(`
      SELECT 
        l.*,
        u.username as seller_username,
        u.thumbs_up as seller_thumbs_up,
        u.deals as seller_deals,
        u.verified as seller_verified
      FROM listings l
      LEFT JOIN users u ON l.posted_by = u.id
      WHERE l.id = ?
    `).bind(id).first();
    
    if (!listing) {
      return NextResponse.json({ error: "listing not found" }, { status: 404 });
    }
    
    
    // Type assertion for the database result
    const dbListing = listing as any;
    
    // Fetch real images from listing_images table
    let images: string[] = [];
    try {
      const imagesResult = await db.prepare(`
        SELECT image_url, image_order 
        FROM listing_images 
        WHERE listing_id = ? 
        ORDER BY image_order
      `).bind(id).all();
      
      if (imagesResult.results && imagesResult.results.length > 0) {
        images = imagesResult.results.map((row: any) => row.image_url);
      } else if (dbListing.image_url && dbListing.image_url.trim()) {
        // Fallback to the original image_url field
        images = [dbListing.image_url];
      }
    } catch (error) {
      console.error('🔍 Error fetching images:', error);
      // Fallback to the original image_url field
      if (dbListing.image_url && dbListing.image_url.trim()) {
        images = [dbListing.image_url];
      }
    }
    
    // Transform the data to match the expected Listing interface
    const transformedListing = {
      id: String(dbListing.id),
      title: dbListing.title || 'Untitled',
      description: dbListing.description || 'No description available',
      priceSats: Number(dbListing.price_sat) || 0,
      pricingType: dbListing.pricing_type || 'fixed',
      category: dbListing.category || 'Featured',
      location: dbListing.location || 'Unknown',
      lat: Number(dbListing.lat) || 0,
      lng: Number(dbListing.lng) || 0,
      type: dbListing.type || 'sell',
      images: images, // Use real images from listing_images table
      boostedUntil: dbListing.boosted_until || null,
      seller: {
        name: dbListing.seller_username || 'Unknown',
        score: 0,
        deals: Number(dbListing.seller_deals) || 0,
        rating: 0,
        thumbsUp: Number(dbListing.seller_thumbs_up) || 0,
        verifications: {
          email: Boolean(dbListing.seller_verified),
          phone: false,
          lnurl: false
        },
        onTimeRelease: 0
      },
      createdAt: Number(dbListing.created_at) || Date.now()
    };
    
    return NextResponse.json(transformedListing);
  } catch (error) {
    console.error('🔍 Error fetching listing:', error);
    return NextResponse.json({ 
      error: "internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const mod = await import("@cloudflare/next-on-pages").catch(() => null as any);
  if (!mod || typeof mod.getRequestContext !== "function") {
    return NextResponse.json({ error: "@cloudflare/next-on-pages not available" }, { status: 500 });
  }
  const db = mod.getRequestContext().env.DB as D1Database;
  
  // Handle both string and numeric IDs
  let id: string | number = params.id;
  
  // Try to convert to number if it's a string that looks like a number
  if (typeof id === 'string' && /^\d+$/.test(id)) {
    const numericId = Number(id);
    if (Number.isInteger(numericId) && numericId > 0) {
      id = numericId;
    }
  }
  
  // If it's still a string (like 'V6PJhUdwoU'), we'll use it as-is
  // If it's a number, we'll use it as-is
  if (typeof id === 'string' && !/^[A-Za-z0-9]+$/.test(id)) {
    return NextResponse.json({ error: "invalid id format" }, { status: 400 });
  }
  
  const res = await db.prepare("DELETE FROM listings WHERE id = ?").bind(id).run();
  const changes = (res as any).meta?.changes ?? 0;
  return NextResponse.json({ ok: changes > 0 });
}
